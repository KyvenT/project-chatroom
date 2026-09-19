import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import useToggle from "../../src/hooks/useToggle";

describe("useToggle", () => {
  it("defaults to false", () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it("respects the initial state", () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it("flips when called with no argument", () => {
    const { result } = renderHook(() => useToggle());

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(false);
  });

  it("sets true when called with true", () => {
    const { result } = renderHook(() => useToggle());

    act(() => result.current[1](true));
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });

  // Documents current behaviour: passing false toggles rather than sets.
  it("toggles (rather than sets) when called with false", () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);

    act(() => result.current[1](false));
    expect(result.current[0]).toBe(true);
  });
});
