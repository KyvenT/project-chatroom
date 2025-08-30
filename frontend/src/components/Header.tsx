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

const headerColors = (theme: Theme) => ({
    backgroundColor: theme.colors.dark_grey,
    color: theme.colors.white,
    borderBottom: `2px solid ${theme.colors.dark_grey}`, 
});

interface HeaderProps {
    children: React.ReactNode;
}

const Header = ({children}: HeaderProps) => {
    const theme = useTheme();

    return (
        <header css={[headerStyles, headerColors(theme)]}>
            { children }
        </header>
    );
}

export default Header;