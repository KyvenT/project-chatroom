import { css, useTheme, type Theme } from "@emotion/react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import type { Attachment } from "../../types/REST-types/Message";
import {
  fetchAttachment,
  formatFileSize,
  INLINE_TYPES,
  saveBlob,
} from "../../utils/attachments";

const styles = (theme: Theme) =>
  css({
    marginTop: "4px",

    img: {
      display: "block",
      maxWidth: "min(100%, 360px)",
      maxHeight: "280px",
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
    },

    ".imagePlaceholder": {
      width: "200px",
      height: "120px",
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.dark_grey,
    },

    ".fileCard": {
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      maxWidth: "100%",
      padding: "8px 10px",
      borderRadius: theme.radius.md,
      border: `1px solid ${theme.colors.border}`,
      backgroundColor: theme.colors.dark_grey,
      color: theme.colors.white,
      font: "inherit",
      textAlign: "left",
      cursor: "pointer",

      "&:hover": { borderColor: theme.colors.accent },
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
  });

// the file's bytes, fetched once and kept for the session
const useAttachmentBlob = (attachmentId: string, enabled: boolean) =>
  useQuery({
    queryKey: ["attachment", attachmentId],
    queryFn: () => fetchAttachment(attachmentId),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

// an object URL for the blob, revoked when it changes or on unmount
const useObjectUrl = (blob: Blob | undefined) => {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(undefined);
    };
  }, [blob]);
  return url;
};

interface MessageAttachmentProps {
  attachment: Attachment;
  // just the file card, no image preview
  compact?: boolean;
}

// A file sent as a message: images are shown, other files can be downloaded
export const MessageAttachment = ({
  attachment,
  compact = false,
}: MessageAttachmentProps) => {
  const theme = useTheme();
  const showImage = !compact && INLINE_TYPES.includes(attachment.mimeType);
  const [downloadRequested, setDownloadRequested] = useState(false);
  const { data: blob, isError } = useAttachmentBlob(
    attachment.id,
    showImage || downloadRequested,
  );
  const imageUrl = useObjectUrl(showImage ? blob : undefined);

  // a download clicked before the file arrived saves it once it does
  useEffect(() => {
    if (!downloadRequested || !blob) return;
    saveBlob(blob, attachment.fileName);
    setDownloadRequested(false);
  }, [downloadRequested, blob, attachment.fileName]);

  const download = () => {
    if (blob) saveBlob(blob, attachment.fileName);
    else setDownloadRequested(true);
  };

  if (showImage && !isError) {
    return (
      <div css={styles(theme)}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={attachment.fileName}
            title={attachment.fileName}
          />
        ) : (
          <div
            className="imagePlaceholder"
            role="img"
            aria-label={`Loading ${attachment.fileName}`}
          />
        )}
      </div>
    );
  }

  return (
    <div css={styles(theme)}>
      <button
        type="button"
        className="fileCard"
        onClick={download}
        aria-label={`Download ${attachment.fileName}`}
      >
        <FileText size="1.5rem" aria-hidden />
        <span className="fileText">
          <span className="fileName">{attachment.fileName}</span>
          {isError ? (
            <span className="fileError">Couldn't get the file</span>
          ) : (
            <span className="fileMeta">
              {downloadRequested
                ? "Downloading…"
                : formatFileSize(attachment.size)}
            </span>
          )}
        </span>
        <Download size="1rem" aria-hidden />
      </button>
    </div>
  );
};
