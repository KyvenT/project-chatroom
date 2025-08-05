import { css, useTheme, type Theme } from "@emotion/react";
import { Link, Outlet } from "react-router";

const styles = css({
    minHeight: "100dvh",
    display: "flex",
    justifyContent: "center", 
    alignItems: "center",

    ".homeLink": {
        textDecoration: "none",
        color: "black",
        position: "absolute",
        top: "10px",
        left: "10px",
        fontSize: "1.2rem",
    },

    ".authContainer": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "10px",
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    },

    ".authForm": {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: "1rem", 
        padding: "0.5rem 3rem 1.5rem",
        gap: ".5rem",

        input: {
            fontSize: "1rem",
            padding: "4px",
            width: "100%",
            height: "100%"
        },

        button: {
            width: "fit-content",
            fontSize: "1rem",
            padding: "4px 8px"
        }
    },




})

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.light_grey,
    color: theme.colors.dark_grey,
});

function AuthLayout() {
    const theme = useTheme();

    return (
        <div css={[styles, colors(theme)]}>
            <Link to="/" className="homeLink">
                Go to Home Page
            </Link>
            <div className="authContainer">
                <Outlet />
            </div>
        </div>
    )
}

export default AuthLayout;
