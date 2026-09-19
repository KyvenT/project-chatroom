import { css, useTheme, type Theme } from "@emotion/react";

const headerStyles = css({
  width: "100%",
  height: "56px",
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
  padding: "0 12px",
  gap: "8px",
});

const headerColors = (theme: Theme) => ({
  backgroundColor: theme.colors.black,
  color: theme.colors.white,
  borderBottom: `1px solid ${theme.colors.border}`,
});

interface HeaderProps {
  children: React.ReactNode;
}

const Header = ({ children }: HeaderProps) => {
  const theme = useTheme();

  return <header css={[headerStyles, headerColors(theme)]}>{children}</header>;
};

export default Header;
