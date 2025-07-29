import { css, useTheme, type Theme } from "@emotion/react";
import ProfileButton from "./ProfileButton";

const styles = css({
    display: "flex",
    justifyContent: "space-between",
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.light_grey,
    color: theme.colors.white, 
});

const Header = () => {
    const theme = useTheme();

    return (
        <header css={[styles, colors(theme)]}>
            <h1>Chatroom #1</h1>
            <ProfileButton />
        </header>
    );
}

export default Header;