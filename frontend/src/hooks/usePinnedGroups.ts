import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./useStores";
import { customQuery } from "../utils/customQuery";
import { customMutation, type MutationArgs } from "../utils/customMutation";
import type { PinnedGroup } from "../types/REST-types/Chatroom";
import { API_URL } from "../env";

const pinnedGroupsKey = (userId: string) => ["pinnedChatrooms", userId];

export const usePinnedGroups = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery<PinnedGroup[]>({
    queryKey: pinnedGroupsKey(user.userId),
    queryFn: () =>
      customQuery<PinnedGroup[]>({
        fetchUrl: `${API_URL}/api/pinned/me`,
      }),
    enabled: !!user.token,
    staleTime: 0,
  });
};

// Pinned group changes are applied to the cached groups straight away and
// the groups are refetched once the request settles, which also rolls back
// a change the server rejected.
export const usePinnedGroupActions = () => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user.userId);
  const queryKey = pinnedGroupsKey(userId);

  const updateGroups = (update: (groups: PinnedGroup[]) => PinnedGroup[]) =>
    queryClient.setQueryData<PinnedGroup[]>(queryKey, (groups) =>
      groups ? update(groups) : groups,
    );

  const mutation = useMutation<unknown, Error, MutationArgs>({
    mutationFn: customMutation,
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const createMutation = useMutation<PinnedGroup, Error, string>({
    mutationFn: (name) =>
      customMutation<PinnedGroup>({
        fetchUrl: `${API_URL}/api/pinned`,
        method: "POST",
        reqBody: { name },
      }),
    onSuccess: (group) => updateGroups((groups) => [...groups, group]),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const setPinned = (
    pinGroupId: string,
    chatroom: { chatroomId: string; title: string },
    pin: boolean,
  ) => {
    updateGroups((groups) =>
      groups.map((group) => {
        if (group.id !== pinGroupId) return group;

        const others = group.chatrooms.filter(
          (c) => c.chatroomId !== chatroom.chatroomId,
        );
        if (!pin) return { ...group, chatrooms: others };

        return {
          ...group,
          chatrooms: [
            ...others,
            {
              chatroomId: chatroom.chatroomId,
              chatroom: { title: chatroom.title },
              pinnedIndex: group.chatrooms.length,
            },
          ],
        };
      }),
    );
    mutation.mutate({
      fetchUrl: `${API_URL}/api/pinned/${chatroom.chatroomId}/pin`,
      method: "PATCH",
      reqBody: { pin, pinGroupId },
    });
  };

  const renameGroup = (pinGroupId: string, name: string) => {
    updateGroups((groups) =>
      groups.map((group) =>
        group.id === pinGroupId ? { ...group, name } : group,
      ),
    );
    mutation.mutate({
      fetchUrl: `${API_URL}/api/pinned/${pinGroupId}`,
      method: "PATCH",
      reqBody: { name },
    });
  };

  const deleteGroup = (pinGroupId: string) => {
    updateGroups((groups) => groups.filter((group) => group.id !== pinGroupId));
    mutation.mutate({
      fetchUrl: `${API_URL}/api/pinned/${pinGroupId}`,
      method: "DELETE",
    });
  };

  return {
    setPinned,
    renameGroup,
    deleteGroup,
    createGroup: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    error: mutation.error ?? createMutation.error,
  };
};
