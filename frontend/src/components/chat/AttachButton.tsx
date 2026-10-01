import { css, useTheme, type Theme } from "@emotion/react";
import { Loader2, Paperclip } from "lucide-react";
import { useRef, useState } from "react";
import {
  ACCEPT,
  attachmentProblem,
  uploadAttachment,
} from "../../utils/attachments";
import { iconBtnStyles } from "../../styles/iconButton";

const styles = (theme: Theme) =>
  css({
    position: "relative",
    flex: "0 0 auto",
    display: "flex",

    ".attachBtn": {
      width: "2.25rem",
      height: "2.25rem",

      "&:disabled": { cursor: "progress" },
    },

    ".spin": {
      animation: "attach-spin 1s linear infinite",
    },

    "@keyframes attach-spin": {
      to: { transform: "rotate(360deg)" },
    },

    ".attachError": {
      position: "absolute",
      bottom: "calc(100% + 6px)",
      left: 0,
      width: "max-content",
      maxWidth: "240px",
      padding: "4px 8px",
      fontSize: "0.75rem",
      borderRadius: theme.radius.sm,
      color: theme.colors.white,
      backgroundColor: theme.colors.dangerSoft,
      border: `1px solid ${theme.colors.danger}`,
    },
  });

// Picks a file and sends it to the chatroom as its own message
export const AttachButton = ({ chatroomId }: { chatroomId: string }) => {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (file: File) => {
    const problem = attachmentProblem(file);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      await uploadAttachment(chatroomId, file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div css={styles(theme)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        data-testid="attach-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // cleared so picking the same file again still sends it
          event.target.value = "";
          if (file) send(file);
        }}
      />
      <button
        type="button"
        className="attachBtn"
        css={iconBtnStyles(theme)}
        aria-label={uploading ? "Sending file" : "Attach a file"}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 size="1.15rem" className="spin" />
        ) : (
          <Paperclip size="1.15rem" />
        )}
      </button>
      {error && (
        <span
          className="attachError"
          role="alert"
          onClick={() => setError(null)}
        >
          {error}
        </span>
      )}
    </div>
  );
};
