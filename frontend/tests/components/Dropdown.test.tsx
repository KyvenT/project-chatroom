import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DropdownButton from "../../src/components/DropdownButton";
import { renderWithProviders } from "../renderWithProviders";

describe("DropdownButton", () => {
  const setup = () =>
    renderWithProviders(
      <div>
        <p>outside</p>
        <DropdownButton buttonText="Menu">
          <span>dropdown content</span>
        </DropdownButton>
      </div>,
    );

  it("is closed initially", () => {
    setup();
    expect(screen.queryByText("dropdown content")).not.toBeInTheDocument();
  });

  it("opens when the button is clicked", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(screen.getByText("dropdown content")).toBeInTheDocument();
  });

  it("closes on an outside click but not on an inside click", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));

    fireEvent.mouseDown(screen.getByText("dropdown content"));
    expect(screen.getByText("dropdown content")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText("outside"));
    expect(screen.queryByText("dropdown content")).not.toBeInTheDocument();
  });

  it("closes when the button is clicked again", () => {
    setup();
    const button = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");

    fireEvent.mouseDown(button);
    fireEvent.click(button);
    expect(screen.queryByText("dropdown content")).not.toBeInTheDocument();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and returns focus to the button", () => {
    setup();
    const button = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(button);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("dropdown content")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("closes when a link in the menu is followed", () => {
    renderWithProviders(
      <DropdownButton buttonText="Menu" aria-label="Open menu">
        <a href="#account">Account</a>
      </DropdownButton>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByText("Account"));
    expect(screen.queryByText("Account")).not.toBeInTheDocument();
  });
});
