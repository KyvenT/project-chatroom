import { css, useTheme, type Theme } from "@emotion/react";
import ProfileButton from "./ProfileButton";
import InboxButton from "./InboxButton";
import { Link } from "react-router";

const headerStyles = css({
    display: "flex",
    alignItems: "center",
    padding: "0 10px",
    gap: "10px",

    h1: {
        flexGrow: 1,
    }
});

const headerBtnStyles = css({
    borderRadius: "20px",
    width: "fit-content",
    height: "fit-content",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "1rem",
    textDecoration: "none",
})

const headerBtnColors = (theme: Theme) => ({
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    border: `1px solid ${theme.colors.white}`,

    "&:hover": {
        backgroundColor: theme.colors.light_grey,
    }
});

export const headerBtnStylesWithColors = [headerBtnStyles, headerBtnColors];

const headerColors = (theme: Theme) => ({
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    borderBottom: `2px solid ${theme.colors.dark_grey}`, 
});

const Header = () => {
    const theme = useTheme();

    return (
        <header css={[headerStyles, headerColors(theme)]}>
            <h1>Chatroom #1</h1>
            <InboxButton />
            <ProfileButton />
            <Link to="/auth" css={headerBtnStylesWithColors}>
                Sign In
            </Link>
        </header>
    );
}

export default Header;