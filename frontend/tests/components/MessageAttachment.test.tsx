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

const file = (fileName: string, mimeType: string, size = 2048) => ({
  id: fileName,
  fileName,
  mimeType,
  size,
});
const image = file("cat.png", "image/png");
const pdf = file("notes.pdf", "application/pdf");
const zip = file("stuff.zip", "application/zip");
const video = file("clip.mp4", "video/mp4");
const audio = file("song.mp3", "audio/mpeg");

describe("MessageAttachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:file");
    URL.revokeObjectURL = vi.fn();
    vi.mocked(fetchAttachment).mockResolvedValue(new Blob(["x"]));
  });

  it("shows images once they're fetched", async () => {
    render(<MessageAttachment attachment={image} />);

    const img = await screen.findByAltText("cat.png");
    expect(img).toHaveAttribute("src", "blob:file");
    expect(fetchAttachment).toHaveBeenCalledWith("cat.png");
  });

  it("gives the blob the file's own type", async () => {
    render(<MessageAttachment attachment={image} />);
    await screen.findByAltText("cat.png");
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe("image/png");
  });

  it("only fetches other files when they're downloaded", async () => {
    render(<MessageAttachment attachment={pdf} />);

    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(fetchAttachment).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Download notes.pdf" }));
    await waitFor(() =>
      expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), "notes.pdf"),
    );
  });

  it("opens previewable files in the viewer", async () => {
    render(<MessageAttachment attachment={pdf} />);
    fireEvent.click(screen.getByRole("button", { name: "Open notes.pdf" }));

    await waitFor(() =>
      expect(document.querySelector("iframe")).toHaveAttribute(
        "src",
        "blob:file",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Close viewer" }));
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("downloads files that can't be previewed", async () => {
    render(<MessageAttachment attachment={zip} />);
    fireEvent.click(screen.getByRole("button", { name: "Download stuff.zip" }));
    await waitFor(() => expect(saveBlob).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: /Open/ })).toBeNull();
  });

  it("plays videos and audio in the chat without fetching them first", () => {
    render(
      <>
        <MessageAttachment attachment={video} />
        <MessageAttachment attachment={audio} />
      </>,
    );
    expect(
      screen.getByRole("group", { name: "Video player: clip.mp4" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Audio player: song.mp3" }),
    ).toBeInTheDocument();
    expect(fetchAttachment).not.toHaveBeenCalled();
  });

  it("shows only a file card when compact", () => {
    render(
      <>
        <MessageAttachment attachment={image} compact />
        <MessageAttachment attachment={video} compact />
      </>,
    );
    expect(
      screen.getByRole("button", { name: "Open cat.png" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("group")).toBeNull();
    expect(fetchAttachment).not.toHaveBeenCalled();
  });
});
