import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MessageAttachment } from "../../src/components/chat/MessageAttachment";
import { fetchAttachment, saveBlob } from "../../src/utils/attachments";
import { renderWithProviders } from "../renderWithProviders";

vi.mock("../../src/utils/attachments", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/attachments")>()),
  fetchAttachment: vi.fn(),
  saveBlob: vi.fn(),
}));

const render = (ui: React.ReactElement) =>
  renderWithProviders(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );

const image = {
  id: "a1",
  fileName: "cat.png",
  mimeType: "image/png",
  size: 10,
};
const pdf = {
  id: "a2",
  fileName: "notes.pdf",
  mimeType: "application/pdf",
  size: 2048,
};

describe("MessageAttachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:cat");
    URL.revokeObjectURL = vi.fn();
  });

  it("shows images once they're fetched", async () => {
    vi.mocked(fetchAttachment).mockResolvedValue(new Blob(["x"]));
    render(<MessageAttachment attachment={image} />);

    const img = await screen.findByAltText("cat.png");
    expect(img).toHaveAttribute("src", "blob:cat");
    expect(fetchAttachment).toHaveBeenCalledWith("a1");
  });

  it("only fetches other files when they're downloaded", async () => {
    const blob = new Blob(["%PDF-"]);
    vi.mocked(fetchAttachment).mockResolvedValue(blob);
    render(<MessageAttachment attachment={pdf} />);

    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(fetchAttachment).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Download notes.pdf" }));
    await waitFor(() =>
      expect(saveBlob).toHaveBeenCalledWith(blob, "notes.pdf"),
    );
  });

  it("shows images as a file card when compact", () => {
    render(<MessageAttachment attachment={image} compact />);
    expect(
      screen.getByRole("button", { name: "Download cat.png" }),
    ).toBeInTheDocument();
    expect(fetchAttachment).not.toHaveBeenCalled();
  });
});
