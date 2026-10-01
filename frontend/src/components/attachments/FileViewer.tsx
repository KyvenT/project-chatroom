import { css, useTheme, type Theme } from "@emotion/react";
import { Download, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAttachmentFile } from "../../hooks/useAttachmentFile";
import type { Attachment } from "../../types/REST-types/Message";
import {
  attachmentKind,
  formatFileSize,
  saveBlob,
} from "../../utils/attachments";
import { Loader } from "../Loader";
import { MediaPlayer } from "./MediaPlayer";

// text files longer than this (characters) are cut short in the viewer
export const MAX_TEXT_PREVIEW = 200_000;

const styles = (theme: Theme) =>
  css({
    width: "100dvw",
    height: "100dvh",
    maxWidth: "100dvw",
    maxHeight: "100dvh",
    margin: 0,
    padding: 0,
    border: 0,
    color: theme.colors.white,
    backgroundColor: "rgba(8, 9, 12, 0.94)",

    "&[open]": {
      display: "flex",
      flexDirection: "column",
    },

    "&::backdrop": { backgroundColor: theme.colors.backdrop },

    ".viewerHeader": {
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "10px 16px",
      borderBottom: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.dark_grey,
    },

    ".viewerTitle": {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
    },

    ".viewerName": {
      fontSize: "0.95rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    ".viewerMeta": {
      fontSize: "0.75rem",
      color: theme.colors.light_grey,
    },

    ".viewerBtn": {
      flex: "0 0 auto",
      width: "2.25rem",
      height: "2.25rem",
      display: "grid",
      placeItems: "center",
      padding: 0,
      border: 0,
      borderRadius: theme.radius.sm,
      color: theme.colors.light_grey,
      backgroundColor: "transparent",
      cursor: "pointer",

      "&:hover:enabled": {
        color: theme.colors.white,
        backgroundColor: theme.colors.grey,
      },
      "&:disabled": { opacity: 0.5, cursor: "default" },
      "&:focus-visible": { outline: `2px solid ${theme.colors.accent}` },
    },

    ".viewerBody": {
      flex: 1,
      minHeight: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      overflow: "auto",
    },

    ".viewerImage": {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
    },

    ".viewerVideo": {
      width: "min(100%, 1100px)",
      maxHeight: "100%",
    },

    ".viewerAudio": {
      width: "min(100%, 520px)",
    },

    ".viewerPdf": {
      width: "min(100%, 1000px)",
      height: "100%",
      border: 0,
      borderRadius: theme.radius.md,
      backgroundColor: "#fff",
    },

    ".viewerText": {
      alignSelf: "stretch",
      width: "min(100%, 1000px)",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },

    ".viewerText pre": {
      margin: 0,
      padding: "16px",
      overflowWrap: "anywhere",
      whiteSpace: "pre-wrap",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
      fontSize: "0.85rem",
      lineHeight: 1.5,
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.black,
    },

    ".viewerNote, .viewerStatus": {
      fontSize: "0.8rem",
      color: theme.colors.light_grey,
      textAlign: "center",
    },
  });

// the start of a text file, and whether it was cut short
const useTextPreview = (blob: Blob | undefined) => {
  const [text, setText] = useState<{ body: string; cut: boolean }>();
  useEffect(() => {
    if (!blob) return;
    let cancelled = false;
    blob.text().then((body) => {
      if (cancelled) return;
      setText({
        body: body.slice(0, MAX_TEXT_PREVIEW),
        cut: body.length > MAX_TEXT_PREVIEW,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [blob]);
  return text;
};

interface FileViewerProps {
  attachment: Attachment;
  onClose: () => void;
}

// A sent file shown over the whole app, with a way to download it. Escape or
// the close button closes it.
export const FileViewer = ({ attachment, onClose }: FileViewerProps) => {
  const theme = useTheme();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const kind = attachmentKind(attachment.mimeType);
  const { blob, url, isError, isLoading } = useAttachmentFile(attachment, true);
  const text = useTextPreview(kind === "text" ? blob : undefined);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal?.();
    return () => dialog.close?.();
  }, []);

  const body = () => {
    if (isError) {
      return <p className="viewerStatus">Couldn't get the file</p>;
    }
    if (kind === "video" || kind === "audio") {
      return (
        <MediaPlayer
          kind={kind}
          title={attachment.fileName}
          src={url}
          loading={isLoading}
          autoPlay
          className={kind === "video" ? "viewerVideo" : "viewerAudio"}
        />
      );
    }
    if (isLoading || !url) {
      return (
        <div className="viewerStatus" aria-label="Loading file">
          <Loader />
        </div>
      );
    }
    switch (kind) {
      case "image":
        return (
          <img className="viewerImage" src={url} alt={attachment.fileName} />
        );
      case "pdf":
        return (
          <iframe className="viewerPdf" src={url} title={attachment.fileName} />
        );
      case "text":
        return text ? (
          <div className="viewerText">
            <pre tabIndex={0}>{text.body}</pre>
            {text.cut && (
              <p className="viewerNote">
                Only the start of this file is shown. Download it to see the
                rest.
              </p>
            )}
          </div>
        ) : (
          <div className="viewerStatus">
            <Loader />
          </div>
        );
      default:
        return (
          <p className="viewerStatus">
            This file can't be previewed. Download it to open it.
          </p>
        );
    }
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      css={styles(theme)}
      aria-label={attachment.fileName}
      onCancel={(event) => {
        // closed by React, so the dialog and state don't disagree
        event.preventDefault();
        onClose();
      }}
    >
      <header className="viewerHeader">
        <div className="viewerTitle">
          <span className="viewerName" title={attachment.fileName}>
            {attachment.fileName}
          </span>
          <span className="viewerMeta">{formatFileSize(attachment.size)}</span>
        </div>
        <button
          type="button"
          className="viewerBtn"
          onClick={() => blob && saveBlob(blob, attachment.fileName)}
          disabled={!blob}
          aria-label={`Download ${attachment.fileName}`}
        >
          <Download size="1.15rem" />
        </button>
        <button
          type="button"
          className="viewerBtn"
          onClick={onClose}
          aria-label="Close viewer"
          autoFocus
        >
          <X size="1.25rem" />
        </button>
      </header>
      <div className="viewerBody">{body()}</div>
    </dialog>,
    document.body,
  );
};
