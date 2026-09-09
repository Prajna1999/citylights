"use client";

import { useEffect, useMemo, useState } from "react";
import BookedDatesEditor from "@/components/BookedDatesEditor";
import { createShop } from "@/lib/actions";
import { CATEGORIES } from "@/lib/categories";
import { EVENT_CATEGORY_IDS, type UserRole } from "@/lib/types";

const STORAGE_KEY = "haat-admin-draft-v1";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Draft = {
  name: string;
  nameLocal: string;
  owner: string;
  category: string;
  keywords: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  website: string;
  offlineBooking: boolean;
  bookedDates: string[];
  photoNames: string[];
  photoUrls: (string | null)[];
  lat: string;
  lng: string;
  preset: string;
  dayRows: string[];
};

const EMPTY_DRAFT: Draft = {
  name: "",
  nameLocal: "",
  owner: "",
  category: "",
  keywords: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  facebook: "",
  website: "",
  offlineBooking: false,
  bookedDates: [],
  photoNames: ["", "", ""],
  photoUrls: [null, null, null],
  lat: "",
  lng: "",
  preset: "",
  dayRows: ["Closed", "", "", "", "", "", ""],
};

async function compressImage(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.src = dataUrl;
  });
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  if (scale >= 1 && file.size < 1_500_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("compress failed"))), "image/jpeg", 0.82);
  });
}

async function uploadToCloudinary(file: File): Promise<string> {
  const blob = await compressImage(file);
  const form = new FormData();
  form.set("file", new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: blob.type || "image/jpeg" }));
  const response = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await response.json()) as { ok: boolean; url?: string; error?: string };
  if (!data.ok || !data.url) throw new Error(data.error || "Upload failed");
  return data.url;
}

