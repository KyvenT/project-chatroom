import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "../../src/hooks/useIsMobile";

const mockMatchMedia = (matches: boolean) => {
  let listener: (() => void) | undefined;
  const mql = {
    matches,
    addEventListener: vi.fn((_: string, cb: () => void) => (listener = cb)),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue(mql));
  return {
    mql,
    change: (next: boolean) => {
      mql.matches = next;
      listener?.();
    },
  };
};

describe("useIsMobile", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is true when the viewport is below the breakpoint", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
  });

  it("is false on wide viewports", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("updates when the media query changes", () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());

    act(() => media.change(true));
    expect(result.current).toBe(true);
  });

  it("removes its listener on unmount", () => {
    const media = mockMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobile());

    unmount();
    expect(media.mql.removeEventListener).toHaveBeenCalled();
  });
});
