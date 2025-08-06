import { css } from "@emotion/react";
import Dropdown from "./Dropdown";
import { headerBtnStylesWithColors } from "./Header";
import useToggle from "../hooks/useToggle";
import React, { useRef } from "react";

interface DropdownButtonProps {
    buttonText: string;
    children: React.ReactNode;
}

const containerStyles = css({
    position: "relative",
})

const DropdownButton = ({buttonText, children}: DropdownButtonProps) => {
    const [isToggled, setToggled] = useToggle();
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <div css={containerStyles}>
            <button ref={buttonRef} onClick={() => setToggled(true)} css={headerBtnStylesWithColors}>{buttonText}</button>
            {isToggled && <Dropdown buttonRef={buttonRef} isShowing={isToggled} onClose={() => setToggled(false)}>
                {children}
            </Dropdown>} 
        </div>
    );
}

export default DropdownButton;