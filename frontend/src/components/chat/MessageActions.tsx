import { css, useTheme, type Theme } from "@emotion/react";
import { Pencil, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { deleteMessage, editMessage } from "../../utils/messageChanges";
import { MAX_MESSAGE_LENGTH } from "../../utils/messageLimits";
import { ConfirmModal } from "../ConfirmModal";

const toolbarStyles = (theme: Theme) =>
  css({
    position: "absolute",
    top: "-12px",
    right: "16px",
    display: "flex",
    gap: "2px",
    padding: "2px",
    borderRadius: theme.radius.sm,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.dark_grey,
    boxShadow: theme.shadow.card,
    transition: "opacity 0.1s ease",
    zIndex: 1,

    "&.compact": { top: "-8px", right: "8px" },

    button: {
      width: "1.75rem",
      height: "1.75rem",
      display: "grid",
      placeItems: "center",
      padding: 0,
      border: 0,
      borderRadius: "4px",
      color: theme.colors.light_grey,
      backgroundColor: "transparent",
      cursor: "pointer",

      "&:hover": {
        color: theme.colors.white,
        backgroundColor: theme.colors.grey,
      },
      "&.danger:hover": {
        color: theme.colors.danger,
        backgroundColor: theme.colors.dangerSoft,
      },
      "&:focus-visible": { outline: `2px solid ${theme.colors.accent}` },
    },
  });

interface MessageToolbarProps {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}

// Edit and delete buttons for a message
export const MessageToolbar = ({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  compact = false,
}: MessageToolbarProps) => {
  const theme = useTheme();
  if (!canEdit && !canDelete) return null;

  return (
    <div
      className={compact ? "messageToolbar compact" : "messageToolbar"}
      css={toolbarStyles(theme)}
    >
      {canEdit && (
        <button type="button" onClick={onEdit} aria-label="Edit message">
          <Pencil size="0.9rem" />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          className="danger"
          onClick={onDelete}
          aria-label="Delete message"
        >
          <Trash2 size="0.9rem" />
        </button>
      )}
    </div>
  );
};

const editStyles = (theme: Theme) =>
  css({
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginTop: "2px",

    textarea: {
      width: "100%",
      resize: "none",
      padding: "6px 10px",
      font: "inherit",
      fontSize: "0.95rem",
      lineHeight: 1.5,
      color: theme.colors.white,
      backgroundColor: theme.colors.dark_grey,
      border: `1px solid ${theme.colors.accent}`,
      borderRadius: theme.radius.md,
      outline: "none",
    },

    "&.compact textarea": { fontSize: "0.85rem", padding: "4px 8px" },

    ".editHint": {
      fontSize: "0.72rem",
      color: theme.colors.light_grey,
    },

    ".editHint button": {
      padding: 0,
      border: 0,
      background: "none",
      font: "inherit",
      color: theme.colors.accent,
      cursor: "pointer",
      "&:hover": { textDecoration: "underline" },
    },

    ".editError": {
      fontSize: "0.72rem",
      color: theme.colors.danger,
    },
  });

interface MessageEditFormProps {
  messageId: string;
  content: string;
  onDone: () => void;
  compact?: boolean;
}

// Edits a message's text in place: Enter saves, Escape cancels
export const MessageEditForm = ({
  messageId,
  content,
  onDone,
  compact = false,
}: MessageEditFormProps) => {
  const theme = useTheme();
  const [draft, setDraft] = useState(content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // start with the cursor after the text, sized to fit it
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }, [draft]);

  const save = async () => {
    const text = draft.trim();
    // nothing changed, so there's nothing to save
    if (text === content) {
      onDone();
      return;
    }
    if (!text) {
      setError("A message can't be empty; delete it instead");
      return;
    }
    setSaving(true);
    try {
      await editMessage(messageId, text);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the edit");
      setSaving(false);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      // don't also close whatever the message is in
      event.stopPropagation();
      onDone();
    } else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!saving) save();
    }
  };

  return (
    <div className={compact ? "compact" : undefined} css={editStyles(theme)}>
      <textarea
        ref={inputRef}
        rows={1}
        value={draft}
        maxLength={MAX_MESSAGE_LENGTH}
        aria-label="Edit message"
        disabled={saving}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        onKeyDown={onKeyDown}
      />
      {error && (
        <span className="editError" role="alert">
          {error}
        </span>
      )}
      <span className="editHint">
        Escape to{" "}
        <button type="button" onClick={onDone}>
          cancel
        </button>{" "}
        · Enter to{" "}
        <button type="button" onClick={save} disabled={saving}>
          save
        </button>
      </span>
    </div>
  );
};

interface DeleteMessageModalProps {
  messageId: string;
  // what the message says, or its file's name, to show what's being deleted
  preview: string;
  onClose: () => void;
}

// Asks before deleting a message, since it can't be brought back
export const DeleteMessageModal = ({
  messageId,
  preview,
  onClose,
}: DeleteMessageModalProps) => {
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    try {
      await deleteMessage(messageId);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't delete the message",
      );
    }
  };

  return (
    <ConfirmModal
      open
      title="Delete message?"
      confirmLabel="Delete"
      danger
      onConfirm={confirm}
      onCancel={onClose}
    >
      {error ?? (
        <>
          <strong>{preview}</strong> will be deleted for everyone. This can't
          be undone.
        </>
      )}
    </ConfirmModal>
  );
};
