import type { Theme } from "@emotion/react";
import { css, useTheme, type SerializedStyles } from "@emotion/react";
import type React from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalVariant = "default" | "requiredInteraction";

export interface ModalProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  modalStyles?: SerializedStyles;
  variant?: ModalVariant;
  onClose?: () => void;
}

const closeButtonStyles = (theme: Theme) =>
  css({
    position: "absolute",
    top: "16px",
    right: "16px",
    width: "2rem",
    height: "2rem",
    display: "grid",
    placeItems: "center",
    padding: 0,
    backgroundColor: "transparent",
    border: "none",
    borderRadius: theme.radius.sm,
    cursor: "pointer",
    color: theme.colors.light_grey,
    transition: "color 0.15s ease, background-color 0.15s ease",
    "&:hover": {
      color: theme.colors.white,
      backgroundColor: theme.colors.grey,
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.colors.accent}`,
      outlineOffset: "2px",
    },
  });

export const ModalCloseButton = ({
  onClose,
  label = "Close",
}: {
  onClose: () => void;
  label?: string;
}) => {
  const theme = useTheme();

  return (
    <button
      type="button"
      css={closeButtonStyles(theme)}
      onClick={onClose}
      aria-label={label}
    >
      <X size="1.25rem" />
    </button>
  );
};

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

const backdropStyles = (variant: ModalVariant, theme: Theme) =>
  css({
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor:
      variant === "requiredInteraction" ? theme.colors.backdrop : "transparent",
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
  }, [open, variant]);

  const handleESCPress = (e: React.KeyboardEvent) => {
    if (variant === "requiredInteraction" || !onClose) return;

    if (e.key === "Escape") {
      onClose();
    }
  };

  return createPortal(
    <div css={backdropStyles(variant, theme)} onClick={onClose}>
      <dialog
        ref={dialogRef}
        onKeyDown={handleESCPress}
        /* @ts-expect-error closedBy is missing from React's dialog types */
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
