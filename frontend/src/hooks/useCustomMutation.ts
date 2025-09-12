import type { UserAuth } from "../types/REST-types/User";

export interface MutationArgs {
  fetchUrl: string;
  method: "GET" | "POST" | "UPDATE" | "PATCH" | "DELETE";
  user: UserAuth;
  reqBody?: {};
}

export const mutationFunction = async <T>({
  fetchUrl,
  method,
  user,
  reqBody = {},
}: MutationArgs) => {
  if (!user.userId) {
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

  if (!res.ok) {
    throw new Error("mutation error");
  }

  return (await res.json()) as Promise<T>;
};
