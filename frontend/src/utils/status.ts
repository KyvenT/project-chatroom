import type { Theme } from "@emotion/react";
import type { Status } from "../components/chat/ProfileStatus";

export const STATUS_LABELS: Record<Status, string> = {
  ONLINE: "Online",
  AWAY: "Away",
  OFFLINE: "Offline",
};

export const statusColor = (theme: Theme, status: Status) =>
  ({
    ONLINE: theme.colors.statusOnline,
    AWAY: theme.colors.statusAway,
    OFFLINE: theme.colors.statusOffline,
  })[status];
