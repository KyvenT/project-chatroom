import { css, type SerializedStyles } from "@emotion/react";
import type React from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ModalProps
  extends React.DialogHTMLAttributes<HTMLDialogElement> {
  modalStyles?: SerializedStyles;
  variant?: "default" | "requiredInteraction";
  onClose?: () => void;
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
  onClose,
  variant = "default",
}: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!onClose) return;
      console.log(dialogRef.current?.contains(event.target as Node));
      if (dialogRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

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

    if (e.key === "Escape" && onClose) {
      onClose();
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      onKeyDown={handleESCPress}
      css={[dialogStyles, modalStyles]}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </dialog>,
    document.body,
  );
};

export default Modal;
