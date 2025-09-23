import { css, useTheme } from "@emotion/react";
import useAuthContext from "../../hooks/useAuthContext";
import type { Theme } from "@emotion/react";
import { useMutation } from "@tanstack/react-query";
import {
  verifiedMutation,
  type MutationArgs,
} from "../../hooks/useCustomMutation";
import type { StatusUpdate } from "../../types/REST-types/User";
import { useRef } from "react";

export type Status = "ONLINE" | "AWAY" | "OFFLINE";

const STATUS_COLORS = {
  ["ONLINE"]: "green",
  ["AWAY"]: "orange",
  ["OFFLINE"]: "grey",
};

const styles = (status: Status) =>
  css({
    display: "flex",
    alignItems: "center",
    gap: "8px",

    ".status": {
      borderRadius: "50%",
      aspectRatio: 1,
      width: "1.2rem",
      appearance: "none",
      backgroundColor: STATUS_COLORS[status],

      option: {
        fontSize: "1rem",
        padding: "4px",
      },
    },
  });

const colors = (theme: Theme) =>
  css({
    color: theme.colors.white,

    ".status": {
      fontSize: 0,

      option: {
        backgroundColor: theme.colors.dark_grey,
        color: theme.colors.white,
      },

      "option:hover": {
        backgroundColor: theme.colors.grey,
      },
    },
  });

interface ProfileStatusProps {
  status: Status;
}

const ProfileStatus = ({ status }: ProfileStatusProps) => {
  const theme = useTheme();
  const { user } = useAuthContext();
  const statusRef = useRef<HTMLSelectElement>(null);
  const mutation = useMutation<StatusUpdate, Error, MutationArgs>({
    mutationFn: verifiedMutation<StatusUpdate>,
  });

  const handleSubmit = () => {
    const newStatus = statusRef.current?.value;

    mutation.mutate({
      fetchUrl: "http://localhost:3000/api/users/me",
      method: "PATCH",
      user,
      reqBody: { status: newStatus },
    });
  };

  return (
    <div css={[styles(status), colors(theme)]}>
      <select
        ref={statusRef}
        className="status"
        onChange={handleSubmit}
        defaultValue={status}
      >
        <option
          className="statusOption"
          onMouseOver={() => {}}
          value={"ONLINE"}
        >
          Online
        </option>
        <option className="statusOption" value={"AWAY"}>
          Away
        </option>
        <option className="statusOption" value={"OFFLINE"}>
          Offline
        </option>
      </select>
      <p>{user.username}</p>
    </div>
  );
};

export default ProfileStatus;
