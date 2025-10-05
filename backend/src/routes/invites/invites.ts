import { Router } from "express";
import {
  createInvite,
  deleteInvite,
  getChatroomInvites,
  getUserInvites,
  respondToInvite,
} from "../../controllers/inviteController.js";

export const invitesRouter = Router();

invitesRouter.get("/me", getUserInvites);
invitesRouter.post("/", createInvite);
invitesRouter.patch("/", respondToInvite);
invitesRouter.delete("/", deleteInvite);
invitesRouter.get("/:chatroomId", getChatroomInvites);
