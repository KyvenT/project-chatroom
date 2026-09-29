import { useFolderActions, useFolders } from "./useFolders";
import { usePinnedGroupActions, usePinnedGroups } from "./usePinnedGroups";
import { usePreferencesStore } from "./usePreferencesStore";
import { useAuthStore, useChatroomsStore } from "./useStores";
import type { PinnedGroup } from "../types/REST-types/Chatroom";

type ChatroomRef = { chatroomId: string; title: string };

// The groups shown on the home page: pinned groups normally, or the sidebar
// folders when they're synced with the home page. Both come with the same
// actions so the home page doesn't need to know which it's showing.
export const useHomeGroups = () => {
  const isGuest = useAuthStore((state) => state.user.isGuest);
  // guests can't have folders
  const synced =
    usePreferencesStore((state) => state.syncFoldersWithHome) && !isGuest;
  const chatrooms = useChatroomsStore((state) => state.chatrooms);

  const pinnedQuery = usePinnedGroups();
  const pinnedActions = usePinnedGroupActions();
  const foldersQuery = useFolders();
  const folderActions = useFolderActions();

  if (!synced) {
    return {
      synced,
      groups: pinnedQuery.data,
      isLoading: pinnedQuery.isLoading,
      isError: pinnedQuery.isError,
      error: pinnedQuery.error,
      actionError: pinnedActions.error,
      setPinned: pinnedActions.setPinned,
      renameGroup: pinnedActions.renameGroup,
      deleteGroup: pinnedActions.deleteGroup,
    };
  }

  // folders shaped like pinned groups, holding their chatrooms in sidebar order
  const groups: PinnedGroup[] | undefined = foldersQuery.data?.map(
    (folder) => ({
      id: folder.id,
      userId: "",
      name: folder.name,
      createdAt: new Date(0),
      chatrooms: chatrooms
        .filter((c) => c.folderId === folder.id)
        .map((c) => ({
          chatroomId: c.chatroomId,
          chatroom: { title: c.chatroom.title },
          pinnedIndex: c.chatroomIndex,
        })),
    }),
  );

  return {
    synced,
    groups,
    isLoading: foldersQuery.isLoading,
    isError: foldersQuery.isError,
    error: foldersQuery.error,
    actionError: folderActions.error,
    // a chatroom is in one folder, so adding moves it and removing sends it
    // back to Chats
    setPinned: (folderId: string, chatroom: ChatroomRef, pin: boolean) =>
      folderActions.moveChatroom(chatroom.chatroomId, pin ? folderId : null),
    renameGroup: folderActions.renameFolder,
    deleteGroup: folderActions.deleteFolder,
  };
};
