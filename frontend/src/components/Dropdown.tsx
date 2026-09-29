import { css, useTheme, type SerializedStyles } from "@emotion/react";
import React, { useRef } from "react";
import { useOutsideClick } from "../hooks/useHandleOutsideClick";
import type { DropdownPosition } from "./DropdownButton";
import { menuStyles } from "../styles/menu";

interface DropdownProps {
  children: React.ReactNode;
  onClose: () => void;
  dropdownStyles?: SerializedStyles;
  position?: DropdownPosition;
  // clicks inside this element don't count as outside clicks (defaults to the
  // dropdown itself); DropdownButton passes its wrapper so its own button
  // can toggle the menu closed
  outsideClickRef?: React.RefObject<HTMLDivElement | null>;
}

const positionStyles = (position: DropdownPosition) =>
  css({
    position: "absolute",
    top: "calc(100% + 8px)",
    right: position === "right" ? 0 : "auto",
    left: position === "left" ? 0 : "auto",
    zIndex: "2",
  });

const Dropdown = ({
  children,
  onClose,
  dropdownStyles,
  position = "right",
  outsideClickRef,
}: DropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useOutsideClick({
    callbackFn: onClose,
    elementRef: outsideClickRef ?? dropdownRef,
  });

  return (
    <div
      ref={dropdownRef}
      css={[positionStyles(position), menuStyles(theme), dropdownStyles]}
      // following a link or a [data-close-menu] item closes the menu
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a, [data-close-menu]")) {
          onClose();
        }
      }}
    >
      {children}
    </div>
  );
};

export default Dropdown;
