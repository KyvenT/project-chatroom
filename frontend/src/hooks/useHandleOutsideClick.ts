import React, { useEffect } from "react";

export type OutsideClickElement = {
  elementRef: React.RefObject<HTMLDivElement | HTMLDialogElement | null>;
  callbackFn: (() => void) | undefined;
};

const elementStack: OutsideClickElement[] = [];
let listenerCreated: boolean = false;

const handleClick = (event: MouseEvent) => {
  if (elementStack.length === 0) return;
  const topElement = elementStack[elementStack.length - 1];
  const { callbackFn, elementRef } = topElement;

  if (!callbackFn) return;
  if (elementRef.current?.contains(event.target as Node)) {
    console.log("inside click");
    return;
  }
  callbackFn();
  console.log("callback called");
};

export const useOutsideClick = (element: OutsideClickElement) => {
  useEffect(() => {
    if (!listenerCreated) {
      document.addEventListener("mousedown", handleClick);
      listenerCreated = true;
    }
    elementStack.push(element);

    return () => {
      const i = elementStack.indexOf(element);
      if (i !== -1) elementStack.splice(i, 1);

      if (elementStack.length === 0 && listenerCreated) {
        document.removeEventListener("mousedown", handleClick);
        listenerCreated = false;
      }
    };
  }, []);
};
