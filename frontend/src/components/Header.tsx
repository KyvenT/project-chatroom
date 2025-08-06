import { css, useTheme, type Theme } from "@emotion/react";

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

interface HeaderProps {
    children: React.ReactNode;
}

export const headerBtnStylesWithColors = (theme: Theme) => {
    return [headerBtnStyles, headerBtnColors(theme)];
}

const headerColors = (theme: Theme) => ({
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    borderBottom: `2px solid ${theme.colors.dark_grey}`, 
});

const Header = ({children}: HeaderProps) => {
    const theme = useTheme();

    return (
        <header css={[headerStyles, headerColors(theme)]}>
            { children }
        </header>
    );
}

export default Header;