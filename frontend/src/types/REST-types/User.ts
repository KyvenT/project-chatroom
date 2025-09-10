export interface UserAuth {
  userId: string;
  token: string;
  username: string;
}

export interface StatusUpdate {
  userId: string;
  status: "ONLINE" | "AWAY" | "OFFLINE";
}
