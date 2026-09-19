import type { Theme } from "@emotion/react";
import { css, useTheme, type SerializedStyles } from "@emotion/react";
import type React from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type ModalVariant = "default" | "requiredInteraction";

export interface ModalProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  modalStyles?: SerializedStyles;
  variant?: ModalVariant;
  onClose?: () => void;
}

export const closeButtonStyles = (theme: Theme) =>
  css({
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    color: theme.colors.light_grey,
    "&:hover": {
      color: theme.colors.white,
    },
  });

const dialogStyles = (variant: ModalVariant, theme: Theme) =>
  css({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: 0,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    boxShadow: theme.shadow.popup,
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    overflow: "hidden",
    zIndex: variant === "requiredInteraction" ? 9999 : 1,
  });

const backdropStyles = (variant: ModalVariant) =>
  css({
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor:
      variant === "requiredInteraction" ? "rgba(6,8,12,0.6)" : "transparent",
    backdropFilter: variant === "requiredInteraction" ? "blur(3px)" : "none",
    height: "100dvh",
    width: "100dvw",
  });

const Modal = ({
  children,
  modalStyles,
  open,
  onClose,
  variant = "default",
}: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const theme = useTheme();

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
    if (variant === "requiredInteraction" || !onClose) return;

    if (e.key === "Escape") {
      onClose();
    }
  };

  return createPortal(
    <div css={backdropStyles(variant)} onClick={onClose}>
      <dialog
        ref={dialogRef}
        onKeyDown={handleESCPress}
        /* @ts-ignore */
        closedBy="none"
        css={[dialogStyles(variant, theme), modalStyles]}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </dialog>
    </div>,
    document.body,
  );
};

export default Modal;
