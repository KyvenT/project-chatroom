import { css, useTheme, type Theme } from "@emotion/react";
import React, { useRef } from "react";
import { useOutsideClick } from "../hooks/useHandleOutsideClick";

interface DropdownProps {
  children: React.ReactNode;
  onClose: () => void;
}

const defaultDropdownStyles = css({
  position: "absolute",
  top: "55px",
  right: 0,
  border: "1px solid black",
  padding: "10px",
  borderRadius: "5px",
  zIndex: "2",
});

const colors = (theme: Theme) =>
  css({
    backgroundColor: theme.colors.white,
    color: theme.colors.dark_grey,
  });

const Dropdown = ({ children, onClose }: DropdownProps) => {
  const theme = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useOutsideClick({ callbackFn: onClose, elementRef: dropdownRef });

  return (
    <div ref={dropdownRef} css={[defaultDropdownStyles, colors(theme)]}>
      {children}
    </div>
  );
};

export default Dropdown;
