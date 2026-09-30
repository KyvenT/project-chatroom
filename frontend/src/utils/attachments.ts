import { API_URL } from "../env";
import { useAuthStore } from "../hooks/useStores";
import type { Message } from "../types/REST-types/Message";
import { refreshAccessToken } from "./refreshAccessToken";

// the server refuses larger files (MAX_ATTACHMENT_SIZE in the backend)
export const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;

// the MIME types the server accepts; images are shown in the chat
export const INLINE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
];
export const ALLOWED_TYPES = [
  ...INLINE_TYPES,
  "application/pdf",
  "application/zip",
  "audio/mpeg",
  "video/mp4",
  "text/plain",
];

// what a file picker offers; some systems report zips differently, so the
// extension is listed too
export const ACCEPT = [...ALLOWED_TYPES, ".zip"].join(",");

// the type a file is sent as; the server checks its bytes match
const mimeTypeOf = (file: File) =>
  file.type === "application/x-zip-compressed" ? "application/zip" : file.type;

// why a file can't be sent, or null if it can
export const attachmentProblem = (file: File) => {
  if (!ALLOWED_TYPES.includes(mimeTypeOf(file)))
    return "That file type can't be sent";
  if (file.size === 0) return "The file is empty";
  if (file.size > MAX_ATTACHMENT_SIZE)
    return `Files can be at most ${formatFileSize(MAX_ATTACHMENT_SIZE)}`;
  return null;
};

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(/\.0$/, "")} MB`;
};

// A fetch with the access token, retried once with a fresh one if it expired
const fetchWithAuth = async (url: string, init: RequestInit = {}) => {
  const send = () => {
    const headers = new Headers(init.headers);
    const { token } = useAuthStore.getState().user;
    if (token) headers.set("authorization", "Bearer " + token);
    return fetch(url, { ...init, headers, credentials: "include" });
  };

  const res = await send();
  if (res.status !== 401 || !useAuthStore.getState().user.token) return res;

  const result = await refreshAccessToken();
  if (!result.ok) throw new Error("Unauthorized");
  useAuthStore.getState().handleSignIn(result);
  return send();
};

const errorMessage = async (res: Response, fallback: string) => {
  try {
    const data = await res.json();
    return data.message || fallback;
  } catch {
    return fallback;
  }
};

// Sends the file as a message; it arrives over the socket like any other
export const uploadAttachment = async (chatroomId: string, file: File) => {
  const res = await fetchWithAuth(
    `${API_URL}/api/messages/${chatroomId}/attachments?name=${encodeURIComponent(file.name)}`,
    {
      method: "POST",
      headers: { "Content-Type": mimeTypeOf(file) },
      body: file,
    },
  );
  if (!res.ok) throw new Error(await errorMessage(res, "Couldn't send file"));
  return (await res.json()) as Message;
};

export const fetchAttachment = async (attachmentId: string) => {
  const res = await fetchWithAuth(
    `${API_URL}/api/messages/attachments/${attachmentId}`,
  );
  if (!res.ok) throw new Error(await errorMessage(res, "Couldn't get file"));
  return res.blob();
};

// Saves the blob as a file named fileName
export const saveBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
