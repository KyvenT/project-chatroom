import { css } from "@emotion/react";
import Sidebar from "../../../components/Sidebar";
import { Outlet } from "react-router";
import useToggle from "../../../hooks/useToggle";
import Header, { headerBtnStylesWithColors } from "../../../components/Header";
import DropdownButton from "../../../components/DropdownButton";
import { Link, useNavigate, useParams } from "react-router";
import InboxButton from "../../../components/InboxButton";
import { ChevronFirst, MenuIcon } from "lucide-react";
import useAuthContext from "../../../hooks/useAuthContext";

const styles = css({
  minHeight: "100dvh",
  width: "100%",
  display: "flex",

  ".container": {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column"
  },

  ".outletWrapper": {
    flex: 1,
    maxHeight: "100%"
  }
})

export interface SidebarContextType {
  setSidebarToggled: (toggleState?: boolean) => void
  sidebarToggled: boolean
}

function ChatLayout() {
  const [sidebarToggled, setSidebarToggled] = useToggle(false);
  const navigate = useNavigate();
  const {isLoggedIn, user} = useAuthContext();
  const {chatroomId} = useParams();

  return (
    <div css={styles}>
      {sidebarToggled && <Sidebar />}
        <div className="container">
          <Header>
            <button onClick={() => setSidebarToggled()}>{sidebarToggled ? <ChevronFirst /> : <MenuIcon />}</button>
            <h1>{chatroomId || "Welcome"}</h1>
            {isLoggedIn ?
            <>
              <InboxButton />
              <DropdownButton buttonText="Profile">
                <h3>{user.username}</h3>
                <Link to="">Account Settings</Link>
                <button onClick={() => navigate("/logout")} css={headerBtnStylesWithColors}>Log Out</button>
              </DropdownButton>
            </>
            :
            <Link to="/login" css={headerBtnStylesWithColors}>
                Sign In
            </Link>}
          </Header>
          <div className="outletWrapper">
            <Outlet context={{setSidebarToggled, sidebarToggled} satisfies SidebarContextType} />
          </div>
        </div>
    </div>
  )
}

export default ChatLayout;
