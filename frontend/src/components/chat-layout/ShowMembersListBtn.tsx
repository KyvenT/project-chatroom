import { Users } from "lucide-react";
import Button from "../Button";

interface ShowMembersListBtnProps {
  setShowMembersList: () => void;
}

export const ShowMembersListBtn = ({
  setShowMembersList,
}: ShowMembersListBtnProps) => {
  return (
    <Button onClick={() => setShowMembersList()} variant="icon">
      <Users className="headerIconBtn" />
    </Button>
  );
};
