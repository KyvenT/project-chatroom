import { css, type SerializedStyles, type Theme } from "@emotion/react";
import React, { useRef } from "react";
import { useOutsideClick } from "../hooks/useHandleOutsideClick";
import type { DropdownPosition } from "./DropdownButton";

interface DropdownProps {
  children: React.ReactNode;
  onClose: () => void;
  dropdownStyles?: SerializedStyles;
  position?: DropdownPosition;
}

const defaultDropdownStyles = (position: DropdownPosition) =>
  css({
    position: "absolute",
    top: "55px",
    right: position === "right" ? 0 : "auto",
    left: position === "left" ? 0 : "auto",
    zIndex: "2",
  });

const Dropdown = ({
  children,
  onClose,
  dropdownStyles,
  position = "right",
}: DropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick({ callbackFn: onClose, elementRef: dropdownRef });

  return (
    <div
      ref={dropdownRef}
      css={[defaultDropdownStyles(position), dropdownStyles]}
    >
      {children}
    </div>
  );
};

export default Dropdown;
