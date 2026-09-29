import { css, useTheme, type Theme } from "@emotion/react";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import type { Chatroom } from "../../types/REST-types/Chatroom";
import SidebarChatroomButton from "./SidebarChatroomButton";
import { readDraggedChatroomId } from "./chatroomDrag";

const styles = (theme: Theme, isDropTarget: boolean) =>
  css({
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    borderRadius: theme.radius.md,
    outline: isDropTarget ? `1px dashed ${theme.colors.accent}` : "none",
    backgroundColor: isDropTarget ? theme.colors.accentSoft : "transparent",

    ".sectionHeader": {
      display: "flex",
      alignItems: "center",
      gap: "2px",
      minHeight: "2.25rem",
      padding: "0 0 0 2px",
    },

    ".collapseBtn": {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      gap: "4px",
      padding: "4px 6px 4px 2px",
      border: 0,
      borderRadius: theme.radius.sm,
      backgroundColor: "transparent",
      color: theme.colors.light_grey,
      cursor: "pointer",
      userSelect: "none",

      "&:hover": { color: theme.colors.white },
      "&:focus-visible": {
        outline: `2px solid ${theme.colors.accent}`,
        outlineOffset: "-2px",
      },
    },

    ".chevron": {
      flex: "0 0 auto",
      transition: "transform 0.15s ease",
    },

    ".chevron.collapsed": {
      transform: "rotate(-90deg)",
    },

    ".sectionTitle": {
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: "0.75rem",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    },

    ".sectionUnread": {
      flex: "0 0 auto",
      minWidth: "1.25rem",
      height: "1.25rem",
      padding: "0 6px",
      borderRadius: "999px",
      fontSize: "0.7rem",
      fontWeight: 600,
      lineHeight: "1.25rem",
      textAlign: "center",
      color: theme.colors.onAccent,
      backgroundColor: theme.colors.accent,
    },

    ".sectionActions": {
      flex: "0 0 auto",
      display: "flex",
      alignItems: "center",
      gap: "2px",
    },

    // folder actions only show on hover or keyboard focus
    ".sectionActions.onHover": {
      opacity: 0,
    },

    "&:hover .sectionActions.onHover, .sectionActions.onHover:focus-within": {
      opacity: 1,
    },

    ".sectionActions button": {
      width: "1.75rem",
      height: "1.75rem",
      padding: 0,
    },

    ul: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },

    ".sectionEmpty": {
      padding: "6px 10px 8px 26px",
      fontSize: "0.8rem",
      color: theme.colors.light_grey,
    },
  });

interface SidebarSectionProps {
  id: string;
  title: string;
  chatrooms: Chatroom[];
  activeChatroomId?: string;
  collapsed: boolean;
  onToggle: () => void;
  // chatrooms dropped on the section are moved into it
  onDropChatroom?: (chatroomId: string) => void;
  actions?: React.ReactNode;
  actionsOnHover?: boolean;
  emptyText: string;
}

export const SidebarSection = ({
  id,
  title,
  chatrooms,
  activeChatroomId,
  collapsed,
  onToggle,
  onDropChatroom,
  actions,
  actionsOnHover = false,
  emptyText,
}: SidebarSectionProps) => {
  const theme = useTheme();
  const [isDropTarget, setIsDropTarget] = useState(false);
  const listId = `sidebar-section-${id}`;
  const unread = chatrooms.reduce((sum, c) => sum + c.unreadMessages, 0);

  const dropProps = onDropChatroom && {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDropTarget(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      // ignore moving between the section's own children
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setIsDropTarget(false);
      }
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setIsDropTarget(false);
      const chatroomId = readDraggedChatroomId(e);
      if (chatroomId) onDropChatroom(chatroomId);
    },
  };

  return (
    <section
      css={styles(theme, isDropTarget)}
      aria-label={title}
      {...dropProps}
    >
      <div className="sectionHeader">
        <button
          type="button"
          className="collapseBtn"
          aria-expanded={!collapsed}
          aria-controls={listId}
          onClick={onToggle}
        >
          <ChevronDown
            className={collapsed ? "chevron collapsed" : "chevron"}
            size="1rem"
            aria-hidden="true"
          />
          <span className="sectionTitle">{title}</span>
          {collapsed && unread > 0 && (
            <span className="sectionUnread" aria-label={`${unread} unread`}>
              {unread}
            </span>
          )}
        </button>
        {actions && (
          <div
            className={
              actionsOnHover ? "sectionActions onHover" : "sectionActions"
            }
          >
            {actions}
          </div>
        )}
      </div>
      {!collapsed && (
        <ul id={listId}>
          {chatrooms.map((chatroom) => (
            <SidebarChatroomButton
              key={chatroom.chatroomId}
              isActive={activeChatroomId === chatroom.chatroomId}
              chatroom={chatroom}
            />
          ))}
          {chatrooms.length === 0 && (
            <li className="sectionEmpty">{emptyText}</li>
          )}
        </ul>
      )}
    </section>
  );
};
