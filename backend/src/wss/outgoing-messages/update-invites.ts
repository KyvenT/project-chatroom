import { socketMap } from "../../lib/socketMaps.js";
import { InvitePayload } from "../../types/payloads.js";

export type UpdateInvitesActions = "ADD" | "DELETE";

export interface updateOptions {
  memberId: string;
  actionType: UpdateInvitesActions;
  inviteId?: string;
  invite?: InvitePayload;
}

export const sendUpdateInvites = async ({
  memberId,
  actionType,
  inviteId,
  invite,
}: updateOptions) => {
  const messageOptions: any = {};
  switch (actionType) {
    case "ADD":
      if (!invite) {
        console.error("missing invite to send add invite update");
        return;
      }
      messageOptions.invite = invite;
      break;
    case "DELETE":
      if (!inviteId) {
        console.error("missing invite id to send delete invite update");
        return;
      }
      messageOptions.inviteId = inviteId;
      break;
    default:
      return;
  }

  const recipientSocket = socketMap.getByKey(memberId);
  try {
    recipientSocket?.send(
      JSON.stringify({
        type: "update-invites",
        action: actionType,
        ...messageOptions,
      }),
    );
  } catch (err) {
    console.error("failed to send invite update" + err);
  }
};
