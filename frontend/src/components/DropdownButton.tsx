import { css, useTheme } from "@emotion/react";
import Dropdown from "./Dropdown";
import React, { useEffect, useRef, useState } from "react";
import type { SerializedStyles } from "@emotion/react";
import { iconBtnStyles } from "./Button";

export type DropdownPosition = "left" | "right";

interface DropdownButtonProps {
  buttonText: string | React.ReactElement;
  children: React.ReactNode;
  buttonStyles?: SerializedStyles;
  buttonVariant?: "default" | "icon";
  dropdownStyles?: SerializedStyles;
  dropdownPosition?: DropdownPosition;
  "aria-label"?: string;
}

const containerStyles = css({
  position: "relative",
});

const DropdownButton = ({
  buttonText,
  children,
  buttonStyles,
  buttonVariant,
  dropdownStyles,
  dropdownPosition,
  "aria-label": ariaLabel,
}: DropdownButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setIsOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} css={containerStyles}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        css={buttonVariant === "default" ? buttonStyles : iconBtnStyles(theme)}
      >
        {buttonText}
      </button>
      {isOpen && (
        <Dropdown
          dropdownStyles={dropdownStyles}
          onClose={() => setIsOpen(false)}
          position={dropdownPosition}
          outsideClickRef={containerRef}
        >
          {children}
        </Dropdown>
      )}
    </div>
  );
};

export default DropdownButton;
