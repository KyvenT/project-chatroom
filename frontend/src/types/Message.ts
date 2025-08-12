export interface Message {
    id: string;
    createdAt: string;
    chatroomId: string;
    content: string;
    senderUserId: string | null;
    senderGuestId: string | null;
    senderUser: {
        username: string;
    } | null;
    senderGuest: {
        username: string;
    } | null;
    editedAt: Date | null;
}