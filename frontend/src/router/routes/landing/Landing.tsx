import { css } from "@emotion/react";
import { Link } from "react-router";

const styles = css({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "black",

  ".navBar": {
    width: "100%",
    height: "10%",
    padding: "0 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
  },

  ".navLink": {
    textDecoration: "none",
    color: "black",
  },

  ".navLink:hover": {
    textDecoration: "underline",
  },

  ".centerNavLinks": {
    display: "flex",
    gap: "24px",
    alignItems: "center",
  },
});

const LandingPage = () => {
  return (
    <div css={styles}>
      <nav className="navBar">
        <h1>Project Chatroom</h1>
        <ul className="centerNavLinks">
          <Link to="" className="navLink">
            About Project Chatroom
          </Link>
          <Link to="/chat" className="navLink">
            Join a chatroom
          </Link>
        </ul>
        <Link to="/login" className="navLink">
          Log In
        </Link>
      </nav>
    </div>
  );
};

export default LandingPage;
