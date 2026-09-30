import { API_URL } from "../env";

type RefreshResponse =
  | {
      ok: false;
      message: string;
      // the server refused the session (it ended), as opposed to e.g. the
      // server being unreachable
      rejected: boolean;
    }
  | {
      ok: true;
      userId: string;
      isGuest: boolean;
      token: string;
      username: string;
    };

let refreshPromise: Promise<RefreshResponse> | null = null;

// Gets a new access token with the refresh token cookie (not a React hook)
export const refreshAccessToken = async (): Promise<RefreshResponse> => {
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
        return {
          ok: false,
          message: newTokenData.message || "Unauthorized",
          rejected: newToken.status === 400 || newToken.status === 401,
        };
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
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, message, rejected: false };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
