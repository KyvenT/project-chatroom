interface SidebarChatroomButtonProps {
    isActive?: boolean;
    title: string;
}

const styles = {
    padding: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    width: "100%",
}

const dynamicStyles = (isActive: boolean) => ({
    backgroundColor: isActive ? "blue" : "grey",
});

const SidebarChatroomButton = ({isActive=false, title} : SidebarChatroomButtonProps) => {
    return <li>
        <button css={[styles, dynamicStyles(isActive)]}>{title}</button>
    </li>
}

export default SidebarChatroomButton;