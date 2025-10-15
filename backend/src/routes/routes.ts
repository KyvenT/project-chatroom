import { Router } from "express";
import { authRouter } from "./auth/auth.js";
import { chatroomRouter } from "./chatrooms/chatrooms.js";
import { usersRouter } from "./users/users.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { invitesRouter } from "./invites/invites.js";
import { messagesRouter } from "./messages/messages.js";
import { membersRouter } from "./members/members.js";
import { publicChatroomRouter } from "./chatrooms/public-chatroom-routes.js";
import { pinnedGroupsRouter } from "./pinned-groups/pinnedGroupsRoutes.js";

const apiRouter = Router();

apiRouter
  .use("/auth", authRouter)
  .use("/chatroomsPublic", publicChatroomRouter)
  .use("/chatrooms", authMiddleware, chatroomRouter)
  .use("/users", authMiddleware, usersRouter)
  .use("/invites", authMiddleware, invitesRouter)
  .use("/messages", authMiddleware, messagesRouter)
  .use("/members", authMiddleware, membersRouter)
  .use("/pinned", authMiddleware, pinnedGroupsRouter);

export default apiRouter;
