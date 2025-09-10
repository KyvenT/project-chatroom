import type { Status } from "../../components/chat/ProfileStatus";

export interface ChatroomMember {
  member: {
    username: string;
    status: Status;
  };
  memberId: string;
}
