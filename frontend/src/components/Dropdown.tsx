import { css, useTheme, type Theme } from "@emotion/react";
import React, { useEffect, useRef } from "react";

interface DropdownProps {
    children: React.ReactNode;
    onClose: () => void;
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

const colors = (theme: Theme) => css({
    backgroundColor: theme.colors.white,
    color: theme.colors.dark_grey,
})

const Dropdown = ({ children, onClose, buttonRef }: DropdownProps) => {
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
        <div ref={dropdownRef} css={[defaultDropdownStyles, colors(theme)]}>
            {children}
        </div>
    );
}

export default Dropdown;