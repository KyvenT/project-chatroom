import { fetchRefresh } from "../utils/fetchRefresh";
import { makeHeaders } from "./useCustomQuery";
import { useAuthStore } from "./useStores";

export interface MutationArgs {
  fetchUrl: string;
  method: "GET" | "POST" | "UPDATE" | "PATCH" | "DELETE";
  reqBody?: {};
}

export const customMutation = async <T>({
  fetchUrl,
  method,
  reqBody = {},
}: MutationArgs): Promise<T> => {
  const { user } = useAuthStore.getState();

  let res = await fetch(fetchUrl, {
    method,
    headers: makeHeaders(),
    credentials: "include",
    body: JSON.stringify(reqBody),
  });
  let data = await res.json();

  if (!res.ok) {
    if (res.status === 401 && user.token) {
      const result = await fetchRefresh();
      if (!result.ok) {
        throw new Error("Unauthorized");
      }

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
    throw new Error(data.message || "Mutation error");
  }

  return data as T;
};
