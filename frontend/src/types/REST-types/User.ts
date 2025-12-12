export type UserStatus = "ONLINE" | "AWAY" | "OFFLINE";

export interface UserAuth {
  userId: string;
  token: string;
  username: string;
  isGuest: boolean;
}

export interface StatusUpdate {
  userId: string;
  status: UserStatus;
}

export interface UserDetails {
  id: string;
  email: string | null;
  username: string;
  status: UserStatus;
  createdAt: Date;
  isGuest: boolean;
}
