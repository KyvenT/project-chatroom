import express, { NextFunction, Request, Response, Router } from "express";
import {
  deleteMessage,
  editMessage,
  getAttachment,
  getMessages,
  uploadAttachment,
} from "../../controllers/messageController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import { uploadRateLimitMiddleware } from "../../middleware/rateLimitMiddleware.js";
import {
  attachmentIdSchema,
  editMessageSchema,
  messageIdSchema,
  retrieveMessageSchema,
  uploadAttachmentSchema,
} from "../../validators/messages/messageValidation.js";
import { MAX_ATTACHMENT_SIZE } from "../../lib/attachments.js";

export const messagesRouter = Router();

// Reads the request body as the file's bytes, whatever its Content-Type (the
// type is checked once the file is read). Errors are sent as JSON like the
// rest of the API.
const readFileBody = (req: Request, res: Response, next: NextFunction) =>
  express.raw({ type: () => true, limit: MAX_ATTACHMENT_SIZE })(
    req,
    res,
    (err?: any) => {
      if (err) {
        const tooLarge = err.type === "entity.too.large";
        res.status(tooLarge ? 413 : 400).json({
          message: tooLarge
            ? "The file is too large"
            : "Couldn't read the file",
        });
        return;
      }
      next();
    },
  );

messagesRouter.get(
  "/attachments/:attachmentId",
  validationMiddleware(attachmentIdSchema, (req) => req.params),
  getAttachment,
);

// the file is the body, sent with its MIME type as the Content-Type
messagesRouter.post(
  "/:chatroomId/attachments",
  uploadRateLimitMiddleware,
  validationMiddleware(uploadAttachmentSchema, (req) => ({
    ...req.params,
    ...req.query,
  })),
  readFileBody,
  uploadAttachment,
);

messagesRouter.get(
  "/:chatroomId",
  validationMiddleware(retrieveMessageSchema, (req) => ({
    ...req.params,
    ...req.query,
  })),
  getMessages,
);

// the sender changes a message's text
messagesRouter.patch(
  "/:messageId",
  validationMiddleware(editMessageSchema, (req) => ({
    ...req.params,
    ...req.body,
  })),
  editMessage,
);

// the sender, or a chatroom owner or admin, deletes a message
messagesRouter.delete(
  "/:messageId",
  validationMiddleware(messageIdSchema, (req) => req.params),
  deleteMessage,
);
