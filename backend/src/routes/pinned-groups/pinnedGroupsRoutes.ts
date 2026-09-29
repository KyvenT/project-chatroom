import { Router } from "express";
import {
  createPinnedGroup,
  deletePinnedGroup,
  editPinnedGroup,
  getUserPinnedGroups,
  pinMemberChatroom,
} from "../../controllers/pinnedGroupsController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import {
  chatroomPinSchema,
  editPinnedGroupSchema,
  PinnedGroupNameSchema,
  pinGroupIdSchema,
} from "../../validators/pinned-groups/pinnedGroupsValidation.js";

export const pinnedGroupsRouter = Router();

pinnedGroupsRouter.get("/me", getUserPinnedGroups);
pinnedGroupsRouter.post(
  "/",
  validationMiddleware(PinnedGroupNameSchema, (req) => req.body),
  createPinnedGroup,
);
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
pinnedGroupsRouter.delete(
  "/:pinGroupId",
  validationMiddleware(pinGroupIdSchema, (req) => req.params),
  deletePinnedGroup,
);
