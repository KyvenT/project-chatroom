import { useMutation } from "@tanstack/react-query";
import type { UserAuth } from "../types/User";

export const MutationResourceType = {
  INVITE_RESPONSE: "invite-response",
  CREATE_CHATROOM: "create-chatroom",
} as const;

export interface MutationArgs {
  fetchUrl: string;
  method: string;
  user: UserAuth;
  reqBody: {};
};

export const mutationFunction = async <T>({
  fetchUrl,
  method,
  user,
  reqBody,
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

  return await res.json() as Promise<T>;
};

const query = <T>(
  fetchUrl: string,
  method: string,
  user: UserAuth,
  body: {} = {},
  queryKeys: string[],
  queryOptions?: {},
) => {
  return useMutation({
    mutationKey: ["customQuery", ...queryKeys],
    mutationFn: () => mutationFunction<T>({fetchUrl, method, user, reqBody: body}),
    ...queryOptions,
  });
};