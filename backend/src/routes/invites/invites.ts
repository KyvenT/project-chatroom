import { Router } from "express";
import {
  createInvite,
  deleteInvite,
  getChatroomInvites,
  getUserInvites,
  respondToInvite,
} from "../../controllers/inviteController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import {
  inviteIdSchema,
  sendInviteSchema,
  updateInviteStatusSchema,
} from "../../validators/invites/inviteValidation.js";
import { chatroomIdSchema } from "../../validators/chatrooms/chatroomValidation.js";

export const invitesRouter = Router();

invitesRouter.get("/me", getUserInvites);
invitesRouter.post(
  "/",
  validationMiddleware(sendInviteSchema, (req) => req.body),
  createInvite,
);
invitesRouter.patch(
  "/",
  validationMiddleware(updateInviteStatusSchema, (req) => req.body),
  respondToInvite,
);
invitesRouter.delete(
  "/",
  validationMiddleware(inviteIdSchema, (req) => req.body),
  deleteInvite,
);
invitesRouter.get(
  "/:chatroomId",
  validationMiddleware(chatroomIdSchema, (req) => req.params),
  getChatroomInvites,
);
