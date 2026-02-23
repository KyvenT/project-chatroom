import { useRefreshToken } from "./useRefreshToken";
import { useAuthStore } from "../hooks/useStores";

export interface QueryArgs {
  fetchUrl: string;
}

export const makeHeaders = () => {
  const user = useAuthStore.getState().user;
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (user.token) headers.append("authorization", "Bearer " + user.token);
  return headers;
};

export const customQuery = async <T>({ fetchUrl }: QueryArgs): Promise<T> => {
  const { user, handleSignIn } = useAuthStore.getState();

  let res = await fetch(fetchUrl, {
    method: "GET",
    headers: makeHeaders(),
    credentials: "include",
  });
  let data = await res.json();

  if (!res.ok) {
    if (res.status === 401 && user.token) {
      const result = await useRefreshToken();
      if (!result.ok) {
        throw new Error("Unauthorized");
      }
      handleSignIn(result);

      const fetchWithNewToken = await fetch(fetchUrl, {
        method: "GET",
        headers: makeHeaders(),
        credentials: "include",
      });

      data = await fetchWithNewToken.json();

      if (!fetchWithNewToken.ok) {
        throw new Error(data.message || "Unauthorized");
      }

      return data as T;
    }
    throw new Error(data.message || "Query error");
  }

  return data as T;
};
