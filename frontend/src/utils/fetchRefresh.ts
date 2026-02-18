import { API_URL } from "../env";
import { useAuthStore } from "../hooks/useStores";

type RefreshResponse = {
  ok: boolean;
  message?: string;
};

let refreshPromise: Promise<RefreshResponse> | null = null;

export const fetchRefresh = async (): Promise<RefreshResponse> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const { user, handleSignIn, handleLogOut } = useAuthStore.getState();

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
        handleLogOut();
        throw new Error(newTokenData.message || "Unauthorized");
      }

      if (!newTokenData.token || !newTokenData.username)
        throw new Error("Invalid token data received");

      handleSignIn({
        userId: user.userId,
        isGuest: user.isGuest,
        token: newTokenData.token,
        username: newTokenData.username,
      });

      return { ok: true };
    } catch (error: any) {
      console.error("Failed to refresh access token:", error);
      return { ok: false, message: error.message };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
