import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type {
  ChatroomDetails,
  ChatroomPrivacy,
} from "../../types/REST-types/Chatroom";
import type { UserAuth } from "../../types/REST-types/User";
import Modal, { ModalCloseButton, type ModalProps } from "../Modal";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import Button from "../Button";
import type { ConfirmationResponse } from "../../types/REST-types/Invite";
import { customMutation, type MutationArgs } from "../../utils/customMutation";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  Check,
  Copy,
  FolderInput,
  Pin,
  RefreshCw,
  SquarePen,
} from "lucide-react";
import {
  isLoggedInSelector,
  useAuthStore,
  useChatroomsStore,
} from "../../hooks/useStores";
import useToggle from "../../hooks/useToggle";
import { customQuery } from "../../utils/customQuery";
import { API_URL } from "../../env";
import { mq } from "../../styles/breakpoints";
import { Loader } from "../Loader";
import {
  fieldStyles,
  selectStyles,
  formModalStyles,
} from "../../styles/modalForm";
import { ConfirmModal } from "../ConfirmModal";
import { PinToGroupsModal } from "../chat-home/PinToGroupsModal";
import { usePinnedGroups } from "../../hooks/usePinnedGroups";
import { usePreferencesStore } from "../../hooks/usePreferencesStore";
import { useFolders } from "../../hooks/useFolders";
import { MoveToFolderModal } from "./folders/MoveToFolderModal";
import { privacyHint, privacyOptions } from "../../utils/chatroomPrivacy";

