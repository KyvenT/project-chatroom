enum WSMessageTypes {
    Auth = "auth",
    Message = "message",
}

export interface AuthMessage {
    type: WSMessageTypes.Auth;
    token: string;
}

export interface ChatMessage {
    type: WSMessageTypes.Message;
    content: string;
    chatroomId: string;
}
