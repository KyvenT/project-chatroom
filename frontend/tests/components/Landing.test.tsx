import { fireEvent, screen } from "@testing-library/react";
import { Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LandingPage from "../../src/router/routes/landing/Landing";
import { renderWithProviders } from "../renderWithProviders";

const Location = () => <p data-testid="location">{useLocation().pathname}</p>;

const key = "abcDEF123_-xyz09";

const renderLanding = () =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/join/:joinKey" element={<Location />} />
    </Routes>,
  );

describe("Landing page join tab", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  const openJoinTab = () =>
    fireEvent.click(screen.getByRole("button", { name: "Join Chatroom" }));

  it("shows the about content by default", () => {
    renderLanding();
    expect(
      screen.getByText(/Create chatrooms to manage group communication/),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Invite id or link"),
    ).not.toBeInTheDocument();
  });

  it("switches to the join form and back", () => {
    renderLanding();
    openJoinTab();
    expect(screen.getByLabelText("Invite id or link")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "About Project Chatroom" }),
    );
    expect(
      screen.getByText(/Create chatrooms to manage group communication/),
    ).toBeInTheDocument();
  });

  it("goes to the invite page for a bare invite id", () => {
    renderLanding();
    openJoinTab();
    fireEvent.change(screen.getByLabelText("Invite id or link"), {
      target: { value: key },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByTestId("location")).toHaveTextContent(`/join/${key}`);
  });

  it("goes to the invite page for a pasted invite link", () => {
    renderLanding();
    openJoinTab();
    fireEvent.change(screen.getByLabelText("Invite id or link"), {
      target: { value: `https://chat.example.com/join/${key}` },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByTestId("location")).toHaveTextContent(`/join/${key}`);
  });

  it("shows an error and stays put for an invalid id", () => {
    renderLanding();
    openJoinTab();
    fireEvent.change(screen.getByLabelText("Invite id or link"), {
      target: { value: "not-valid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByText(/valid invite id or link/)).toBeInTheDocument();
    expect(screen.queryByTestId("location")).not.toBeInTheDocument();
  });
});
