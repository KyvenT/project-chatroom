import { API_URL } from "../env";
import type { UserAuth } from "../types/REST-types/User";
import { useAuthStore } from "./useStores";

export interface QueryArgs {
  fetchUrl: string;
}

export const nonVerifiedQuery = async <T>({
  fetchUrl,
}: QueryArgs): Promise<T> => {
  const res = await fetch(fetchUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "query error");
  }

  return data as Promise<T>;
};

const fetchWithAuth = async ({
  fetchUrl,
  user,
}: QueryArgs & { user: UserAuth | null }): Promise<Response> => {
  if (!user || !user.userId) {
    throw new Error("not authenticated");
  }
  const res = await fetch(fetchUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer " + user.token,
    },
  });

  return res;
};

export const verifiedQuery = async <T>({ fetchUrl }: QueryArgs): Promise<T> => {
  const { user, handleSignIn, handleLogOut } = useAuthStore.getState();

  if (!user || !user.userId) {
    throw new Error("not authenticated");
  }

  let res = await fetchWithAuth({ fetchUrl, user });
  let data = await res.json();

  if (!res.ok) {
    if (res.status === 401) {
      const newToken = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: "Bearer " + user.token,
        },
        credentials: "include",
      });
      const newTokenData = await newToken.json();

      if (!newToken.ok) {
        handleLogOut();
        throw new Error(newTokenData.message || "Unauthorized");
      }

      if (newTokenData.token) {
        handleSignIn({ ...user, token: newTokenData.token });
        data = await fetchWithAuth({
          fetchUrl,
          user: { ...user, token: newTokenData.token },
        }).then((res) => res.json());
        return data as T;
      }
      throw new Error("Unauthorized");
    }
    throw new Error(data.message || "query error");
  }

  return data as T;
};
