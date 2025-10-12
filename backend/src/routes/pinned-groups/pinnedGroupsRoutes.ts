import { Router } from "express";
import { getUserPinnedGroups } from "../../controllers/pinnedGroupsController.js";

export const pinnedGroupsRouter = Router();

pinnedGroupsRouter.get("/me", getUserPinnedGroups);
