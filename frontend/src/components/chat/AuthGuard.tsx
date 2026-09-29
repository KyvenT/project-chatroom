import { css, useTheme } from "@emotion/react";
import { Link } from "react-router";
import Modal from "../Modal";
import { isLoggedInSelector, useAuthStore } from "../../hooks/useStores";
import type { Theme } from "@emotion/react";
import { formModalStyles } from "../../styles/modalForm";

const styles = (theme: Theme) =>
  css(formModalStyles(theme, "420px"), {
    ".header": {
      paddingRight: "24px",
    },

    // links styled as the shared modal buttons
    "a.btn": {
      textDecoration: "none",
    },
  });

const AuthGuard = () => {
  const theme = useTheme();
  const isLoggedIn = useAuthStore(isLoggedInSelector);

  return (
    <Modal
      open={!isLoggedIn}
      modalStyles={styles(theme)}
      variant="requiredInteraction"
    >
      <div className="header">
        <h2>You're not signed in</h2>
        <p className="subtitle">Sign in to see your chatrooms and messages.</p>
      </div>
      <div className="body">
        <p className="hint">Have an invite link? Open it to join as a guest.</p>
      </div>
      <div className="footer">
        <div className="footerEnd">
          <Link to="/register" className="btn btnSecondary">
            Create account
          </Link>
          <Link to="/login" className="btn btnPrimary">
            Sign in
          </Link>
        </div>
      </div>
    </Modal>
  );
};

export default AuthGuard;
