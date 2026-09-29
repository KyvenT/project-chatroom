import { Router } from "express";
import {
  createFolder,
  deleteFolder,
  getFolders,
  moveChatroomToFolder,
  renameFolder,
  setFolderOrder,
} from "../../controllers/folderController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import {
  folderIdSchema,
  folderNameSchema,
  folderOrderSchema,
  moveChatroomToFolderSchema,
  renameFolderSchema,
} from "../../validators/folders/folderValidation.js";

export const foldersRouter = Router();

foldersRouter.get("/", getFolders);
foldersRouter.post(
  "/",
  validationMiddleware(folderNameSchema, (req) => req.body),
  createFolder,
);
foldersRouter.patch(
  "/chatrooms/:chatroomId",
  validationMiddleware(moveChatroomToFolderSchema, (req) => ({
    ...req.params,
    ...req.body,
  })),
  moveChatroomToFolder,
);
foldersRouter.patch(
  "/:folderId",
  validationMiddleware(renameFolderSchema, (req) => ({
    ...req.params,
    ...req.body,
  })),
  renameFolder,
);
foldersRouter.delete(
  "/:folderId",
  validationMiddleware(folderIdSchema, (req) => req.params),
  deleteFolder,
);
foldersRouter.patch(
  "/:folderId/order",
  validationMiddleware(folderOrderSchema, (req) => ({
    ...req.params,
    ...req.body,
  })),
  setFolderOrder,
);
