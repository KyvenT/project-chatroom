import { css, useTheme, type Theme } from "@emotion/react";
import { Link, useNavigate } from "react-router";
import { mq } from "../../../styles/breakpoints";
import {
  ArrowRight,
  Menu,
  MessagesSquare,
  Paperclip,
  PictureInPicture2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import Button from "../../../components/Button";
import { useEffect, useRef, useState } from "react";
import useToggle from "../../../hooks/useToggle";
import { isLoggedInSelector, useAuthStore } from "../../../hooks/useStores";
import { parseJoinKey } from "../../../utils/parseJoinKey";

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

      "button.navLink": {
        font: "inherit",
        fontSize: "0.9rem",
        backgroundColor: "transparent",
        border: 0,
        cursor: "pointer",
      },

      ".navLink.active": {
        color: theme.colors.white,
        backgroundColor: theme.colors.accentSoft,
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
        flexDirection: "column",
        alignItems: "center",
        padding: ["32px 16px 48px", "56px 24px 64px"],
        backgroundImage: `radial-gradient(60% 45% at 50% 0%, ${theme.colors.accentSoft}, transparent)`,
      },

      // centered while there's room, scrolling from the top when there isn't
      ".contentInner": {
        width: "100%",
        margin: "auto 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      },

      ".hero": {
        maxWidth: "760px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "18px",
        textAlign: "center",
      },

      ".eyebrow": {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 12px",
        fontSize: "0.8rem",
        fontWeight: 500,
        color: theme.colors.accent,
        backgroundColor: theme.colors.accentSoft,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "999px",
      },

      ".heroTitle": {
        fontSize: ["2rem", "2.6rem", "3.2rem"],
        lineHeight: 1.1,
        fontWeight: 800,
        letterSpacing: "-0.04em",
      },

      ".accentText": {
        color: theme.colors.accent,
      },

      ".heroText": {
        maxWidth: "560px",
        fontSize: ["1rem", "1.1rem"],
        lineHeight: 1.6,
        color: theme.colors.light_grey,
      },

      ".heroActions": {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px",
        marginTop: "6px",
      },

      ".heroBtn": {
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "11px 20px",
        font: "inherit",
        fontSize: "0.95rem",
        fontWeight: 600,
        textDecoration: "none",
        border: "1px solid transparent",
        borderRadius: theme.radius.md,
        cursor: "pointer",
        transition: "background-color 0.15s ease, border-color 0.15s ease",

        "&:focus-visible": {
          outline: `2px solid ${theme.colors.accent}`,
          outlineOffset: "2px",
        },
      },

      ".heroBtn.primary": {
        color: theme.colors.onAccent,
        backgroundColor: theme.colors.accent,
        "&:hover": { backgroundColor: theme.colors.accentHover },
      },

      ".heroBtn.secondary": {
        color: theme.colors.white,
        backgroundColor: theme.colors.dark_grey,
        borderColor: theme.colors.borderStrong,
        "&:hover": { backgroundColor: theme.colors.grey },
      },

      ".features": {
        width: ["100%", "100%", "min(1000px, 100%)"],
        display: "grid",
        gridTemplateColumns: ["1fr", "repeat(2, 1fr)", "repeat(4, 1fr)"],
        gap: "14px",
        marginTop: ["40px", "56px"],
        padding: 0,
        listStyle: "none",
      },

      ".feature": {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "20px",
        backgroundColor: theme.colors.dark_grey,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        transition: "border-color 0.15s ease, transform 0.15s ease",

        "&:hover": {
          borderColor: theme.colors.borderStrong,
          transform: "translateY(-2px)",
        },

        h3: { fontSize: "1rem", fontWeight: 600 },
        p: {
          fontSize: "0.88rem",
          lineHeight: 1.5,
          color: theme.colors.light_grey,
        },
      },

      ".featureIcon": {
        width: "2.25rem",
        height: "2.25rem",
        display: "grid",
        placeItems: "center",
        marginBottom: "4px",
        color: theme.colors.accent,
        backgroundColor: theme.colors.accentSoft,
        borderRadius: theme.radius.md,
      },

      ".joinCard": {
        width: ["100%", "100%", "min(520px, 90%)"],
        margin: "auto 0",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: ["20px", "40px"],
        backgroundColor: theme.colors.dark_grey,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        boxShadow: theme.shadow.popup,

        h2: {
          fontSize: "1.6rem",
          fontWeight: 700,
          letterSpacing: "-0.03em",
        },

        p: {
          color: theme.colors.light_grey,
        },

        form: {
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        },

        input: {
          width: "100%",
          padding: "10px 12px",
          fontSize: "0.95rem",
          color: theme.colors.white,
          backgroundColor: theme.colors.black,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          outline: "none",
          "&:focus": {
            borderColor: theme.colors.accent,
          },
        },

        ".joinError": {
          color: theme.colors.danger,
          fontSize: "0.85rem",
        },

        ".joinSubmitBtn": {
          padding: "10px 16px",
          fontSize: "0.95rem",
          fontWeight: 500,
          color: theme.colors.onAccent,
          backgroundColor: theme.colors.accent,
          border: 0,
          borderRadius: theme.radius.md,
          cursor: "pointer",
          "&:hover": {
            backgroundColor: theme.colors.accentHover,
          },
        },
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
    }),
  );

