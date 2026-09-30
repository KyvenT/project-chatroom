export interface Message {
  id: string;
  createdAt: Date;
  chatroomId: string;
  content: string;
  senderUserId: string;
  senderUser: {
    id: string;
    username: string;
  };
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
