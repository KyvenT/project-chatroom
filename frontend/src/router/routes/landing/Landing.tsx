import { css } from "@emotion/react";
import { Link } from "react-router";
import { mq } from "../../../styles/breakpoints";
import { Keyboard, Menu } from "lucide-react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import Button from "../../../components/Button";
import { useEffect } from "react";
import useToggle from "../../../hooks/useToggle";

const styles = css(
  mq({
    height: "100%",
    display: "flex",
    flexDirection: "column",

    ".brandTitle": {
      userSelect: "none",
      fontSize: ["1.5rem", "1.75rem"],
    },

    ".navBarContainer": {
      position: "sticky",
      width: "100%",
      height: ["15%", "15%", "10%"],
    },

    ".navBar": {
      height: "100%",
      width: "100%",
      padding: ["4px", "8px"],
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "white",
      textWrap: "nowrap",
    },

    ".authLink": {},

    ".navLink": {
      fontSize: "1.1rem",
      textDecoration: "none",
      color: "black",
      textAlign: "center",
      width: "100%",
    },

    ".centerNavLink": {
      padding: ["16px", "16px", "8px"],
      borderTop: ["1px solid black", "1px solid black", 0],
      borderBottom: ["1px solid black", "1px solid black", 0],
    },

    ".navLink:hover": {
      textDecoration: "underline",
      backgroundColor: "#BBB",
    },

    ".centerNavLinks": {
      position: ["absolute", "absolute", "static"],
      left: 0,
      bottom: 0,
      transform: ["translateY(100%)", "translateY(100%)", "translateY(0)"],
      width: ["100dvw", "100dvw", "30%"],
      minWidth: "fit-content",
      display: "flex",
      backgroundColor: ["#DDD", "#DDD", "transparent"],
      flexDirection: ["column", "column", "row"],
      justifyContent: "space-evenly",
      alignItems: "center",
      listStyle: "none",
      padding: 0,
    },

    ".content": {
      color: "white",
      height: "100%",
      backgroundColor: "black",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },

    ".card": {
      width: "70%",
      display: "flex",
      border: "1px solid grey",
      padding: "10px",
      borderRadius: "6px",
    },

    ".cardSection": {
      flex: 1,
    },

    ".mobileNavToggleBtn": {
      color: "black",
    },

    ".mobileNavToggleBtn:hover": {
      color: "#444444",
    },

    ".brandArea": {
      display: "flex",
      minWidth: "fit-content",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "4px",
    },
  })
);

const LandingPage = () => {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useToggle(false);

  // reset state to false when window size grows beyond mobile
  useEffect(() => {
    if (isMobile) return;
    if (mobileNavOpen) setMobileNavOpen(false);
  }, [isMobile]);

  return (
    <div css={styles}>
      <div className="navBarContainer">
        <nav className="navBar">
          <div className="brandArea">
            {isMobile && (
              <Button
                variant="icon"
                className="mobileNavToggleBtn"
                onClick={() => setMobileNavOpen()}
              >
                <Menu size="2rem" />
              </Button>
            )}
            <h1 className="brandTitle">Project Chatroom</h1>
          </div>
          {(!isMobile || mobileNavOpen) && (
            <ul className="centerNavLinks">
              <Link to="" className="navLink centerNavLink">
                About Project Chatroom
              </Link>
              <Link to="/chat" className="navLink centerNavLink">
                Join a chatroom
              </Link>
            </ul>
          )}
          <p>
            <Link to="/login" className="navLink">
              Log In
            </Link>{" "}
            /{" "}
            <Link to="/register" className="navLink">
              Register
            </Link>
          </p>
        </nav>
      </div>
      <div className="content">
        <div className="card">
          <div className="cardSection">
            <h2 className="">
              Quickly create chatrooms to manage group communication on the fly
            </h2>
            <p>Create and send a link!</p>
          </div>
          <div className="cardSection">
            <Keyboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
