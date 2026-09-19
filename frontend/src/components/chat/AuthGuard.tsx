import { css, useTheme } from "@emotion/react";
import { Link } from "react-router";
import Modal from "../Modal";
import { isLoggedInSelector, useAuthStore } from "../../hooks/useStores";
import type { Theme } from "@emotion/react";

const styles = (theme: Theme) =>
  css({
    position: "relative",

    ".subpageContainer": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      backgroundColor: theme.colors.dark_grey,
      color: theme.colors.white,
      width: "100%",
      padding: "20px",
      gap: "8px",
    },

    h3: {
      cursor: "default",
      fontWeight: 400,
      fontSize: "1.2rem",
      textAlign: "center",
    },

    form: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      fontSize: "1rem",

      input: {
        fontSize: "1rem",
        background: theme.colors.grey,
        border: `1px solid ${theme.colors.borderStrong}`,
        borderRadius: "2px",
        padding: "2px",
        color: theme.colors.white,
      },
    },

    ".backBtn": {
      position: "absolute",
      top: "5px",
      left: "5px",
      width: "fit-content",
    },

    ".toggleCreateGuestBtn, a": {
      textDecoration: "none",
      fontSize: "1rem",
      cursor: "pointer",
      color: theme.colors.light_grey,
      backgroundColor: "transparent",
      border: 0,
    },

    ".toggleCreateGuestBtn:hover, a:hover": {
      color: theme.colors.white,
    },

    p: {
      fontSize: ".9rem",
      color: theme.colors.white,
    },

    ".guestSubmitBtn": {
      backgroundColor: "transparent",
      border: `1px solid ${theme.colors.borderStrong}`,
      color: theme.colors.white,
      padding: "8px",
      borderRadius: "6px",
    },

    ".guestSubmitBtn:hover": {
      backgroundColor: theme.colors.grey,
    },

    ".errorMessage": {
      color: theme.colors.danger,
      fontSize: "0.9rem",
    },
  });

const modalStyles = (theme: Theme) =>
  css({
    borderRadius: "12px",
    border: `1px solid ${theme.colors.borderStrong}`,
  });

const AuthGuard = () => {
  const theme = useTheme();
  const isLoggedIn = useAuthStore(isLoggedInSelector);

  return (
    <Modal
      open={!isLoggedIn}
      modalStyles={modalStyles(theme)}
      variant="requiredInteraction"
    >
      <div css={styles(theme)}>
        <div className="subpageContainer">
          <h3>You are currently not logged in</h3>
          <Link to="/login">Sign in to chat</Link>
          <p>Have an invite link? Open it to join as a guest.</p>
        </div>
      </div>
    </Modal>
  );
};

export default AuthGuard;
