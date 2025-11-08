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
}
