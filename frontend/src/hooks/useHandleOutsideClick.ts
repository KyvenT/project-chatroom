import React, { useEffect } from "react";

export const useOutsideClick = (
  callbackFn: (() => void) | undefined,
  elementRef: React.RefObject<HTMLDivElement | HTMLDialogElement | null>
) => {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!callbackFn) return;
      console.log(elementRef.current?.contains(event.target as Node));
      if (elementRef.current?.contains(event.target as Node)) {
        return;
      }
      callbackFn();
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);
};
