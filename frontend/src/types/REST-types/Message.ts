export interface Message {
  id: string;
  createdAt: Date;
  chatroomId: string;
  content: string;
  // both null once the sender's account has been deleted
  senderUserId: string | null;
  senderUser: {
    id: string;
    username: string;
  } | null;
  editedAt: Date | null;
  attachment: Attachment | null;
}

// a file sent as a message; its bytes are fetched separately
export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
}
