enum WSMessageTypes {
    "auth",
    "message",
}

export interface AuthMessage {
    type: "auth";
    token: string;
}

export interface ChatMessage {
    type: "message";
    content: string;
    chatroomId: string;
}
