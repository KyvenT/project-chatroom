import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Button from "../../src/components/Button";
import { renderWithProviders } from "../renderWithProviders";

describe("Button", () => {
  it("renders children and forwards props", () => {
    renderWithProviders(
      <Button aria-label="save" type="submit">
        Save
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "save" });
    expect(btn).toHaveTextContent("Save");
    expect(btn).toHaveAttribute("type", "submit");
  });

  it("calls onClick", () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the icon variant styling", () => {
    renderWithProviders(<Button variant="icon">i</Button>);
    expect(screen.getByRole("button")).toHaveStyle({ cursor: "pointer" });
  });
});
