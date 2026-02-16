import { API_URL } from "../env";
import type { UserAuth } from "../types/REST-types/User";
import { useAuthStore } from "./useStores";

export interface MutationArgs {
  fetchUrl: string;
  method: "GET" | "POST" | "UPDATE" | "PATCH" | "DELETE";
  user?: UserAuth;
  reqBody?: {};
}

export const customMutation = async <T>({
  fetchUrl,
  method,
  reqBody = {},
}: MutationArgs): Promise<T> => {
  const { user, handleSignIn, handleLogOut } = useAuthStore.getState();

  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  if (user.token) {
    headers.append("authorization", "Bearer " + user.token);
  }

  let res = await fetch(fetchUrl, {
    method,
    headers,
    credentials: "include",
    body: JSON.stringify(reqBody),
  });
  let data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      const newToken = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers,
        credentials: "include",
      });
      const newTokenData = await newToken.json();

      if (!newToken.ok) {
        handleLogOut();
        throw new Error(newTokenData.message || "Unauthorized");
      }

      if (newTokenData.token) {
        headers.set("authorization", "Bearer " + newTokenData.token);

        handleSignIn({ ...user, token: newTokenData.token });
        const fetchWithNewToken = await fetch(fetchUrl, {
          method,
          headers,
          credentials: "include",
          body: JSON.stringify(reqBody),
        });

        data = await fetchWithNewToken.json();

        if (!fetchWithNewToken.ok) {
          throw new Error(data.message || "Unauthorized");
        }

        return data as T;
      }
      throw new Error("Unauthorized");
    }
    throw new Error(data.message || "Query error");
  }

  return data as T;
};
