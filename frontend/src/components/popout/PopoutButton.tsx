import { PictureInPicture2 } from "lucide-react";
import { usePopoutStore } from "../../hooks/usePopoutStore";
import Button from "../Button";

// Opens a chatroom in a docked pop-out chat
export const PopoutButton = ({
  chatroomId,
  title,
  className,
  iconClassName,
}: {
  chatroomId: string;
  title: string;
  className?: string;
  iconClassName?: string;
}) => {
  const open = usePopoutStore((state) => state.open);

  return (
    <Button
      variant="icon"
      type="button"
      className={className}
      aria-label={`Pop out ${title}`}
      title="Pop out chat"
      // inside cards that navigate or drag when clicked
      onClick={(e) => {
        e.stopPropagation();
        open(chatroomId);
      }}
      onMouseDown={(e) => e.stopPropagation()}
      draggable={false}
    >
      <PictureInPicture2 className={iconClassName} size="1rem" />
    </Button>
  );
};
