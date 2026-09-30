import { css, useTheme } from "@emotion/react";
import { useAuthStore, useMembersStore } from "../../hooks/useStores";
import type { Theme } from "@emotion/react";
import { useMutation } from "@tanstack/react-query";
import { customMutation, type MutationArgs } from "../../utils/customMutation";
import type { StatusUpdate } from "../../types/REST-types/User";
import { API_URL } from "../../env";
import { selectStyles } from "../../styles/modalForm";
import { statusColor, STATUS_LABELS } from "../../utils/status";
import { Avatar } from "../Avatar";

export type Status = "ONLINE" | "AWAY" | "OFFLINE";

const STATUSES: Status[] = ["ONLINE", "AWAY", "OFFLINE"];

const styles = (theme: Theme, status: Status) =>
  css({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    color: theme.colors.white,

    ".who": {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "2px",
    },

    ".username": {
      maxWidth: "100%",
      fontSize: "0.9rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },

    ".statusPicker": {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
    },

    // the dot sits over the select, left of its text
    ".pickerDot": {
      position: "absolute",
      left: "8px",
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      backgroundColor: statusColor(theme, status),
      pointerEvents: "none",
    },

    ".status": {
      fontSize: "0.75rem",
      padding: "2px 24px 2px 21px",
      borderRadius: "999px",
      backgroundPosition: "right 6px center",
      backgroundSize: "14px",
      color: theme.colors.light_grey,
      "&:hover, &:focus-visible": { color: theme.colors.white },
    },
  });

interface ProfileStatusProps {
  status: Status;
}

const ProfileStatus = ({ status }: ProfileStatusProps) => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const mutation = useMutation<StatusUpdate, Error, MutationArgs>({
    mutationFn: customMutation<StatusUpdate>,
  });
  const member = useMembersStore((state) =>
    state.members.find((m) => m.memberId === user.userId),
  );
  const updateMember = useMembersStore((state) => state.updateMember);

  const handleSubmit = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!member) return;

    mutation.mutate({
      fetchUrl: `${API_URL}/api/users/me`,
      method: "PATCH",
      reqBody: { status: event.target.value },
    });
    updateMember({
      memberId: member?.memberId,
      role: member?.role,
      member: {
        ...member.member,
        status: event.target.value as Status,
      },
    });
  };

  return (
    <div css={styles(theme, status)}>
      <Avatar
        userId={user.userId || null}
        username={user.username}
        avatarUpdatedAt={member?.member.avatarUpdatedAt}
        size={34}
        status={status}
      />
      <div className="who">
        <p className="username">{user.username}</p>
        <span className="statusPicker">
          <span className="pickerDot" aria-hidden />
          <select
            className="status"
            css={selectStyles(theme)}
            onChange={handleSubmit}
            value={status}
            aria-label="Your status"
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </span>
      </div>
    </div>
  );
};

export default ProfileStatus;
