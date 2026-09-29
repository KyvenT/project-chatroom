import { Request, Response } from "express";
import * as folderService from "../services/folderService.js";

const folderErrorStatus = (message: string) => {
  switch (message) {
    case "Folder not found":
      return 404;
    case "Not detected as owner of folder":
    case "Not a member of chatroom":
    case "Only users can create folders":
      return 403;
    default:
      return 500;
  }
};

export const getFolders = async (req: Request, res: Response) => {
  const { userId } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in to get folders" });
    return;
  }

  try {
    const folders = await folderService.getFolders(userId);
    res.status(200).json(folders);
  } catch (err: any) {
    console.error("get folders error", err.message);
    res.status(folderErrorStatus(err.message)).json({ message: err.message });
  }
};

export const createFolder = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in to create a folder" });
    return;
  }

  try {
    const folder = await folderService.createFolder(userId, data);
    res.status(201).json(folder);
  } catch (err: any) {
    console.error("create folder error", err.message);
    res.status(folderErrorStatus(err.message)).json({ message: err.message });
  }
};

export const renameFolder = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in to rename a folder" });
    return;
  }

  try {
    await folderService.renameFolder(userId, data);
    res.status(200).json({ message: "Folder renamed" });
  } catch (err: any) {
    console.error("rename folder error", err.message);
    res.status(folderErrorStatus(err.message)).json({ message: err.message });
  }
};

export const deleteFolder = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in to delete a folder" });
    return;
  }

  try {
    await folderService.deleteFolder(userId, data);
    res.status(200).json({ message: "Folder deleted" });
  } catch (err: any) {
    console.error("delete folder error", err.message);
    res.status(folderErrorStatus(err.message)).json({ message: err.message });
  }
};

export const moveChatroomToFolder = async (req: Request, res: Response) => {
  const { userId, data } = req;

  if (!userId) {
    res.status(401).json({ message: "Must be signed in to move a chatroom" });
    return;
  }

  try {
    await folderService.moveChatroomToFolder(userId, data);
    res.status(200).json({ message: "Chatroom moved" });
  } catch (err: any) {
    console.error("move chatroom to folder error", err.message);
    res.status(folderErrorStatus(err.message)).json({ message: err.message });
  }
};
