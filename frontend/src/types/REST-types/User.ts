export interface UserAuth {
  userId: string;
  token: string;
  username: string;
  isGuest: boolean;
}

export interface StatusUpdate {
  userId: string;
  status: "ONLINE" | "AWAY" | "OFFLINE";
}
