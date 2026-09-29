import { css, useTheme, type Theme } from "@emotion/react";
import type React from "react";
import Modal from "./Modal";
import { formModalStyles } from "../styles/modalForm";

const confirmStyles = (theme: Theme) =>
  css(formModalStyles(theme, "420px"), {
    padding: "24px",
    gap: "8px",

    h3: {
      fontSize: "1.1rem",
      fontWeight: 600,
    },

    p: {
      fontSize: "0.9rem",
      lineHeight: 1.5,
      color: theme.colors.light_grey,
    },

    strong: {
      color: theme.colors.white,
      fontWeight: 500,
    },

    ".confirmActions": {
      display: "flex",
      justifyContent: "flex-end",
      gap: "8px",
      marginTop: "16px",
    },
  });

interface ConfirmModalProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// A blocking yes/no dialog, in place of window.confirm
export const ConfirmModal = ({
  open,
  title,
  children,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  const theme = useTheme();

  return (
    <Modal
      modalStyles={confirmStyles(theme)}
      open={open}
      variant="requiredInteraction"
    >
      <h3>{title}</h3>
      <p>{children}</p>
      <div className="confirmActions">
        <button type="button" className="btn btnSecondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={danger ? "btn btnDangerSolid" : "btn btnPrimary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
