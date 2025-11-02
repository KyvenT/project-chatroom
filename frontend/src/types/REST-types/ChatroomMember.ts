import type { Status } from "../../components/chat/ProfileStatus";

export interface ChatroomMember {
  member: {
    username: string;
    status: Status;
  };
  memberId: string;
}

export interface UserDetails {
  id: string;
  email: string | null;
  username: string;
  status: Status;
  createdAt: Date;
  isGuest: boolean;
}

export interface ChatroomMemberDetails {
  joinedAt: Date;
  member: UserDetails;
}
