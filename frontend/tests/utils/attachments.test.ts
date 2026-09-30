import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../../src/hooks/useStores";
import {
  attachmentProblem,
  formatFileSize,
  MAX_ATTACHMENT_SIZE,
  uploadAttachment,
} from "../../src/utils/attachments";

vi.mock("../../src/utils/refreshAccessToken", () => ({
  refreshAccessToken: vi.fn(),
}));

const fileOf = (type: string, size = 4, name = "f") =>
  new File([new Uint8Array(size)], name, { type });

describe("attachmentProblem", () => {
  it("allows the types the server accepts", () => {
    expect(attachmentProblem(fileOf("image/png"))).toBeNull();
    expect(attachmentProblem(fileOf("application/pdf"))).toBeNull();
    expect(
      attachmentProblem(fileOf("application/x-zip-compressed")),
    ).toBeNull();
  });

  it("names why a file can't be sent", () => {
    expect(attachmentProblem(fileOf("image/svg+xml"))).toMatch(/type/);
    expect(attachmentProblem(fileOf(""))).toMatch(/type/);
    expect(attachmentProblem(fileOf("text/plain", 0))).toMatch(/empty/);
    expect(
      attachmentProblem(fileOf("text/plain", MAX_ATTACHMENT_SIZE + 1)),
    ).toMatch(/at most 8 MB/);
  });
});

describe("formatFileSize", () => {
  it("uses a readable unit", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3 MB");
  });
});

describe("uploadAttachment", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    useAuthStore.setState({
      user: { ...useAuthStore.getState().user, token: "tok" },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("sends the file as the body with its MIME type and name", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "m1" }), { status: 201 }),
    );
    const file = fileOf("application/x-zip-compressed", 4, "my files.zip");
    await uploadAttachment("c1", file);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/messages/c1/attachments?name=my%20files.zip");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(file);
    expect(init.headers.get("Content-Type")).toBe("application/zip");
    expect(init.headers.get("authorization")).toBe("Bearer tok");
  });

  it("throws the server's reason when it refuses the file", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ message: "The file's contents don't match its type" }),
        { status: 415 },
      ),
    );
    await expect(uploadAttachment("c1", fileOf("image/png"))).rejects.toThrow(
      "The file's contents don't match its type",
    );
  });
});
