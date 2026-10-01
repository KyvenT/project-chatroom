import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Avatar } from "../../src/components/Avatar";
import { useAvatarStore } from "../../src/hooks/useAvatarStore";
import { avatarUrl } from "../../src/utils/avatars";
import { wsMessageRouter } from "../../src/ws-router/router";
import { renderWithProviders } from "../renderWithProviders";

const version = "2026-10-01T12:00:00.000Z";

describe("Avatar", () => {
  beforeEach(() => useAvatarStore.setState({ versions: {} }));

  it("shows the picture at a URL that changes with each new picture", () => {
    const { container } = renderWithProviders(
      <Avatar userId="u1" username="alice" avatarUpdatedAt={version} />,
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      avatarUrl("u1", version),
    );
    expect(avatarUrl("u1", version)).toMatch(/\/api\/avatars\/u1\?v=\d+$/);
  });

  it("shows the first letter of the name without a picture", () => {
    const { container } = renderWithProviders(
      <Avatar userId="u1" username="alice" />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("A");
  });

  it("falls back to the letter if the picture won't load", () => {
    const { container } = renderWithProviders(
      <Avatar userId="u1" username="alice" avatarUpdatedAt={version} />,
    );
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector("img")).toBeNull();
    expect(container).toHaveTextContent("A");
  });

  it("uses a picture changed while the app is open", () => {
    const { container } = renderWithProviders(
      <Avatar userId="u1" username="alice" avatarUpdatedAt={version} />,
    );
    const newer = "2026-10-02T08:00:00.000Z";
    act(() =>
      wsMessageRouter({
        type: "avatar-updated",
        userId: "u1",
        avatarUpdatedAt: newer,
      }),
    );
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      avatarUrl("u1", newer),
    );

    // and a removed one
    act(() =>
      wsMessageRouter({
        type: "avatar-updated",
        userId: "u1",
        avatarUpdatedAt: null,
      }),
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("is hidden from screen readers unless given a label", () => {
    const { container } = renderWithProviders(
      <>
        <Avatar userId="u1" username="alice" />
        <Avatar userId="u2" username="bob" label="Bob's picture" />
      </>,
    );
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(
      screen.getByRole("img", { name: "Bob's picture" }),
    ).toBeInTheDocument();
  });

  it("shows a generic icon for deleted users", () => {
    const { container } = renderWithProviders(<Avatar userId={null} />);
    expect(container.querySelector("svg")).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
