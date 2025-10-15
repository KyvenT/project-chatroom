import { Router } from "express";
import {
  createPinnedGroup,
  getUserPinnedGroups,
  pinMemberChatroom,
} from "../../controllers/pinnedGroupsController.js";

export const pinnedGroupsRouter = Router();

pinnedGroupsRouter.get("/me", getUserPinnedGroups);
pinnedGroupsRouter.post("/", createPinnedGroup);
pinnedGroupsRouter.patch("/:chatroomId/pin", pinMemberChatroom);
