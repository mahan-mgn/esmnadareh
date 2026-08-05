import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import path from "node:path";

/**
 * Product photography, stored on disk under `public/uploads` and served as a
 * plain static file.
 *
 * The whole of the browser's `Content-Type` is a claim by whoever is uploading,
 * so nothing here believes it: the first bytes of the file decide what it is.
 * That is also why SVG is refused outright — it is a document format that can
 * carry script, and it would be served from this shop's own origin.
 */

export const UPLOAD_DIR = "uploads";
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;

type Signature = { ext: string; matches: (bytes: Uint8Array) => boolean };

const ascii = (bytes: Uint8Array, start: number, text: string) =>
  text.split("").every((char, index) => bytes[start + index] === char.charCodeAt(0));

const SIGNATURES: Signature[] = [
  { ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    matches: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: "webp",
    matches: (b) => ascii(b, 0, "RIFF") && ascii(b, 8, "WEBP"),
  },
  {
    // ISO-BMFF: "ftyp" at byte 4, brand at byte 8 — covers AVIF and HEIC-style
    // containers that browsers now hand over from a phone camera.
    ext: "avif",
    matches: (b) => ascii(b, 4, "ftyp") && (ascii(b, 8, "avif") || ascii(b, 8, "avis")),
  },
];

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; reason: "too-large" | "unsupported" | "empty" };

/**
 * Writes an uploaded image and returns the public URL to store on the record.
 *
 * Files are foldered by month so a shop with a few thousand photographs does
 * not end up with one directory the file manager cannot open, and named from
 * random bytes so an upload can never overwrite an existing photograph or be
 * guessed from a product slug.
 */
export async function saveUploadedImage(file: File): Promise<UploadResult> {
  if (!file || file.size === 0) return { ok: false, reason: "empty" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: "too-large" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const signature = SIGNATURES.find((candidate) => candidate.matches(bytes));
  if (!signature) return { ok: false, reason: "unsupported" };

  const now = new Date();
  const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const name = `${randomBytes(12).toString("hex")}.${signature.ext}`;

  const directory = path.join(process.cwd(), "public", UPLOAD_DIR, folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, name), bytes);

  return { ok: true, url: `/${UPLOAD_DIR}/${folder}/${name}` };
}

/**
 * Removes a file this shop uploaded.
 *
 * Only paths inside the upload directory are touched: the seeded editorial SVGs
 * live in `public/media` and are shared between products, and a URL that points
 * anywhere else is not ours to delete.
 */
export async function deleteUploadedImage(url: string) {
  if (!url.startsWith(`/${UPLOAD_DIR}/`)) return;

  const segments = url.slice(1).split("/").filter((part) => part !== "..");
  const target = path.join(process.cwd(), "public", ...segments);
  const root = path.join(process.cwd(), "public", UPLOAD_DIR);

  // Belt and braces after stripping "..": the resolved path must still sit
  // under the upload root.
  if (!path.resolve(target).startsWith(path.resolve(root))) return;

  await unlink(target).catch(() => {});
}
