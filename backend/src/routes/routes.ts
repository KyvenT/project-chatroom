import { Router } from "express";
import { authRouter } from "./auth/auth.js";
import { chatroomRouter } from "./chatrooms/chatrooms.js";
import { usersRouter } from "./users/users.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { invitesRouter } from "./invites/invites.js";
import { messagesRouter } from "./messages/messages.js";

const apiRouter = Router()

apiRouter.use("/auth", authRouter)
        .use("/chatroom", authMiddleware, chatroomRouter)
        .use("/users", authMiddleware, usersRouter)
        .use("/invite", authMiddleware, invitesRouter)
        .use("/messages", authMiddleware, messagesRouter);

export default apiRouter;