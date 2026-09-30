import type { Status } from "../../components/chat/ProfileStatus";

export type ChatroomRoles = "OWNER" | "ADMIN" | "MEMBER";

export interface ChatroomMember {
  member: {
    username: string;
    status: Status;
    avatarUpdatedAt?: string | null;
  };
  memberId: string;
  role: ChatroomRoles;
}

export interface UserDetails {
  id: string;
  email: string | null;
  username: string;
  status: Status;
  createdAt: Date;
  isGuest: boolean;
  avatarUpdatedAt?: string | null;
}

export interface ChatroomMemberDetails {
  joinedAt: Date;
  member: UserDetails;
}
