import { useMutation } from "@tanstack/react-query";
import useAuthContext from "./useAuthContext";
import type { UserAuth } from "../types/User";

export const MutationResourceType = {
  INVITE_RESPONSE: "invite-response",
  CREATE_CHATROOM: "create-chatroom",
} as const;

const fetchWithBody = (
  fetchUrl: string,
  method: string,
  user: UserAuth,
  reqBody: {},
) => {
  return fetch(fetchUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer " + user.token,
    },
    body: JSON.stringify(reqBody),
  });
};

const query = <T>(
  fetchUrl: string,
  method: string,
  user: UserAuth,
  isLoggedIn: boolean,
  body: {} = {},
  queryKeys: string[],
  queryOptions?: {},
) => {
  return useMutation({
    mutationKey: ["customQuery", ...queryKeys],
    mutationFn: async () => {
      if (!isLoggedIn) {
        return [];
      }
      let res = await fetchWithBody(fetchUrl, method, user, body);

      if (!res.ok) {
        console.error(res);
        return [];
      }
      return (await res.json()) as T[];
    },
    ...queryOptions,
  });
};

export const useCustomMutation = <T>(
  queryKeys: string[],
  resource: string,
  options: {
    inviteId?: string;
    inviteAccepted?: boolean;
    queryOptions?: {};
  } = {},
) => {
  const { isLoggedIn, user } = useAuthContext();
  const { inviteId, inviteAccepted, queryOptions } = options;

  let method = "";
  let reqBody: any = {};
  let fetchUrl = "";
  console.log("mutating " + resource);
  switch (resource) {
    // respond to an invite (accept or reject)
    case MutationResourceType.INVITE_RESPONSE:
      if (!inviteAccepted || !inviteId) {
        console.error("need id and response to respond to invites");
      }
      method = inviteAccepted ? "PATCH" : "DELETE";
      fetchUrl = inviteAccepted
        ? "http://localhost:3000/api/invite/accept"
        : "http://localhost:3000/api/invite/delete";
      reqBody = { inviteId };
      break;
    case MutationResourceType.CREATE_CHATROOM:
      break;
    default:
      throw new Error("Invalid resource type");
  }

  return query<T>(
    fetchUrl,
    method,
    user,
    isLoggedIn,
    reqBody,
    queryKeys,
    queryOptions,
  );
};
