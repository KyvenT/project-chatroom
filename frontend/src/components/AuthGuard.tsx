import { css } from "@emotion/react"
import { Link } from "react-router"
import Modal from "./Modal"
import useToggle from "../hooks/useToggle"
import useAuthContext from "../hooks/useAuthContext"
import { ArrowLeftIcon } from "lucide-react"

const styles = css({
    position: "relative",

    ".subpageContainer": {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "orange",
        width: "100%",
        padding: "30px",
        gap: "8px"
    },

    form: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    
    ".backBtn": {
        position: "absolute",
        top: "5px",
        left: "5px",
        width: "fit-content",
    }

})

const modalStyles = css({
    borderRadius: "10px",
    border: "2px solid black",
})

const AuthGuard = () => {
    const [toggleContinueAsGuest, setToggleContinueAsGuest] = useToggle(false);
    const {isLoggedIn} = useAuthContext();

    return (
        <Modal open={!isLoggedIn} modalStyles={modalStyles}>
            <div css={styles}>
                {toggleContinueAsGuest ? 
                <div className="subpageContainer">
                    <a className="backBtn" onClick={() => setToggleContinueAsGuest(false)}><ArrowLeftIcon /></a>
                    <h3>Create a Guest User</h3>
                    <form id="createGuest">
                        <div>
                            <label htmlFor="usernameInput">Username: </label>
                            <input id="usernameInput" placeholder="Bob..."></input>
                        </div>
                        <button type="submit">Join as Guest</button>
                    </form>
                </div> : <div className="subpageContainer">
                    <h3>You are currently not logged in</h3>
                    <Link to="/login">Sign in to chat</Link>
                    <p>or</p>
                    <a onClick={() => setToggleContinueAsGuest(true)}>Join chatroom as Guest</a>
                </div>}
            </div>
        </Modal>
    )
}

export default AuthGuard;