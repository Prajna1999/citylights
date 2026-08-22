import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const FOLDER = "haat/shops";

type CloudinaryCreds = { cloudName: string; apiKey: string; apiSecret: string };

function creds(): CloudinaryCreds | null {
  const url = process.env.CLOUDINARY_URL;
  if (url) {
    const match = url.match(/^cloudinary:\/\/(\d+):([^@]+)@(.+?)(\/.*)?$/);
    if (match) return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
  }
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (cloudName && apiKey && apiSecret) return { cloudName, apiKey, apiSecret };
  return null;
}

function signParams(params: Record<string, string>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return crypto.createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

export async function POST(request: Request) {
  const auth = creds();
  if (!auth) {
    return NextResponse.json({ ok: false, error: "Cloudinary is not configured on the server." }, { status: 500 });
  }

  let file: File;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    if (!(entry instanceof File)) {
      return NextResponse.json({ ok: false, error: "Missing file." }, { status: 400 });
    }
    file = entry;
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the upload." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Only image files are allowed." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Image is too large — keep it under 8 MB." }, { status: 413 });
  }

  const timestamp = Math.round(Date.now() / 1000).toString();
  const signature = signParams({ folder: FOLDER, timestamp }, auth.apiSecret);

  const outgoing = new FormData();
  outgoing.set("file", file);
  outgoing.set("api_key", auth.apiKey);
  outgoing.set("timestamp", timestamp);
  outgoing.set("folder", FOLDER);
  outgoing.set("signature", signature);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${auth.cloudName}/image/upload`, {
      method: "POST",
      body: outgoing,
    });
    const data = (await response.json()) as { secure_url?: string; public_id?: string; error?: { message?: string } };
    if (!response.ok || !data.secure_url) {
      return NextResponse.json(
        { ok: false, error: data.error?.message ?? "Cloudinary rejected the upload." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, url: data.secure_url, publicId: data.public_id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: `Upload failed: ${error instanceof Error ? error.message : "network error"}` },
      { status: 502 },
    );
  }
}
