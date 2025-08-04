import { Router } from "express";
import { authRouter } from "./auth/auth.js";
import { chatroomRouter } from "./chatrooms/chatrooms.js";

const apiRouter = Router()
        apiRouter.use("/auth", authRouter)
            .use("/chatroom", chatroomRouter);


export default apiRouter;