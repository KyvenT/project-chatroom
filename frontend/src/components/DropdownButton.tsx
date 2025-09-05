import { css } from "@emotion/react";
import Dropdown from "./Dropdown";
import useToggle from "../hooks/useToggle";
import React, { useRef } from "react";
import type { SerializedStyles, Theme } from "@emotion/react";

interface DropdownButtonProps {
  buttonText: string | React.ReactElement;
  children: React.ReactNode;
  buttonStyles?: SerializedStyles;
}

const containerStyles = css({
  position: "relative",
});

const DropdownButton = ({
  buttonText,
  children,
  buttonStyles,
}: DropdownButtonProps) => {
  const [isToggled, setToggled] = useToggle();
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div css={containerStyles}>
      <button
        ref={buttonRef}
        onClick={() => setToggled(true)}
        css={buttonStyles}
      >
        {buttonText}
      </button>
      {isToggled && (
        <Dropdown buttonRef={buttonRef} onClose={() => setToggled(false)}>
          {children}
        </Dropdown>
      )}
    </div>
  );
};

export default DropdownButton;
