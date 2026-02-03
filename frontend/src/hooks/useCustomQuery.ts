import type { UserAuth } from "../types/REST-types/User";

export interface QueryArgs {
  fetchUrl: string;
  method?: "GET" | "POST" | "UPDATE" | "PATCH" | "DELETE";
  user?: UserAuth;
}

export const nonVerifiedQuery = async <T>({
  fetchUrl,
  method = "GET",
}: QueryArgs) => {
  const res = await fetch(fetchUrl, {
    method,
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

export const verifiedQuery = async <T>({
  fetchUrl,
  method = "GET",
  user,
}: QueryArgs) => {
  if (!user || !user.userId) {
    throw new Error("not authenticated");
  }
  const res = await fetch(fetchUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer " + user.token,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "query error");
  }

  return data as Promise<T>;
};