const PRESETS: { id: string; label: string; detail: string; rows: string[] }[] = [
  { id: "market", label: "Market hours", detail: "9 AM – 1 PM · 4 PM – 8 PM", rows: ["Closed", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM"] },
  { id: "allday", label: "Open all week", detail: "7:30 AM – 8:30 PM", rows: ["7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM"] },
  { id: "dayshop", label: "Day shop, Sun off", detail: "10 AM – 7:30 PM", rows: ["Closed", "10 AM – 7:30 PM", "10 AM – 7:30 PM", "10 AM – 7:30 PM", "10 AM – 7:30 PM", "10 AM – 7:30 PM", "10 AM – 7:30 PM"] },
  { id: "sweets", label: "Sweet & snack shop", detail: "8 AM – 8 PM", rows: ["8 AM – 3 PM", "8 AM – 8 PM", "8 AM – 8 PM", "8 AM – 8 PM", "8 AM – 8 PM", "8 AM – 8 PM", "8 AM – 8 PM"] },
];

const STEPS = ["Shop name", "Category", "Contact", "Photo", "Location", "Timings", "Review"];

const STEP_COPY = [
  "Start with the name. The local name helps townsfolk find it faster.",
  "Pick one category from the fixed list, then add search keywords — the more customers search up, the more calls you get.",
  "The call number is the most important field in the whole app.",
  "A storefront photo makes the listing recognisable. Optional for now.",
  "Drop a pin where the shop actually is.",
  "Choose a timing pattern, then fix any day that differs.",
  "Check everything once — then save the shop to the registry.",
];

export default function AddShopWizard({ role }: { role: UserRole }) {
  const isOwner = role !== "superadmin";
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window === "undefined") return EMPTY_DRAFT;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
    } catch {
      /* ignore */
    }
    return EMPTY_DRAFT;
  });
  const [submitted, setSubmitted] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState<boolean[]>([false, false, false]);
  const [photoError, setPhotoError] = useState<string[]>(["", "", ""]);
  const [localPreviews, setLocalPreviews] = useState<(string | null)[]>([null, null, null]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const canNext = useMemo(() => {
    switch (step) {
      case 0: return draft.name.trim().length > 0;
      case 1: return draft.category !== "";
      case 2: return draft.phone.trim().length >= 6;
      case 3: return true;
      case 4: return draft.lat.trim() !== "" && draft.lng.trim() !== "";
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  }, [step, draft]);

  const useMyLocation = () => set({ lat: "21.0600", lng: "86.5000" });

  const setAt = <T,>(list: T[], index: number, value: T) => list.map((item, i) => (i === index ? value : item));

  const onPhoto = (index: number) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoError((prev) => setAt(prev, index, ""));
    setLocalPreviews((prev) => setAt(prev, index, URL.createObjectURL(file)));
    setPhotoUploading((prev) => setAt(prev, index, true));
    try {
      const url = await uploadToCloudinary(file);
      set({ photoUrls: setAt(draft.photoUrls, index, url), photoNames: setAt(draft.photoNames, index, file.name) });
    } catch (uploadError) {
      setPhotoError((prev) => setAt(prev, index, uploadError instanceof Error ? uploadError.message : "Upload failed — check signal and retry."));
    } finally {
      setPhotoUploading((prev) => setAt(prev, index, false));
      event.target.value = "";
    }
  };

  const applyPreset = (id: string) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    set({ preset: id, dayRows: [...preset.rows] });
  };

  const setDayRow = (index: number, value: string) => {
    const rows = [...draft.dayRows];
    rows[index] = value;
    set({ dayRows: rows });
  };

  const saveDraftNow = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("name", draft.name);
      formData.set("local", draft.nameLocal);
      formData.set("owner", draft.owner);
      formData.set("category", draft.category);
      formData.set("keywords", draft.keywords);
      formData.set("phone", draft.phone);
      formData.set("whatsapp", draft.whatsapp);
      formData.set("instagram", draft.instagram);
      formData.set("facebook", draft.facebook);
      formData.set("website", draft.website);
      formData.set("offlineBooking", draft.offlineBooking ? "on" : "off");
      formData.set("bookedDates", draft.bookedDates.join("\n"));
      formData.set("lat", draft.lat);
      formData.set("lng", draft.lng);
      formData.set("photoUrls", draft.photoUrls.filter(Boolean).join("\n"));
      draft.dayRows.forEach((row, index) => formData.set(`day-${index}`, row));
      const result = await createShop(formData);
      if (result.ok) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setSubmitted(true);
      } else {
        setError(result.message);
      }
    } catch {
      setError("Could not reach the server. Your draft is safe on this phone — try again when you have signal.");
    } finally {
      setSaving(false);
    }
  };

  const showPin = draft.lat.trim() !== "" || draft.lng.trim() !== "";
  const selectedCategory = CATEGORIES.find((category) => category.name === draft.category);
  const isEventCategory = selectedCategory ? (EVENT_CATEGORY_IDS as readonly string[]).includes(selectedCategory.id) : false;

  if (submitted) {
    return (
      <div>
        <div className="success-screen">
          <div className="success-mark">✓</div>
          <h1>{isOwner ? "Application submitted" : "Shop saved to the registry"}</h1>
          <p>
            {isOwner
              ? "Your business has been submitted and is pending approval by the super admin. You'll see it go live once it's approved."
              : "The listing is live in the registry and queued for verification. The public site shows it on the next visit."}
          </p>
          <div className="success-actions">
            <button className="admin-btn primary" onClick={() => { setSubmitted(false); setDraft(EMPTY_DRAFT); setStep(0); setLocalPreviews([null, null, null]); setPhotoError(["", "", ""]); }}>Add another business</button>
            <a className="admin-btn secondary" href={isOwner ? "/admin/my-businesses" : "/admin/verify"}>{isOwner ? "View my businesses" : "Open verification queue"}</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-head">
        <h1>{isOwner ? "Add your business" : "Add a shop"}</h1>
        <p>Your draft saves automatically on this phone, even without signal.</p>
      </div>

      <div className="wizard">
        <div className="wizard-progress" aria-label="Add shop progress">
          {STEPS.map((label, index) => (
            <span key={label} className={`wp-dot ${index === step ? "active" : index < step ? "done" : ""}`} title={label} />
          ))}
        </div>
        <span className="wizard-step-label">Step {step + 1} of {STEPS.length} · {STEPS[step]}</span>

        <div className="wizard-card">
          <h2>{STEPS[step]}</h2>
          <p>{STEP_COPY[step]}</p>

          {step === 0 && (
            <>
              <div className="field">
                <label htmlFor="shop-name">Shop name</label>
                <input id="shop-name" value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Samrat Stationery" autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="shop-local">Local name (Odia)</label>
                <input id="shop-local" value={draft.nameLocal} onChange={(e) => set({ nameLocal: e.target.value })} placeholder="ସମ୍ରାଟ ଷ୍ଟେସନେରୀ" autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="shop-owner">Owner name <span className="optional">optional</span></label>
                <input id="shop-owner" value={draft.owner} onChange={(e) => set({ owner: e.target.value })} placeholder="Full name" autoComplete="off" />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="category-picker">
                {CATEGORIES.map((category) => (
                  <button key={category.id} className={draft.category === category.name ? "cat-option selected" : "cat-option"} onClick={() => set({ category: category.name })} type="button">
                    <span className="ci">{category.icon}</span><span>{category.name}</span>
                  </button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="shop-keywords">Search keywords <span className="optional">optional</span></label>
                <input id="shop-keywords" value={draft.keywords} onChange={(e) => set({ keywords: e.target.value })} placeholder="e.g. plumber, pipe repair, tap fitting, water leak" autoComplete="off" />
                <p className="hint">Comma-separated words customers might search — more matches mean more calls.</p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="field">
                <label htmlFor="shop-phone">Phone number</label>
                <input id="shop-phone" inputMode="tel" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="e.g. 98765 43210" autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="shop-wa">WhatsApp <span className="optional">optional · often differs</span></label>
                <input id="shop-wa" inputMode="tel" value={draft.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="Same as phone unless different" autoComplete="off" />
              </div>
              <p className="hint">No WhatsApp? Add a social link or website below so customers can still reach you.</p>
              <div className="field">
                <label htmlFor="shop-instagram">Instagram <span className="optional">optional</span></label>
                <input id="shop-instagram" value={draft.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="https://instagram.com/yourshop" autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="shop-facebook">Facebook <span className="optional">optional</span></label>
                <input id="shop-facebook" value={draft.facebook} onChange={(e) => set({ facebook: e.target.value })} placeholder="https://facebook.com/yourshop" autoComplete="off" />
              </div>
              <div className="field">
                <label htmlFor="shop-website">Website <span className="optional">optional</span></label>
                <input id="shop-website" value={draft.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://yourshop.com" autoComplete="off" />
              </div>
              {isEventCategory && (
                <>
                  <label className="checkbox-field">
                    <input type="checkbox" checked={draft.offlineBooking} onChange={(e) => set({ offlineBooking: e.target.checked })} />
                    This business only takes bookings offline (phone/in-person) — hides the event-date option on its public page entirely.
                  </label>
                  <div className="field">
                    <label>Dates already booked</label>
                    <p className="hint">Mark any dates already booked elsewhere — customers will see those dates as unavailable.</p>
                    <BookedDatesEditor dates={draft.bookedDates} onChange={(bookedDates) => set({ bookedDates })} />
                  </div>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <div className="photo-upload-grid">
              {[0, 1, 2].map((index) => (
                <div className="photo-upload" key={index}>
                  <label className="photo-preview">
                    {draft.photoUrls[index] || localPreviews[index] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={draft.photoUrls[index] ?? localPreviews[index] ?? ""} alt={`Storefront preview ${index + 1}`} className={photoUploading[index] ? "uploading" : ""} />
                    ) : (
                      <span className="photo-placeholder">+ {index === 0 ? "Take or choose a storefront photo" : "Add another photo"}<br /><small>compressed on this phone before upload</small></span>
                    )}
                    <input type="file" accept="image/*" capture="environment" onChange={onPhoto(index)} disabled={photoUploading[index]} />
                  </label>
                  {photoUploading[index] && <p className="hint">Uploading photo…</p>}
                  {draft.photoUrls[index] && !photoUploading[index] && <p className="hint ok">✓ Photo {index + 1} uploaded</p>}
                  {!draft.photoUrls[index] && draft.photoNames[index] && !photoUploading[index] && <p className="hint">Selected: {draft.photoNames[index]} — not uploaded yet</p>}
                  {photoError[index] && <p className="hint error" role="alert">{photoError[index]} You can retry from this step; the rest of the draft is safe.</p>}
                </div>
              ))}
              <p className="hint">Add up to 3 photos — customers can swipe through them on the shop page.</p>
            </div>
          )}

          {step === 4 && (
            <>
              <div className="gps-map"><span className="gps-pin">{showPin ? "●" : ""}</span></div>
              <button className="admin-btn secondary gps-btn" onClick={useMyLocation} type="button">⌖ Use my location</button>
              <div className="gps-row">
                <div className="field">
                  <label htmlFor="shop-lat">Latitude</label>
                  <input id="shop-lat" inputMode="decimal" value={draft.lat} onChange={(e) => set({ lat: e.target.value })} placeholder="21.0600" />
                </div>
                <div className="field">
                  <label htmlFor="shop-lng">Longitude</label>
                  <input id="shop-lng" inputMode="decimal" value={draft.lng} onChange={(e) => set({ lng: e.target.value })} placeholder="86.5000" />
                </div>
              </div>
              <p className="hint">GPS uses the phone&apos;s location. Bad signal? Type the numbers you know.</p>
            </>
          )}

          {step === 5 && (
            <>
              <div className="timing-presets">
                {PRESETS.map((preset) => (
                  <button key={preset.id} className={draft.preset === preset.id ? "preset-chip selected" : "preset-chip"} onClick={() => applyPreset(preset.id)} type="button">
                    {preset.label}<small>{preset.detail}</small>
                  </button>
                ))}
              </div>
              <p className="hint">Adjust any day that differs from the pattern.</p>
              <div className="day-rows">
                {DAYS.map((day, index) => (
                  <div className="day-row" key={day}>
                    <strong>{day}</strong>
                    <input value={draft.dayRows[index]} onChange={(e) => setDayRow(index, e.target.value)} placeholder={index === 0 ? "Closed" : "e.g. 9 AM – 1 PM"} autoComplete="off" />
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 6 && (
            <div className="review-list">
              <div className="review-row"><span>Name</span><strong>{draft.name || "—"}</strong></div>
              <div className="review-row"><span>Local name</span><strong>{draft.nameLocal || "—"}</strong></div>
              <div className="review-row"><span>Category</span><strong>{draft.category || "—"}</strong></div>
              <div className="review-row"><span>Keywords</span><strong>{draft.keywords || "—"}</strong></div>
              <div className="review-row"><span>Phone</span><strong>{draft.phone || "—"}</strong></div>
              <div className="review-row"><span>WhatsApp</span><strong>{draft.whatsapp || "—"}</strong></div>
              <div className="review-row"><span>Instagram</span><strong>{draft.instagram || "—"}</strong></div>
              <div className="review-row"><span>Facebook</span><strong>{draft.facebook || "—"}</strong></div>
              <div className="review-row"><span>Website</span><strong>{draft.website || "—"}</strong></div>
              <div className="review-row"><span>Photos</span><strong>{draft.photoUrls.filter(Boolean).length} of 3 uploaded</strong></div>
              <div className="review-row"><span>Location</span><strong>{draft.lat || "—"}, {draft.lng || "—"}</strong></div>
              <div className="review-row"><span>Timings</span><strong>{draft.dayRows[0]} · …</strong></div>
            </div>
          )}
        </div>

        <div className="wizard-actions">
          {step > 0 && <button className="admin-btn secondary" onClick={() => setStep(step - 1)}>Back</button>}
          <div className="spacer" />
          <button className="admin-btn ghost" onClick={saveDraftNow}>{savedFlash ? "✓ Saved" : "Save draft"}</button>
          {step < STEPS.length - 1 ? (
            <button className="admin-btn primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue</button>
          ) : (
            <button className="admin-btn primary" onClick={submit} disabled={saving}>
              {saving ? "Saving…" : isOwner ? "Apply" : "Save shop"}
            </button>
          )}
        </div>
        {error && <p className="save-note error" role="alert">{error}</p>}
        <p className="save-note">✓ Draft saved to this device · syncs when you are back online</p>
      </div>
    </div>
  );
}
