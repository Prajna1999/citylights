"use client";

import { useEffect, useMemo, useState } from "react";
import { shopCategories } from "@/lib/shops";

const STORAGE_KEY = "haat-admin-draft-v1";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Draft = {
  name: string;
  nameLocal: string;
  owner: string;
  category: string;
  phone: string;
  whatsapp: string;
  photoName: string;
  photoData: string | null;
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
  phone: "",
  whatsapp: "",
  photoName: "",
  photoData: null,
  lat: "",
  lng: "",
  preset: "",
  dayRows: ["Closed", "", "", "", "", "", ""],
};

const PRESETS: { id: string; label: string; detail: string; rows: string[] }[] = [
  { id: "market", label: "Market hours", detail: "9 AM – 1 PM · 4 PM – 8 PM", rows: ["Closed", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM", "9 AM – 1 PM, 4 PM – 8 PM"] },
  { id: "allday", label: "Open all week", detail: "7:30 AM – 8:30 PM", rows: ["7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM", "7:30 AM – 8:30 PM"] },
  { id: "dayshop", label: "Day shop, Sun off", detail: "10 AM – 7:30 PM", rows: ["Closed", "10 AM – 7:30 PM", "10 AM – 7:30 PM", "10 AM – 7:30 PM", "10 AM – 7:30 PM", "10 AM – 7:30 PM", "10 AM – 7:30 PM"] },
  { id: "sweets", label: "Sweet & snack shop", detail: "8 AM – 8 PM", rows: ["8 AM – 3 PM", "8 AM – 8 PM", "8 AM – 8 PM", "8 AM – 8 PM", "8 AM – 8 PM", "8 AM – 8 PM", "8 AM – 8 PM"] },
];

const STEPS = ["Shop name", "Category", "Contact", "Photo", "Location", "Timings", "Review"];

const STEP_COPY = [
  "Start with the name. The local name helps townsfolk find it faster.",
  "Pick one category from the fixed list — it keeps the directory tidy.",
  "The call number is the most important field in the whole app.",
  "A storefront photo makes the listing recognisable. Optional for now.",
  "Drop a pin where the shop actually is.",
  "Choose a timing pattern, then fix any day that differs.",
  "Check everything once — then save the shop to the registry.",
];

export default function AddShopPage() {
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

  const onPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      set({ photoData: String(reader.result), photoName: file.name });
    };
    reader.readAsDataURL(file);
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

  const submit = () => {
    setSubmitted(true);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const showPin = draft.lat.trim() !== "" || draft.lng.trim() !== "";

  if (submitted) {
    return (
      <div>
        <div className="success-screen">
          <div className="success-mark">✓</div>
          <h1>Shop saved to the registry</h1>
          <p>This is a mock save — the listing was stored locally on this device only. In production it would sync to the registry.</p>
          <div className="success-actions">
            <button className="admin-btn primary" onClick={() => { setSubmitted(false); setDraft(EMPTY_DRAFT); setStep(0); }}>Add another shop</button>
            <a className="admin-btn secondary" href="/admin">Back to dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-head">
        <h1>Add a shop</h1>
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
            <div className="category-picker">
              {shopCategories.map((category) => (
                <button key={category.name} className={draft.category === category.name ? "cat-option selected" : "cat-option"} onClick={() => set({ category: category.name })} type="button">
                  <span className="ci">{category.icon}</span><span>{category.name}</span>
                </button>
              ))}
            </div>
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
            </>
          )}

          {step === 3 && (
            <div className="photo-upload">
              <label className="photo-preview">
                {draft.photoData ? <img src={draft.photoData} alt="Storefront preview" /> : <span className="photo-placeholder">+ Take or choose a storefront photo<br /><small>compressed on this phone before upload</small></span>}
                <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
              </label>
              {draft.photoName && <p className="hint">Selected: {draft.photoName}</p>}
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
              <div className="review-row"><span>Phone</span><strong>{draft.phone || "—"}</strong></div>
              <div className="review-row"><span>WhatsApp</span><strong>{draft.whatsapp || "—"}</strong></div>
              <div className="review-row"><span>Photo</span><strong>{draft.photoName || "Not added"}</strong></div>
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
            <button className="admin-btn primary" onClick={submit}>Save shop</button>
          )}
        </div>
        <p className="save-note">✓ Draft saved to this device · syncs when you are back online</p>
      </div>
    </div>
  );
}
