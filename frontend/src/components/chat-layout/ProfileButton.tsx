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
      gap: "4px",
      width: "fit-content",
      backgroundColor: theme.colors.grey,
      padding: "12px",
      borderRadius: "4px",
      color: theme.colors.white,
      border: `1px solid ${theme.colors.light_grey}`,

      ".username": {
        fontSize: "1.5rem",
        fontWeight: "500",
      },

      ".accountDetailsLink": {
        textWrap: "nowrap",
        color: theme.colors.light_grey,
      },

      ".logoutBtn": {
        fontSize: "1.1rem",
        padding: "6px",
        borderRadius: "4px",
        backgroundColor: "transparent",
        border: `1px solid ${theme.colors.white}`,
        cursor: "pointer",
        color: theme.colors.white,
      },

      ".logoutBtn:hover": {
        backgroundColor: theme.colors.light_grey,
        color: theme.colors.black,
        borderColor: theme.colors.black,
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
