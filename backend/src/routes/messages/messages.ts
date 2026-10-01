import { Router } from "express";
import {
  addReaction,
  deleteMessage,
  editMessage,
  getAttachment,
  getMessages,
  removeReaction,
  uploadAttachment,
} from "../../controllers/messageController.js";
import { validationMiddleware } from "../../middleware/validationMiddleware.js";
import { uploadRateLimitMiddleware } from "../../middleware/rateLimitMiddleware.js";
import {
  attachmentIdSchema,
  editMessageSchema,
  messageIdSchema,
  reactionSchema,
  retrieveMessageSchema,
  uploadAttachmentSchema,
} from "../../validators/messages/messageValidation.js";
import { MAX_ATTACHMENT_SIZE } from "../../lib/attachments.js";
import { readRawBody } from "../../middleware/readRawBody.js";

export const messagesRouter = Router();

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
  readRawBody(MAX_ATTACHMENT_SIZE),
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

// a member reacts to a message with an emoji (URL-encoded), or takes it back
messagesRouter.put(
  "/:messageId/reactions/:emoji",
  validationMiddleware(reactionSchema, (req) => req.params),
  addReaction,
);

messagesRouter.delete(
  "/:messageId/reactions/:emoji",
  validationMiddleware(reactionSchema, (req) => req.params),
  removeReaction,
);
