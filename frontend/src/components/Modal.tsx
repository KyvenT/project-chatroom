import { css, type SerializedStyles } from "@emotion/react";
import type React from "react"
import { useEffect, useRef } from "react";

interface ModalProps {
    children: React.ReactNode;
    modalStyles?: SerializedStyles;
    open: boolean;
}

const dialogStyles = css({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: 0, 
    border: 0
})

const Modal = ({children, modalStyles, open}: ModalProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    
    useEffect(() => {
        if (open) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [open])

    return(
        <dialog ref={dialogRef} css={[dialogStyles, modalStyles]}>
            {children}
        </dialog>
    )
}

export default Modal;