import { css, useTheme } from "@emotion/react";
import useAuthContext from "../../hooks/useAuthContext";
import type { Theme } from "@emotion/react";
import { useMutation } from "@tanstack/react-query";
import {
  mutationFunction,
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

    ".status": {
      borderRadius: "50%",
      aspectRatio: 1,
      width: "1.2rem",
      appearance: "none",
      backgroundColor: STATUS_COLORS[status],
    },
  });

const colors = (theme: Theme) =>
  css({
    color: theme.colors.white,

    ".status": {
      option: {
        backgroundColor: "red",
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
    mutationFn: mutationFunction<StatusUpdate>,
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
        value={status}
      >
        <option className="statusOption" value={"ONLINE"}>
          ONLINE
        </option>
        <option className="statusOption" value={"AWAY"}>
          AWAY
        </option>
        <option className="statusOption" value={"OFFLINE"}>
          OFFLINE
        </option>
      </select>
      <p>{user.username}</p>
    </div>
  );
};

export default ProfileStatus;
