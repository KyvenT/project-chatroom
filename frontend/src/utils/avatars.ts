import { API_URL } from "../env";
import { useAvatarStore } from "../hooks/useAvatarStore";
import { errorMessage, fetchWithAuth } from "./attachments";

// pictures are cropped to a square this many pixels across before uploading
export const AVATAR_PIXELS = 256;
// the largest picture file that will be read (bytes); it's shrunk after
export const MAX_AVATAR_SOURCE_SIZE = 15 * 1024 * 1024;
// what the picture picker offers; GIFs keep only their first frame
export const AVATAR_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

// The picture's URL, which changes with each new picture so browsers can
// cache each one for good
export const avatarUrl = (userId: string, avatarUpdatedAt: string) =>
  `${API_URL}/api/avatars/${userId}?v=${new Date(avatarUpdatedAt).getTime()}`;

// Crops the image to its centered square and shrinks it, as WebP where the
// browser can make it and PNG otherwise
export const prepareAvatar = async (file: File): Promise<Blob> => {
  if (!AVATAR_ACCEPT.split(",").includes(file.type)) {
    throw new Error("Pick a PNG, JPEG, WebP or GIF image");
  }
  if (file.size > MAX_AVATAR_SOURCE_SIZE) {
    throw new Error("That image is too large");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("That image couldn't be read");
  }

  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_PIXELS;
  canvas.height = AVATAR_PIXELS;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Couldn't prepare the picture");
  context.imageSmoothingQuality = "high";
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_PIXELS,
    AVATAR_PIXELS,
  );
  bitmap.close();

  // browsers that can't make WebP give back a PNG instead
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob) throw new Error("Couldn't prepare the picture");
  return blob;
};

// Makes the prepared picture the user's profile picture
export const uploadAvatar = async (userId: string, picture: Blob) => {
  const res = await fetchWithAuth(`${API_URL}/api/users/me/avatar`, {
    method: "PUT",
    headers: { "Content-Type": picture.type },
    body: picture,
  });
  if (!res.ok)
    throw new Error(await errorMessage(res, "Couldn't save the picture"));
  const { avatarUpdatedAt } = (await res.json()) as {
    avatarUpdatedAt: string;
  };
  useAvatarStore.getState().setAvatarVersion(userId, avatarUpdatedAt);
  return avatarUpdatedAt;
};

export const removeAvatar = async (userId: string) => {
  const res = await fetchWithAuth(`${API_URL}/api/users/me/avatar`, {
    method: "DELETE",
  });
  if (!res.ok)
    throw new Error(await errorMessage(res, "Couldn't remove the picture"));
  useAvatarStore.getState().setAvatarVersion(userId, null);
};
