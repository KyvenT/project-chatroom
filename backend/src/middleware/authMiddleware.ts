import {Request, Response, NextFunction} from "express";
import env from "../env.js";
import jwt from "jsonwebtoken";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;
    const token = authorization?.split(" ")[1];

    if (!token) {
        console.log("missing token");
        res.status(401).json({error: "Missing token"});
        return;
    }

    jwt.verify(token, env.JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                res.status(400).json({error: "Expired token"});
                return;
            }
            res.status(401).json({err});
            return;
        }

        if (!decoded.userId || !decoded.isUser) {
            res.status(400).json({error: "Error decrypting token"});
            return;
        }

        req.userId = decoded.userId;
        req.isUser = decoded.isUser;
        next();
    })
}

export default authMiddleware;