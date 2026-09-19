import { User } from "lucide-react";
import DropdownButton from "../DropdownButton";
import { Link, useNavigate } from "react-router";
import Button from "../Button";
import { useAuthStore } from "../../hooks/useStores";
import { css, useTheme, type Theme } from "@emotion/react";
import { mq } from "../../styles/breakpoints";

const styles = (theme: Theme) =>
  css(
    mq({
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "8px",
      width: "fit-content",
      minWidth: "180px",
      backgroundColor: theme.colors.dark_grey,
      padding: "16px",
      borderRadius: theme.radius.lg,
      color: theme.colors.white,
      border: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadow.popup,

      ".username": {
        fontSize: "1rem",
        fontWeight: 600,
      },

      ".accountDetailsLink": {
        textWrap: "nowrap",
        fontSize: "0.85rem",
        color: theme.colors.light_grey,
      },

      ".logoutBtn": {
        width: "100%",
        fontSize: "0.9rem",
        padding: "7px 12px",
        borderRadius: theme.radius.sm,
        backgroundColor: "transparent",
        border: `1px solid ${theme.colors.borderStrong}`,
        cursor: "pointer",
        color: theme.colors.white,
      },

      ".logoutBtn:hover": {
        backgroundColor: theme.colors.grey,
      },
    }),
  );

export const ProfileButton = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();

  return (
    <DropdownButton
      buttonText={<User className="headerIconBtn" />}
      buttonVariant="icon"
      dropdownStyles={styles(theme)}
    >
      <h3 className="username">{user.username}</h3>
      <Link to="/account" className="accountDetailsLink">
        Account Details
      </Link>
      <Button onClick={() => navigate("/logout")} className="logoutBtn">
        Log Out
      </Button>
    </DropdownButton>
  );
};
