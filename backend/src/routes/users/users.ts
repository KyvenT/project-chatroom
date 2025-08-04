import { Router } from "express";

export const usersRouter = Router();

usersRouter.get("/users", (req, res) => {
    // Handle fetching users logic here
    res.send("Users endpoint");
});