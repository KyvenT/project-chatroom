import { css, useTheme, type SerializedStyles } from "@emotion/react";
import useToggle from "../hooks/useToggle";
import React, { useEffect, useRef } from "react";

interface DropdownProps {
    children: React.ReactNode;
    dropdownStyles?: SerializedStyles;
    onClose: () => void;
    isShowing: boolean;
    buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const defaultDropdownStyles = css({
    position: "absolute",
    top: "55px",
    backgroundColor: "white",
    border: "2px solid black",
    color: "black",
    padding: "10px",
    borderRadius: "5px",
})

const Dropdown = ({ children, dropdownStyles, onClose, isShowing, buttonRef }: DropdownProps) => {
    const theme = useTheme();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current?.contains(event.target as HTMLElement) 
                || buttonRef.current?.contains(event.target as HTMLElement)) {
                return;
            } 
            onClose();
        }
        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        }
    }, []);

    return (
        <div ref={dropdownRef} css={[defaultDropdownStyles, dropdownStyles]}>
            {children}
        </div>
    );
}

export default Dropdown;