import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore, useChatroomsStore } from "./useStores";
import { customQuery } from "../utils/customQuery";
import { customMutation, type MutationArgs } from "../utils/customMutation";
import type { SidebarFolder } from "../types/REST-types/Chatroom";
import { API_URL } from "../env";

const foldersKey = (userId: string) => ["sidebarFolders", userId];

export const useFolders = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery<SidebarFolder[]>({
    queryKey: foldersKey(user.userId),
    queryFn: () =>
      customQuery<SidebarFolder[]>({ fetchUrl: `${API_URL}/api/folders` }),
    enabled: !!user.token && !user.isGuest,
    staleTime: Infinity,
  });
};

// Folder changes show straight away; folders are refetched once a request
// settles, and a failed chatroom move is put back where it was.
export const useFolderActions = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user.userId);
  const setChatroomFolder = useChatroomsStore(
    (state) => state.setChatroomFolder,
  );
  const clearFolder = useChatroomsStore((state) => state.clearFolder);
  const reorderChatrooms = useChatroomsStore((state) => state.reorderChatrooms);
  const queryKey = foldersKey(userId);

  const updateFolders = (
    update: (folders: SidebarFolder[]) => SidebarFolder[],
  ) =>
    queryClient.setQueryData<SidebarFolder[]>(queryKey, (folders) =>
      folders ? update(folders) : folders,
    );

  const mutation = useMutation<unknown, Error, MutationArgs>({
    mutationFn: customMutation,
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const createMutation = useMutation<SidebarFolder, Error, string>({
    mutationFn: (name) =>
      customMutation<SidebarFolder>({
        fetchUrl: `${API_URL}/api/folders`,
        method: "POST",
        reqBody: { name },
      }),
    onSuccess: (folder) => updateFolders((folders) => [...folders, folder]),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const moveMutation = useMutation<
    unknown,
    Error,
    { chatroomId: string; folderId: string | null; previous: string | null }
  >({
    mutationFn: ({ chatroomId, folderId }) =>
      customMutation({
        fetchUrl: `${API_URL}/api/folders/chatrooms/${chatroomId}`,
        method: "PATCH",
        reqBody: { folderId },
      }),
    onError: (_err, { chatroomId, previous }) =>
      setChatroomFolder(chatroomId, previous),
  });

  const moveChatroom = (chatroomId: string, folderId: string | null) => {
    const chatroom = useChatroomsStore
      .getState()
      .chatrooms.find((c) => c.chatroomId === chatroomId);
    if (!chatroom || chatroom.folderId === folderId) return;

    const previous = chatroom.folderId ?? null;
    setChatroomFolder(chatroomId, folderId);
    moveMutation.mutate({ chatroomId, folderId, previous });
  };

  // a failed reorder is undone by reloading the chatroom list's order
  const orderMutation = useMutation<
    unknown,
    Error,
    { folderId: string; chatroomIds: string[] }
  >({
    mutationFn: ({ folderId, chatroomIds }) =>
      customMutation({
        fetchUrl: `${API_URL}/api/folders/${folderId}/order`,
        method: "PATCH",
        reqBody: { chatroomIds },
      }),
    onError: () =>
      queryClient.invalidateQueries({ queryKey: ["chatrooms", userId] }),
  });

  const reorderFolder = (folderId: string, chatroomIds: string[]) => {
    reorderChatrooms(chatroomIds);
    orderMutation.mutate({ folderId, chatroomIds });
  };

  const renameFolder = (folderId: string, name: string) => {
    updateFolders((folders) =>
      folders.map((folder) =>
        folder.id === folderId ? { ...folder, name } : folder,
      ),
    );
    mutation.mutate({
      fetchUrl: `${API_URL}/api/folders/${folderId}`,
      method: "PATCH",
      reqBody: { name },
    });
  };

  const deleteFolder = (folderId: string) => {
    updateFolders((folders) => folders.filter((f) => f.id !== folderId));
    clearFolder(folderId);
    mutation.mutate({
      fetchUrl: `${API_URL}/api/folders/${folderId}`,
      method: "DELETE",
    });
  };

  return {
    createFolder: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    renameFolder,
    deleteFolder,
    moveChatroom,
    reorderFolder,
    error:
      mutation.error ??
      moveMutation.error ??
      orderMutation.error ??
      createMutation.error,
  };
};
