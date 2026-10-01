// the largest file that can be sent as a message (bytes)
export const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;

const startsWith = (data: Buffer, bytes: number[], offset = 0) =>
  data.length >= offset + bytes.length &&
  bytes.every((byte, i) => data[offset + i] === byte);

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

// The MIME types that can be sent, each with a check that the file's first
// bytes really are that type, so a file can't claim to be something it isn't.
// Images are shown in the chat; everything else is only downloaded.
const ALLOWED_TYPES: Record<string, (data: Buffer) => boolean> = {
  "image/png": (d) =>
    startsWith(d, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  "image/jpeg": (d) => startsWith(d, [0xff, 0xd8, 0xff]),
  "image/gif": (d) =>
    startsWith(d, ascii("GIF87a")) || startsWith(d, ascii("GIF89a")),
  "image/webp": (d) =>
    startsWith(d, ascii("RIFF")) && startsWith(d, ascii("WEBP"), 8),
  "application/pdf": (d) => startsWith(d, ascii("%PDF-")),
  "application/zip": (d) => startsWith(d, [0x50, 0x4b, 0x03, 0x04]),
  "audio/mpeg": (d) =>
    startsWith(d, ascii("ID3")) || (d[0] === 0xff && (d[1] & 0xe0) === 0xe0),
  "video/mp4": (d) => startsWith(d, ascii("ftyp"), 4),
  // no signature; plain text just mustn't contain NUL bytes
  "text/plain": (d) => !d.includes(0),
};

// whether the file's first bytes are really the given (allowed) type
export const matchesSignature = (mimeType: string, data: Buffer) =>
  !!ALLOWED_TYPES[mimeType]?.(data);

export const INLINE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

// the MIME type of a Content-Type header, without parameters like charset
export const parseMimeType = (contentType: string | undefined) =>
  (contentType ?? "").split(";")[0].trim().toLowerCase();

export type AttachmentCheck =
  { ok: true } | { ok: false; status: number; message: string };

export const checkAttachment = (
  mimeType: string,
  data: Buffer,
): AttachmentCheck => {
  const matchesType = ALLOWED_TYPES[mimeType];
  if (!matchesType) {
    return { ok: false, status: 415, message: "That file type can't be sent" };
  }
  if (data.length === 0) {
    return { ok: false, status: 400, message: "The file is empty" };
  }
  if (data.length > MAX_ATTACHMENT_SIZE) {
    return { ok: false, status: 413, message: "The file is too large" };
  }
  if (!matchesType(data)) {
    return {
      ok: false,
      status: 415,
      message: "The file's contents don't match its type",
    };
  }
  return { ok: true };
};

// a file name safe to store and show: no folders or control characters
export const cleanFileName = (name: string) => {
  const base = name.split(/[/\\]/).pop() ?? "";
  const cleaned = base
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 200);
  return cleaned || "file";
};

// Images may be shown in the page; other files are always downloaded. The
// plain filename is an ASCII fallback for browsers without filename*.
export const contentDisposition = (fileName: string, mimeType: string) => {
  const type = INLINE_TYPES.has(mimeType) ? "inline" : "attachment";
  const fallback = fileName.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
  return `${type}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
};
