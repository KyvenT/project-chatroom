import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FileViewer,
  MAX_TEXT_PREVIEW,
} from "../../src/components/attachments/FileViewer";
import { fetchAttachment, saveBlob } from "../../src/utils/attachments";
import { renderWithProviders } from "../renderWithProviders";

vi.mock("../../src/utils/attachments", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/attachments")>()),
  fetchAttachment: vi.fn(),
  saveBlob: vi.fn(),
}));

const open = (fileName: string, mimeType: string, onClose = vi.fn()) => {
  renderWithProviders(
    <QueryClientProvider client={new QueryClient()}>
      <FileViewer
        attachment={{ id: fileName, fileName, mimeType, size: 100 }}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
  return onClose;
};

describe("FileViewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => "blob:file");
    URL.revokeObjectURL = vi.fn();
  });

  it("shows text files as text", async () => {
    vi.mocked(fetchAttachment).mockResolvedValue(
      new Blob(["line one\nline two"]),
    );
    open("notes.txt", "text/plain");
    expect(await screen.findByText(/line one\s+line two/)).toBeInTheDocument();
    expect(screen.queryByText(/Only the start/)).toBeNull();
  });

  it("cuts very long text files short and says so", async () => {
    vi.mocked(fetchAttachment).mockResolvedValue(
      new Blob(["a".repeat(MAX_TEXT_PREVIEW + 10)]),
    );
    open("big.txt", "text/plain");
    expect(await screen.findByText(/Only the start/)).toBeInTheDocument();
  });

  it("shows PDFs in a frame of a PDF-typed blob", async () => {
    vi.mocked(fetchAttachment).mockResolvedValue(new Blob(["%PDF-"]));
    open("doc.pdf", "application/pdf");
    await waitFor(() =>
      expect(document.querySelector("iframe")).toHaveAttribute(
        "src",
        "blob:file",
      ),
    );
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/pdf");
  });

  it("shows images and plays video", async () => {
    vi.mocked(fetchAttachment).mockResolvedValue(new Blob(["x"]));
    open("cat.png", "image/png");
    expect(await screen.findByAltText("cat.png")).toBeInTheDocument();

    open("clip.mp4", "video/mp4");
    expect(
      screen.getByRole("group", { name: "Video player: clip.mp4" }),
    ).toBeInTheDocument();
  });

  it("downloads the file and closes", async () => {
    vi.mocked(fetchAttachment).mockResolvedValue(new Blob(["hi"]));
    const onClose = open("notes.txt", "text/plain");

    const download = screen.getByRole("button", { name: "Download notes.txt" });
    await waitFor(() => expect(download).toBeEnabled());
    fireEvent.click(download);
    expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), "notes.txt");

    fireEvent.click(screen.getByRole("button", { name: "Close viewer" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("says when the file couldn't be fetched", async () => {
    vi.mocked(fetchAttachment).mockRejectedValue(new Error("nope"));
    open("notes.txt", "text/plain");
    expect(
      await screen.findByText("Couldn't get the file", {}, { timeout: 4000 }),
    ).toBeInTheDocument();
  });
});
