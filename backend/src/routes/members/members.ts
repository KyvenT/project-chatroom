import { Router } from "express";
import {
  getChatroomMembers,
  getMemberDetails,
  removeMemberFromChatroom,
  reorderMemberChatroom,
} from "../../controllers/memberController.js";
import { joinChatroom } from "../../controllers/memberController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import {
  chatroomIdSchema,
  chatroomModifyIndexSchema,
} from "../../validators/chatrooms/chatroomValidation.js";
import { chatroomMemberSchema } from "../../validators/members/memberValidation.js";

export const membersRouter = Router();

membersRouter.get(
  "/:chatroomId",
  validationMiddleware(chatroomIdSchema, (req) => req.params),
  getChatroomMembers,
);
membersRouter.delete(
  "/:chatroomId",
  validationMiddleware(chatroomMemberSchema, (req) => ({
    ...req.params,
    ...req.body,
  })),
  removeMemberFromChatroom,
);
membersRouter.post(
  "/:chatroomId",
  validationMiddleware(chatroomIdSchema, (req) => req.params),
  joinChatroom,
);
membersRouter.patch(
  "/:chatroomId/order",
  validationMiddleware(chatroomModifyIndexSchema, (req) => ({
    ...req.params,
    ...req.body,
  })),
  reorderMemberChatroom,
);
membersRouter.get(
  "/:chatroomId/:memberId",
  validationMiddleware(chatroomMemberSchema, (req) => req.params),
  getMemberDetails,
);
