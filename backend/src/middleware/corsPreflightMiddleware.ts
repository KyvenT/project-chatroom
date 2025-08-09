import { NextFunction, Request, Response } from "express";

export const corsPreflightMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5173');
        res.sendStatus(200);
    } else {
        next();
    }
}