const chatroomDetailsModalStyles = (theme: Theme) =>
  css(
    formModalStyles(theme, "480px"),
    mq({
      ".statusMessage": {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "40px 24px",
        color: theme.colors.light_grey,
      },

      "#editChatroom": {
        display: "flex",
        flexDirection: "column",
      },

      ".titleRow": {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minHeight: "2.25rem",

        h2: {
          fontSize: "1.35rem",
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },

        input: {
          flex: 1,
          minWidth: 0,
          fontSize: "1.1rem",
          fontWeight: 500,
        },
      },

      ".editTitleBtn": {
        flex: "0 0 auto",
        width: "2rem",
        height: "2rem",
        padding: "7px",
      },

      ".meta": {
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 16px",
        marginTop: "8px",
        fontSize: "0.85rem",
        color: theme.colors.light_grey,

        strong: {
          fontWeight: 500,
          color: theme.colors.white,
        },
      },

      ".joinLinkRow": {
        display: "flex",
        gap: "6px",
        alignItems: "center",

        input: {
          flex: 1,
          minWidth: 0,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: "0.8rem",
        },
      },

      ".joinLinkBtn": {
        flex: "0 0 auto",
        width: "2.25rem",
        height: "2.25rem",
        padding: "9px",
        border: `1px solid ${theme.colors.borderStrong}`,
      },

      ".pinnedRow": {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",

        ".hint": {
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      },

      ".smallBtn": {
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 10px",
        fontSize: "0.8rem",
      },

      ".copied": {
        color: theme.colors.success,
      },
    }),
  );

interface ChatroomDetailsProps extends ModalProps {
  user: UserAuth;
  chatroomId: string;
  onClose: () => void;
}

interface ChatroomFormInput {
  title: string;
  privacy: ChatroomPrivacy;
}

export const ChatroomDetailsModal = ({
  open,
  onClose,
  chatroomId,
}: ChatroomDetailsProps) => {
  const theme = useTheme();
  const [enableTitleEdit, setEnableTitleEdit] = useToggle(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useToggle(false);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore(isLoggedInSelector);

  const {
    data: chatroomData,
    refetch,
    isLoading,
    isError,
  } = useQuery<ChatroomDetails>({
    queryKey: ["active-chatroom", chatroomId],
    queryFn: () =>
      customQuery({
        fetchUrl: `${API_URL}/api/chatrooms/${chatroomId}`,
      }),
    enabled: !!chatroomId && open,
    staleTime: 0,
  });

  const { register, handleSubmit, setFocus, watch } =
    useForm<ChatroomFormInput>({
      // values (not defaultValues) so the form picks up the chatroom once the
      // query resolves, instead of keeping the empty values from first render
      values: chatroomData && {
        title: chatroomData.title,
        privacy: chatroomData.privacy,
      },
    });

  const chatroomMutation = useMutation<
    ConfirmationResponse,
    Error,
    MutationArgs
  >({
    mutationFn: customMutation<ConfirmationResponse>,
  });

  const handleLeave = () => {
    chatroomMutation.mutate({
      fetchUrl: `${API_URL}/api/members/${chatroomId}`,
      method: "DELETE",
      reqBody: {
        memberId: user.userId,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (chatroomData?.ownerId !== user.userId) return;
    chatroomMutation.mutate({
      fetchUrl: `${API_URL}/api/chatrooms/${chatroomId}`,
      method: "DELETE",
    });
    onClose();
  };

  const [linkCopied, setLinkCopied] = useState(false);
  const linkCopiedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(linkCopiedTimeout.current), []);

  const regenerateMutation = useMutation<
    { joinKey: string },
    Error,
    MutationArgs
  >({
    mutationFn: customMutation<{ joinKey: string }>,
    onSuccess: () => refetch(),
  });

  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);

  const handleRegenerateKey = () => {
    setConfirmRegenerateOpen(false);
    regenerateMutation.mutate({
      fetchUrl: `${API_URL}/api/chatrooms/${chatroomId}/join-key`,
      method: "POST",
    });
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      clearTimeout(linkCopiedTimeout.current);
      linkCopiedTimeout.current = setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      // clipboard unavailable; the link is still selectable in the input
    }
  };

  const handleUpdate: SubmitHandler<ChatroomFormInput> = (data) => {
    if (!isLoggedIn || !isOwner) return;

    const { title, privacy } = data;

    chatroomMutation.mutate(
      {
        fetchUrl: `${API_URL}/api/chatrooms/${chatroomId}`,
        method: "PATCH",
        reqBody: {
          title,
          privacy,
        },
      },
      { onSuccess: () => refetch() },
    );
  };

  const isOwner = chatroomData?.ownerId === user.userId;

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const { data: pinnedGroups } = usePinnedGroups();
  const pinnedIn =
    pinnedGroups?.filter((group) =>
      group.chatrooms.some((c) => c.chatroomId === chatroomId),
    ) ?? [];

  // with folders synced to the home page, the chatroom's folder is its group
  const syncedWithHome = usePreferencesStore(
    (state) => state.syncFoldersWithHome,
  );
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const { data: folders } = useFolders();
  const folderId = useChatroomsStore(
    (state) =>
      state.chatrooms.find((c) => c.chatroomId === chatroomId)?.folderId,
  );
  const currentFolder = folders?.find((f) => f.id === folderId);

  const joinLink = chatroomData?.joinKey
    ? `${window.location.origin}/join/${chatroomData.joinKey}`
    : "";
  const selectedPrivacy = watch("privacy") ?? chatroomData?.privacy;

  const closeButton = (
    <ModalCloseButton onClose={onClose} label="Close chatroom details" />
  );

  if (isLoading || isError) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        modalStyles={chatroomDetailsModalStyles(theme)}
      >
        <div className="statusMessage">
          {isLoading ? (
            <>
              <Loader /> <p>Loading chatroom details...</p>
            </>
          ) : (
            <p>Failed to load chatroom details</p>
          )}
        </div>
        {closeButton}
      </Modal>
    );
  }

  return (
    <>
      {chatroomData && (
        <Modal
          open={open}
          onClose={onClose}
          modalStyles={chatroomDetailsModalStyles(theme)}
        >
          <form id="editChatroom" onSubmit={handleSubmit(handleUpdate)}>
            <div className="header">
              <p className="eyebrow">Chatroom details</p>
              <div className="titleRow">
                {enableTitleEdit ? (
                  <input
                    {...register("title")}
                    css={fieldStyles(theme)}
                    type="text"
                    placeholder={chatroomData.title}
                    maxLength={20}
                    aria-label="Chatroom name"
                  ></input>
                ) : (
                  <h2>{chatroomData.title}</h2>
                )}
                {isOwner && (
                  <Button
                    variant="icon"
                    type="button"
                    className="editTitleBtn"
                    aria-label="Edit chatroom name"
                    onClick={() => {
                      setEnableTitleEdit();
                      setFocus("title");
                    }}
                  >
                    <SquarePen size="1.1rem" />
                  </Button>
                )}
              </div>
              <div className="meta">
                <span>
                  Owner <strong>{chatroomData.owner?.username}</strong>
                </span>
                <span>
                  Created{" "}
                  <strong>
                    {new Date(chatroomData.createdAt).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short", day: "numeric" },
                    )}
                  </strong>
                </span>
              </div>
            </div>

            {(isOwner || !user.isGuest) && (
              <div className="body">
                {!user.isGuest && syncedWithHome && (
                  <div className="field">
                    <p className="sectionLabel">Folder</p>
                    <div className="pinnedRow">
                      <span className="hint">
                        {currentFolder
                          ? `${currentFolder.name} (also shown on your home page)`
                          : "Not in a folder"}
                      </span>
                      <button
                        type="button"
                        className="btn btnSecondary smallBtn"
                        onClick={() => setFolderModalOpen(true)}
                      >
                        <FolderInput size="0.9rem" />
                        Move to folder
                      </button>
                    </div>
                  </div>
                )}
                {!user.isGuest && !syncedWithHome && (
                  <div className="field">
                    <p className="sectionLabel">Pinned in</p>
                    <div className="pinnedRow">
                      <span className="hint">
                        {pinnedIn.length > 0
                          ? pinnedIn.map((group) => group.name).join(", ")
                          : "Not pinned to any group"}
                      </span>
                      <button
                        type="button"
                        className="btn btnSecondary smallBtn"
                        onClick={() => setPinModalOpen(true)}
                      >
                        <Pin size="0.9rem" />
                        Pin to group
                      </button>
                    </div>
                  </div>
                )}
                {isOwner && (
                  <>
                    <div className="field">
                      <label htmlFor="privacy">Who can join</label>
                      <select
                        {...register("privacy")}
                        id="privacy"
                        css={selectStyles(theme)}
                      >
                        {privacyOptions.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {selectedPrivacy && (
                        <p className="hint">{privacyHint(selectedPrivacy)}</p>
                      )}
                    </div>
                    {chatroomData.joinKey &&
                      (chatroomData.privacy === "JOINABLE" ||
                        chatroomData.privacy === "PUBLIC") && (
                        <div className="field">
                          <label htmlFor="joinLink">Join link</label>
                          <div className="joinLinkRow">
                            <input
                              id="joinLink"
                              css={fieldStyles(theme)}
                              readOnly
                              value={joinLink}
                              onFocus={(e) => e.currentTarget.select()}
                            />
                            <Button
                              variant="icon"
                              type="button"
                              className={
                                linkCopied
                                  ? "joinLinkBtn copied"
                                  : "joinLinkBtn"
                              }
                              aria-label="Copy join link"
                              title="Copy link"
                              onClick={() => handleCopyLink(joinLink)}
                            >
                              {linkCopied ? <Check /> : <Copy />}
                            </Button>
                            <Button
                              variant="icon"
                              type="button"
                              className="joinLinkBtn"
                              aria-label="Regenerate join link"
                              title="Regenerate link"
                              onClick={() => setConfirmRegenerateOpen(true)}
                            >
                              <RefreshCw />
                            </Button>
                          </div>
                          {regenerateMutation.error ? (
                            <p className="errorText">
                              Couldn't regenerate link:{" "}
                              {regenerateMutation.error.message}
                            </p>
                          ) : (
                            <p className="hint">
                              Regenerating the link stops the old one from
                              working.
                            </p>
                          )}
                        </div>
                      )}
                  </>
                )}
              </div>
            )}

            <div className="footer">
              {!isOwner ? (
                <button
                  type="button"
                  className="btn btnDanger footerEnd"
                  onClick={handleLeave}
                >
                  Leave chatroom
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btnDanger"
                    onClick={() => setConfirmDeleteModalOpen(true)}
                  >
                    Delete chatroom
                  </button>
                  <button type="submit" className="btn btnPrimary">
                    Save changes
                  </button>
                </>
              )}
            </div>
          </form>
          {closeButton}
          {isOwner && confirmDeleteModalOpen && (
            <ConfirmModal
              open={confirmDeleteModalOpen}
              title="Delete chatroom?"
              confirmLabel="Delete chatroom"
              danger
              onConfirm={handleDelete}
              onCancel={() => setConfirmDeleteModalOpen(false)}
            >
              <strong>{chatroomData.title}</strong> and all of its messages will
              be permanently deleted for every member. This can't be undone.
            </ConfirmModal>
          )}
          {folderModalOpen && (
            <MoveToFolderModal
              open={folderModalOpen}
              onClose={() => setFolderModalOpen(false)}
              chatroom={{ chatroomId, title: chatroomData.title }}
            />
          )}
          {pinModalOpen && (
            <PinToGroupsModal
              open={pinModalOpen}
              onClose={() => setPinModalOpen(false)}
              chatroom={{ chatroomId, title: chatroomData.title }}
            />
          )}
          {isOwner && confirmRegenerateOpen && (
            <ConfirmModal
              open={confirmRegenerateOpen}
              title="Regenerate join link?"
              confirmLabel="Regenerate link"
              onConfirm={handleRegenerateKey}
              onCancel={() => setConfirmRegenerateOpen(false)}
            >
              The current link will stop working. Anyone who hasn't joined yet
              will need the new link.
            </ConfirmModal>
          )}
        </Modal>
      )}
    </>
  );
};
