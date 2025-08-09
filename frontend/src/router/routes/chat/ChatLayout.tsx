import { css, useTheme, type Theme } from "@emotion/react";
import Sidebar from "../../../components/Sidebar";
import { Outlet } from "react-router";
import useToggle from "../../../hooks/useToggle";

const styles = css({
  minHeight: "100dvh",
  width: "100%",
  display: "flex",
})

const chatStyles = css({
    minHeight: "100%",
    flexGrow: 1,
});

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.brown,
    color: theme.colors.dark_grey,
});

export type SidebarContextType = {
  setSidebarToggled: (toggleState?: boolean) => void
  sidebarToggled: boolean
}

function ChatLayout() {
  const theme = useTheme();
  const [sidebarToggled, setSidebarToggled] = useToggle(false);

  return (
    <div css={styles}>
      { sidebarToggled && <Sidebar />}
        <div css={[chatStyles, colors(theme)]}>
            <Outlet context={{setSidebarToggled, sidebarToggled} satisfies SidebarContextType} />
        </div>
    </div>
  )
}

export default ChatLayout;
