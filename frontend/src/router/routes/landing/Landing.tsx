import { css, useTheme, type Theme } from "@emotion/react";
import { Link } from "react-router";
import { mq } from "../../../styles/breakpoints";
import { Menu } from "lucide-react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import Button from "../../../components/Button";
import { useEffect } from "react";
import useToggle from "../../../hooks/useToggle";
import { isLoggedInSelector, useAuthStore } from "../../../hooks/useStores";

const styles = (theme: Theme) =>
  css(
    mq({
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: theme.colors.black,
      color: theme.colors.white,

      ".brandTitle": {
        cursor: "default",
        fontSize: ["1.1rem", "1.25rem"],
        fontWeight: 700,
        letterSpacing: "-0.02em",
      },

      ".navBarContainer": {
        position: "sticky",
        top: 0,
        width: "100%",
        height: "64px",
        flex: "0 0 auto",
        zIndex: 2,
      },

      ".navBar": {
        height: "100%",
        width: "100%",
        padding: ["0 12px", "0 32px"],
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.colors.black,
        borderBottom: `1px solid ${theme.colors.border}`,
        textWrap: "nowrap",
      },

      ".navLink": {
        fontSize: "0.9rem",
        textDecoration: "none",
        color: theme.colors.light_grey,
        textAlign: "center",
        padding: "6px 10px",
        borderRadius: theme.radius.sm,
        transition: "color 0.15s ease, background-color 0.15s ease",
      },

      ".navLink:hover": {
        textDecoration: "none",
        color: theme.colors.white,
        backgroundColor: theme.colors.grey,
      },

      ".navCta": {
        backgroundColor: theme.colors.accent,
        color: theme.colors.onAccent,
        fontWeight: 500,
      },

      ".navCta:hover": {
        backgroundColor: theme.colors.accentHover,
        color: theme.colors.onAccent,
      },

      ".authLinks": {
        display: "flex",
        alignItems: "center",
        gap: "4px",
      },

      ".centerNavLink": {
        width: "100%",
        padding: ["16px", "16px", "6px 10px"],
        borderTop: [
          `1px solid ${theme.colors.border}`,
          `1px solid ${theme.colors.border}`,
          0,
        ],
      },

      ".centerNavLinks": {
        position: ["absolute", "absolute", "static"],
        left: 0,
        bottom: 0,
        transform: ["translateY(100%)", "translateY(100%)", "translateY(0)"],
        width: ["100dvw", "100dvw", "auto"],
        minWidth: "fit-content",
        display: "flex",
        backgroundColor: [
          theme.colors.dark_grey,
          theme.colors.dark_grey,
          "transparent",
        ],
        flexDirection: ["column", "column", "row"],
        justifyContent: "space-evenly",
        alignItems: "center",
        listStyle: "none",
        padding: 0,
      },

      ".content": {
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        backgroundImage: `radial-gradient(60% 50% at 50% 0%, ${theme.colors.accentSoft}, transparent)`,
      },

      ".card": {
        width: ["100%", "100%", "min(1100px, 90%)"],
        display: "flex",
        flexDirection: ["column", "column", "row"],
        alignItems: "center",
        gap: ["24px", "48px"],
        padding: ["20px", "40px"],
        backgroundColor: theme.colors.dark_grey,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.popup,
      },

      ".cardSection": {
        flex: 1,
        minWidth: 0,
      },

      ".cardSection h2": {
        fontSize: ["1.6rem", "2.1rem"],
        lineHeight: 1.2,
        fontWeight: 700,
        letterSpacing: "-0.03em",
        marginBottom: "12px",
      },

      ".cardSection p": {
        color: theme.colors.light_grey,
        fontSize: "1.05rem",
      },

      ".mobileNavToggleBtn": {
        color: theme.colors.light_grey,
      },

      ".brandArea": {
        display: "flex",
        minWidth: "fit-content",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
      },

      ".sampleImage": {
        width: "100%",
        height: "auto",
        display: "block",
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
      },
    }),
  );

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useToggle(false);
  const isLoggedIn = useAuthStore(isLoggedInSelector);

  // reset state to false when window size grows beyond mobile
  useEffect(() => {
    if (isMobile) return;
    if (mobileNavOpen) setMobileNavOpen(false);
  }, [isMobile]);

  return (
    <div css={styles(theme)}>
      <div className="navBarContainer">
        <nav className="navBar">
          <div className="brandArea">
            {isMobile && (
              <Button
                variant="icon"
                className="mobileNavToggleBtn"
                onClick={() => setMobileNavOpen()}
              >
                <Menu size="1.5rem" />
              </Button>
            )}
            <h1 className="brandTitle">Project Chatroom</h1>
          </div>
          {mobileNavOpen && (
            <ul className="centerNavLinks">
              <Link to="" className="navLink centerNavLink">
                About Project Chatroom
              </Link>
              {/*
              <Link to="/chat" className="navLink centerNavLink">
                Join a chatroom
              </Link>
              */}
              <Link to="/login" className="navLink centerNavLink">
                Log In
              </Link>
              <Link to="/register" className="navLink centerNavLink">
                Register
              </Link>
            </ul>
          )}
          {!isMobile && (
            <>
              <ul className="centerNavLinks">
                <Link to="" className="navLink centerNavLink">
                  About Project Chatroom
                </Link>
                {/*
              <Link to="/chat" className="navLink centerNavLink">
                Join a chatroom
              </Link>
              */}
              </ul>
              <div className="authLinks">
                {isLoggedIn ? (
                  <Link to="/chat" className="navLink navCta">
                    Start Chatting
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="navLink">
                      Log In
                    </Link>
                    <Link to="/register" className="navLink navCta">
                      Register
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </nav>
      </div>
      <div className="content">
        <div className="card">
          <div className="cardSection">
            <h2 className="">
              Create chatrooms to manage group communication on the fly
            </h2>
            <p>Supports guest access without registration!</p>
          </div>
          <div className="cardSection">
            <img className="sampleImage" src="/sample.png" alt="Sample UI" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
