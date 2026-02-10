import type { UserAuth } from "../types/REST-types/User";

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
  user,
  reqBody = {},
}: MutationArgs) => {
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
    throw new Error(data.message || "mutation error");
  }

  return data as Promise<T>;
};
