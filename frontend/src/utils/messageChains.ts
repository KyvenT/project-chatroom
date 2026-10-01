import type { Message } from "../types/REST-types/Message";

type ChainFields = Pick<Message, "senderUserId" | "createdAt">;

// Whether a message is shown under the one before it, without its own name:
// both are from the same person and it was sent at most `minutes` after the
// previous one. Deleted users' messages aren't chained, since there's no
// telling whether they were sent by the same person.
export const continuesChain = (
  message: ChainFields,
  previous: ChainFields | undefined,
  minutes: number,
) => {
  if (!previous || minutes <= 0) return false;
  if (!message.senderUserId || message.senderUserId !== previous.senderUserId)
    return false;
  const gap =
    new Date(message.createdAt).getTime() -
    new Date(previous.createdAt).getTime();
  return gap >= 0 && gap <= minutes * 60 * 1000;
};