// what the app offers, shown under the headline
const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Rooms in seconds",
    text: "Create a chatroom, choose who can join and share its invite link.",
  },
  {
    icon: UserRound,
    title: "Guest access",
    text: "Jump in without registering. Sign up later to keep your chats.",
  },
  {
    icon: Paperclip,
    title: "Share files",
    text: "Send images, videos, PDFs and more, with previews in the chat.",
  },
  {
    icon: PictureInPicture2,
    title: "Pop-out chats",
    text: "Keep other chatrooms open in docked windows, or on top of everything.",
  },
];

const LandingPage = () => {
  const theme = useTheme();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useToggle(false);
  const isLoggedIn = useAuthStore(isLoggedInSelector);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"about" | "join">("about");
  const [joinError, setJoinError] = useState("");
  const joinInputRef = useRef<HTMLInputElement>(null);

  const selectTab = (nextTab: "about" | "join") => {
    setTab(nextTab);
    // useToggle flips on falsy args, so only toggle when the menu is open
    if (mobileNavOpen) setMobileNavOpen();
  };

  const handleJoinSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const joinKey = parseJoinKey(joinInputRef.current?.value ?? "");
    if (!joinKey) {
      setJoinError("That doesn't look like a valid invite id or link.");
      return;
    }
    setJoinError("");
    navigate(`/join/${joinKey}`);
  };

  const tabButtons = (extraClass: string) => (
    <>
      <button
        className={`navLink ${extraClass} ${tab === "about" ? "active" : ""}`}
        onClick={() => selectTab("about")}
      >
        About Project Chatroom
      </button>
      <button
        className={`navLink ${extraClass} ${tab === "join" ? "active" : ""}`}
        onClick={() => selectTab("join")}
      >
        Join Chatroom
      </button>
    </>
  );

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
              {tabButtons("centerNavLink")}
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
              <ul className="centerNavLinks">{tabButtons("centerNavLink")}</ul>
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
        {tab === "about" ? (
          <div className="contentInner">
            <section className="hero">
              <span className="eyebrow">
                <Sparkles size="0.9rem" aria-hidden />
                Free group chat, no sign-up needed
              </span>
              <h2 className="heroTitle">
                Create chatrooms to manage group communication{" "}
                <span className="accentText">on the fly</span>
              </h2>
              <p className="heroText">
                Start a room, share its link and start talking. Jump in as a
                guest, or make an account to keep your chats, folders and
                profile.
              </p>
              <div className="heroActions">
                <Link to="/chat" className="heroBtn primary">
                  {isLoggedIn ? "Open your chats" : "Start chatting"}
                  <ArrowRight size="1rem" aria-hidden />
                </Link>
                <button
                  type="button"
                  className="heroBtn secondary"
                  onClick={() => selectTab("join")}
                >
                  Join with an invite
                </button>
              </div>
            </section>
            <ul className="features">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li className="feature" key={title}>
                  <span className="featureIcon" aria-hidden>
                    <Icon size="1.15rem" />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="joinCard">
            <h2>Join a chatroom</h2>
            <p>Enter the invite id or paste the full invite link.</p>
            <form onSubmit={handleJoinSubmit}>
              <input
                ref={joinInputRef}
                placeholder="Invite id or link..."
                aria-label="Invite id or link"
                autoFocus
                required
              />
              {joinError && <span className="joinError">{joinError}</span>}
              <button className="joinSubmitBtn" type="submit">
                Continue
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
