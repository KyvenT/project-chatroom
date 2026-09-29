import { useRefreshToken } from "./useRefreshToken";
import { makeHeaders } from "./customQuery";
import { useAuthStore } from "../hooks/useStores";

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
  const { user, handleSignIn } = useAuthStore.getState();

  // headers are rebuilt on each call so a retry picks up a refreshed token
  const send = () =>
    fetch(fetchUrl, {
      method,
      headers: makeHeaders(),
      credentials: "include",
      body: JSON.stringify(reqBody),
    });

  let res = await send();
  let data = await res.json();

  if (!res.ok) {
    if (res.status === 401 && user.token) {
      const result = await useRefreshToken();
      if (!result.ok) {
        throw new Error("Unauthorized");
      }
      handleSignIn(result);

      // retry the same request, not a GET, now that the token is fresh
      const retry = await send();
      data = await retry.json();

      if (!retry.ok) {
        throw new Error(data.message || "Unauthorized");
      }

      return data as T;
    }
    throw new Error(data.message || "Mutation error");
  }

  return data as T;
};
