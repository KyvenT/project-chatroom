import { API_URL } from "../env";
import type { UserAuth } from "../types/REST-types/User";
import { useAuthStore } from "./useStores";

export interface MutationArgs {
  fetchUrl: string;
  method: "GET" | "POST" | "UPDATE" | "PATCH" | "DELETE";
  user?: UserAuth;
  reqBody?: {};
}

export const nonVerifiedMutation = async <T>({
  fetchUrl,
  method,
  reqBody = {},
}: MutationArgs) => {
  const res = await fetch(fetchUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "mutation error");
  }

  return data as Promise<T>;
};

export const verifiedMutation = async <T>({
  fetchUrl,
  method,
  reqBody = {},
}: MutationArgs): Promise<T> => {
  const { user, handleSignIn, handleLogOut } = useAuthStore.getState();
  if (!user || !user.userId) {
    throw new Error("not authenticated");
  }
  const res = await fetch(fetchUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer " + user.token,
    },
    body: JSON.stringify(reqBody),
  });

  const data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      const newToken = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + user.token,
        },
      });
      const newTokenData = await newToken.json();

      if (!newToken.ok) {
        handleLogOut();
        throw new Error(newTokenData.message || "Unauthorized");
      }

      if (newTokenData.token) {
        console.log("token refreshed");
        handleSignIn({ ...user, token: newTokenData.token });
        return verifiedMutation<T>({ fetchUrl, method });
      }
      throw new Error("Unauthorized");
    }
    throw new Error(data.message || "mutation error");
  }

  return data as Promise<T>;
};
