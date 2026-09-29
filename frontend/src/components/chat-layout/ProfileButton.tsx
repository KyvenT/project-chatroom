import { LogOut, User, UserRound } from "lucide-react";
import DropdownButton from "../DropdownButton";
import { Link } from "react-router";
import { useAuthStore } from "../../hooks/useStores";
import { css, useTheme, type Theme } from "@emotion/react";

const styles = (theme: Theme) =>
  css({
    ".profile": {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },

    ".avatar": {
      flex: "0 0 auto",
      width: "2.25rem",
      height: "2.25rem",
      display: "grid",
      placeItems: "center",
      borderRadius: "50%",
      fontWeight: 600,
      textTransform: "uppercase",
      color: theme.colors.onAccent,
      backgroundColor: theme.colors.accent,
    },

    ".profileText": {
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
    },

    ".username": {
      fontSize: "0.95rem",
      fontWeight: 600,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },

    ".accountType": {
      fontSize: "0.8rem",
      color: theme.colors.light_grey,
    },
  });

export const ProfileButton = () => {
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();

  return (
    <DropdownButton
      aria-label="Open profile menu"
      buttonText={<User className="headerIconBtn" />}
      buttonVariant="icon"
      dropdownStyles={styles(theme)}
    >
      <div className="menuHeader profile">
        <span className="avatar" aria-hidden="true">
          {user.username.charAt(0)}
        </span>
        <div className="profileText">
          <span className="username">{user.username}</span>
          <span className="accountType">
            {user.isGuest ? "Guest" : "Account"}
          </span>
        </div>
      </div>
      <Link to="/account" className="menuItem">
        <UserRound size="1rem" />
        Account details
      </Link>
      <div className="menuDivider" />
      <Link to="/logout" className="menuItem menuItemDanger">
        <LogOut size="1rem" />
        Log out
      </Link>
    </DropdownButton>
  );
};
