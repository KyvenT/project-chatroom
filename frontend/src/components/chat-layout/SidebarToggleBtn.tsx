import { ArrowLeftToLine, MenuIcon } from "lucide-react";
import Button from "../Button";

interface SidebarToggleBtnProps {
  sidebarToggled: boolean;
  setSidebarToggled: () => void;
}

export const SidebarToggleBtn = ({
  sidebarToggled,
  setSidebarToggled,
}: SidebarToggleBtnProps) => {
  return (
    <Button
      variant="icon"
      className="sidebarToggleBtn"
      onClick={() => setSidebarToggled()}
      aria-label="Toggle sidebar"
    >
      {sidebarToggled ? (
        <ArrowLeftToLine className="headerIconBtn" />
      ) : (
        <MenuIcon className="headerIconBtn" />
      )}
    </Button>
  );
};
