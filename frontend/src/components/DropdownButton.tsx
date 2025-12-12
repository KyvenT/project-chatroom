import { css, useTheme } from "@emotion/react";
import Dropdown from "./Dropdown";
import useToggle from "../hooks/useToggle";
import React, { useRef } from "react";
import type { SerializedStyles, Theme } from "@emotion/react";
import { iconBtnStyles } from "./Button";

interface DropdownButtonProps {
  buttonText: string | React.ReactElement;
  children: React.ReactNode;
  buttonStyles?: SerializedStyles;
  buttonVariant?: "default" | "icon";
}

const containerStyles = css({
  position: "relative",
});

const DropdownButton = ({
  buttonText,
  children,
  buttonStyles,
  buttonVariant,
}: DropdownButtonProps) => {
  const [isToggled, setToggled] = useToggle();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const theme = useTheme();

  return (
    <div css={containerStyles}>
      <button
        ref={buttonRef}
        onClick={() => setToggled(true)}
        css={buttonVariant === "default" ? buttonStyles : iconBtnStyles(theme)}
      >
        {buttonText}
      </button>
      {isToggled && (
        <Dropdown onClose={() => setToggled(false)}>{children}</Dropdown>
      )}
    </div>
  );
};

export default DropdownButton;
