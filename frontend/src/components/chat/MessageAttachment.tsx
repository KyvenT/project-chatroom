import { css, useTheme, type Theme } from "@emotion/react";
import {
  Download,
  File,
  FileArchive,
  FileAudio,
  FileText,
  FileVideo,
  Maximize2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAttachmentFile } from "../../hooks/useAttachmentFile";
import type { Attachment } from "../../types/REST-types/Message";
import {
  attachmentKind,
  formatFileSize,
  isViewable,
  saveBlob,
  type AttachmentKind,
} from "../../utils/attachments";
import { FileViewer } from "../attachments/FileViewer";
import { MediaPlayer } from "../attachments/MediaPlayer";

const styles = (theme: Theme) =>
  css({
    marginTop: "4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "4px",
    maxWidth: "100%",

    ".imageBtn": {
      display: "block",
      maxWidth: "100%",
      padding: 0,
      border: 0,
      background: "none",
      cursor: "zoom-in",
      borderRadius: theme.radius.md,

      "&:focus-visible": {
        outline: `2px solid ${theme.colors.accent}`,
        outlineOffset: "2px",
      },
    },

    img: {
      display: "block",
      maxWidth: "min(100%, 360px)",
      maxHeight: "280px",
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
    },

    ".imagePlaceholder": {
      width: "200px",
      maxWidth: "100%",
      height: "120px",
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.dark_grey,
    },

    ".inlineVideo": {
      width: "min(100%, 420px)",
      maxHeight: "320px",
    },

    ".inlineAudio": {
      width: "min(100%, 360px)",
    },

    ".fileCard": {
      display: "flex",
      alignItems: "center",
      maxWidth: "min(100%, 360px)",
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.dark_grey,

      "&:hover": { borderColor: theme.colors.borderStrong },
    },

    ".fileCard .cardBtn": { marginRight: "4px" },

    ".fileMain": {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "8px 10px",
      border: 0,
      borderRadius: theme.radius.md,
      background: "none",
      color: theme.colors.white,
      font: "inherit",
      textAlign: "left",
      cursor: "pointer",

      "& > svg": { flex: "0 0 auto", color: theme.colors.accent },
      "&:focus-visible": { outline: `2px solid ${theme.colors.accent}` },
    },

    ".fileText": {
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
    },

    ".fileName": {
      fontSize: "0.85rem",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    ".fileMeta, .fileError": {
      fontSize: "0.7rem",
      color: theme.colors.light_grey,
    },

    ".fileError": { color: theme.colors.danger },

    ".mediaBar": {
      display: "flex",
      alignItems: "center",
      gap: "2px",
      width: "min(100%, 420px)",
    },

    ".mediaInfo": {
      flex: 1,
      minWidth: 0,
      fontSize: "0.72rem",
      color: theme.colors.light_grey,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    ".cardBtn": {
      flex: "0 0 auto",
      width: "2rem",
      height: "2rem",
      display: "grid",
      placeItems: "center",
      padding: 0,
      border: 0,
      borderRadius: theme.radius.sm,
      color: theme.colors.light_grey,
      background: "none",
      cursor: "pointer",

      "&:hover": {
        color: theme.colors.white,
        backgroundColor: theme.colors.grey,
      },
      "&:focus-visible": { outline: `2px solid ${theme.colors.accent}` },
    },
  });

const kindIcons: Record<AttachmentKind, typeof File> = {
  image: File,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  text: FileText,
  file: FileArchive,
};

interface MessageAttachmentProps {
  attachment: Attachment;
  // just the file card, with no image or player
  compact?: boolean;
}

// A file sent as a message. Images are shown and video and audio play in the
// chat; any file that can be previewed opens in the file viewer, and every
// file can be downloaded.
export const MessageAttachment = ({
  attachment,
  compact = false,
}: MessageAttachmentProps) => {
  const theme = useTheme();
  const kind = attachmentKind(attachment.mimeType);
  const showImage = !compact && kind === "image";
  const showPlayer = !compact && (kind === "video" || kind === "audio");

  // images are fetched right away; anything else when it's played or
  // downloaded
  const [requested, setRequested] = useState(false);
  const [downloadRequested, setDownloadRequested] = useState(false);
  const [viewing, setViewing] = useState(false);
  const { blob, url, isError, isLoading } = useAttachmentFile(
    attachment,
    showImage || requested,
  );

  // a download clicked before the file arrived saves it once it does
  useEffect(() => {
    if (!downloadRequested || !blob) return;
    saveBlob(blob, attachment.fileName);
    setDownloadRequested(false);
  }, [downloadRequested, blob, attachment.fileName]);

  const download = () => {
    if (blob) {
      saveBlob(blob, attachment.fileName);
      return;
    }
    setRequested(true);
    setDownloadRequested(true);
  };

  const viewer = viewing && (
    <FileViewer attachment={attachment} onClose={() => setViewing(false)} />
  );

  if (showImage && !isError) {
    return (
      <div css={styles(theme)}>
        <button
          type="button"
          className="imageBtn"
          onClick={() => setViewing(true)}
          aria-label={`Open ${attachment.fileName}`}
        >
          {url ? (
            <img src={url} alt={attachment.fileName} />
          ) : (
            <div
              className="imagePlaceholder"
              role="img"
              aria-label={`Loading ${attachment.fileName}`}
            />
          )}
        </button>
        {viewer}
      </div>
    );
  }

  const Icon = kindIcons[kind];
  const viewable = isViewable(kind);
  const card = (
    <div className="fileCard">
      <button
        type="button"
        className="fileMain"
        onClick={viewable ? () => setViewing(true) : download}
        aria-label={
          viewable
            ? `Open ${attachment.fileName}`
            : `Download ${attachment.fileName}`
        }
      >
        <Icon size="1.5rem" aria-hidden />
        <span className="fileText">
          <span className="fileName">{attachment.fileName}</span>
          {isError && !showPlayer ? (
            <span className="fileError">Couldn't get the file</span>
          ) : (
            <span className="fileMeta">
              {downloadRequested
                ? "Downloading…"
                : formatFileSize(attachment.size)}
            </span>
          )}
        </span>
      </button>
      {viewable && (
        <button
          type="button"
          className="cardBtn"
          onClick={download}
          aria-label={`Download ${attachment.fileName}`}
        >
          <Download size="1rem" />
        </button>
      )}
    </div>
  );

  if (showPlayer) {
    return (
      <div css={styles(theme)}>
        <MediaPlayer
          kind={kind}
          title={attachment.fileName}
          src={url}
          loading={isLoading}
          error={isError}
          onRequestLoad={() => setRequested(true)}
          // the viewer plays it instead
          suspended={viewing}
          className={kind === "video" ? "inlineVideo" : "inlineAudio"}
        />
        <div className="mediaBar">
          <span className="mediaInfo" title={attachment.fileName}>
            {/* the audio player already shows the name */}
            {kind === "video" && `${attachment.fileName} · `}
            {downloadRequested
              ? "Downloading…"
              : formatFileSize(attachment.size)}
          </span>
          <button
            type="button"
            className="cardBtn"
            onClick={() => setViewing(true)}
            aria-label={`Open ${attachment.fileName} in the viewer`}
          >
            <Maximize2 size="0.95rem" />
          </button>
          <button
            type="button"
            className="cardBtn"
            onClick={download}
            aria-label={`Download ${attachment.fileName}`}
          >
            <Download size="1rem" />
          </button>
        </div>
        {viewer}
      </div>
    );
  }

  return (
    <div css={styles(theme)}>
      {card}
      {viewer}
    </div>
  );
};
