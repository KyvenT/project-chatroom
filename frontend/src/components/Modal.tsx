import { css, type SerializedStyles } from "@emotion/react";
import type React from "react";

interface ModalProps extends React.DialogHTMLAttributes<HTMLDialogElement> {
  modalStyles?: SerializedStyles;
}

export const closeButtonStyles = css({
  position: "absolute",
  top: "10px",
  right: "10px",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "1rem",
})

const dialogStyles = css({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  padding: 0,
  border: 0,
});

const Modal = ({ children, modalStyles, open }: ModalProps) => {
  return (
    <dialog open={open} css={[dialogStyles, modalStyles]}>
      {children}
    </dialog>
  );
};

export default Modal;
