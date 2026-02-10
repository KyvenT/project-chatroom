import { Router } from "express";
import {
  createPinnedGroup,
  editPinnedGroup,
  getUserPinnedGroups,
  pinMemberChatroom,
} from "../../controllers/pinnedGroupsController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import {
  chatroomPinSchema,
  editPinnedGroupSchema,
} from "../../validators/pinned-groups/pinnedGroupsValidation.js";

export const pinnedGroupsRouter = Router();

pinnedGroupsRouter.get("/me", getUserPinnedGroups);
pinnedGroupsRouter.post("/", createPinnedGroup);
pinnedGroupsRouter.patch(
  "/:chatroomId/pin",
  validationMiddleware(chatroomPinSchema, (req) => ({
    ...req.params,
    ...req.body,
  })),
  pinMemberChatroom,
);
pinnedGroupsRouter.patch(
  "/:pinGroupId",
  validationMiddleware(editPinnedGroupSchema, (req) => ({
    ...req.params,
    ...req.body,
  })),
  editPinnedGroup,
);
