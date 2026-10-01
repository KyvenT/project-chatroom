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
    // when their profile picture last changed; null if they have none
    avatarUpdatedAt?: string | null;
  } | null;
  editedAt: Date | null;
  attachment: Attachment | null;
  // oldest first
  reactions?: Reaction[];
}

// one user's reaction to a message
export interface Reaction {
  emoji: string;
  userId: string;
}

// a file sent as a message; its bytes are fetched separately
export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
}
