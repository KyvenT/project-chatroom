import { API_URL } from "../env";

type RefreshResponse =
  | {
      ok: false;
      message: string;
    }
  | {
      ok: true;
      userId: string;
      isGuest: boolean;
      token: string;
      username: string;
    };

let refreshPromise: Promise<RefreshResponse> | null = null;

export const useRefreshToken = async (): Promise<RefreshResponse> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const newToken = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const newTokenData = await newToken.json();

      if (!newToken.ok) {
        throw new Error(newTokenData.message || "Unauthorized");
      }

      if (!newTokenData.token || !newTokenData.username)
        throw new Error("Invalid token data received");

      return {
        ok: true,
        userId: newTokenData.userId,
        isGuest: newTokenData.isGuest,
        token: newTokenData.token,
        username: newTokenData.username,
      };
    } catch (error: any) {
      console.error("Failed to refresh access token:", error);
      return { ok: false, message: error.message };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
