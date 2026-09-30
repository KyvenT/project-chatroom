import { describe, expect, it } from "vitest";
import {
  checkAttachment,
  cleanFileName,
  contentDisposition,
  MAX_ATTACHMENT_SIZE,
  parseMimeType,
} from "../../src/lib/attachments.js";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
const pdf = Buffer.from("%PDF-1.7\n...");

describe("parseMimeType", () => {
  it("drops parameters and lowercases", () => {
    expect(parseMimeType("Text/Plain; charset=utf-8")).toBe("text/plain");
    expect(parseMimeType(undefined)).toBe("");
  });
});

describe("checkAttachment", () => {
  it("accepts allowed types whose bytes match", () => {
    expect(checkAttachment("image/png", png)).toEqual({ ok: true });
    expect(checkAttachment("application/pdf", pdf)).toEqual({ ok: true });
    expect(checkAttachment("text/plain", Buffer.from("hi"))).toEqual({
      ok: true,
    });
  });

  it("rejects types that aren't allowed", () => {
    for (const type of ["image/svg+xml", "text/html", "", "application/x-sh"]) {
      expect(checkAttachment(type, Buffer.from("<svg/>"))).toMatchObject({
        ok: false,
        status: 415,
      });
    }
  });

  it("rejects files whose bytes don't match their claimed type", () => {
    expect(checkAttachment("image/png", Buffer.from("<html>"))).toMatchObject({
      ok: false,
      status: 415,
    });
    expect(checkAttachment("image/jpeg", pdf)).toMatchObject({ ok: false });
    expect(
      checkAttachment("text/plain", Buffer.from([0x68, 0x00])),
    ).toMatchObject({ ok: false });
  });

  it("rejects empty and oversized files", () => {
    expect(checkAttachment("text/plain", Buffer.alloc(0))).toMatchObject({
      ok: false,
      status: 400,
    });
    const big = Buffer.concat([png, Buffer.alloc(MAX_ATTACHMENT_SIZE)]);
    expect(checkAttachment("image/png", big)).toMatchObject({
      ok: false,
      status: 413,
    });
  });
});

describe("cleanFileName", () => {
  it("strips folders and control characters", () => {
    expect(cleanFileName("../../etc/passwd")).toBe("passwd");
    expect(cleanFileName("C:\\Users\\a\\photo.png")).toBe("photo.png");
    expect(cleanFileName("a\r\nb.txt")).toBe("ab.txt");
  });

  it("falls back to a name when nothing is left", () => {
    expect(cleanFileName("  ")).toBe("file");
    expect(cleanFileName("folder/")).toBe("file");
  });
});

describe("contentDisposition", () => {
  it("shows images inline and downloads everything else", () => {
    expect(contentDisposition("a.png", "image/png")).toMatch(/^inline;/);
    expect(contentDisposition("a.pdf", "application/pdf")).toMatch(
      /^attachment;/,
    );
  });

  it("encodes names so they can't break out of the header", () => {
    const header = contentDisposition(
      'résumé "final"(1).pdf',
      "application/pdf",
    );
    expect(header).toContain('filename="r_sum_ _final_(1).pdf"');
    expect(header).toContain(
      "filename*=UTF-8''r%C3%A9sum%C3%A9%20%22final%22%281%29.pdf",
    );
  });
});
