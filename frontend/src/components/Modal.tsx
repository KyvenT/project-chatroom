import { css, type SerializedStyles } from "@emotion/react";
import type React from "react";
import { useEffect, useRef } from "react";

export interface ModalProps
  extends React.DialogHTMLAttributes<HTMLDialogElement> {
  modalStyles?: SerializedStyles;
  variant?: "default" | "requiredInteraction";
}

export const closeButtonStyles = css({
  position: "absolute",
  top: "10px",
  right: "10px",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "1rem",
});

const dialogStyles = css({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  padding: 0,
  border: 0,
});

const Modal = ({
  children,
  modalStyles,
  open,
  variant = "default",
}: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      if (variant === "requiredInteraction") {
        dialogRef.current?.showModal();
      } else {
        dialogRef.current?.show();
      }
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleESCPress = (e: React.KeyboardEvent) => {
    if (variant === "requiredInteraction") return;

    if (e.key === "Escape") {
      dialogRef.current?.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onKeyDown={handleESCPress}
      // @ts-ignore typescript does not detect closedby
      closedby="none"
      css={[dialogStyles, modalStyles]}
    >
      {children}
    </dialog>
  );
};

export default Modal;
