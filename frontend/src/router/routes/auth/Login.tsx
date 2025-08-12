import { useState } from "react";
import { Link, useNavigate } from "react-router"
import useAuthContext from "../../../hooks/useAuthContext";
import type { UserAuth } from "../../../types/User";
import useWebSocketContext from "../../../hooks/useWebSocketContext";

const Login = () => {
    const navigate = useNavigate();
    const [username, setUsernameInput] = useState<String>("");
    const [password, setPasswordInput] = useState<String>("");
    const [error, setError] = useState<String>("");
    const {handleSignIn} = useAuthContext();
    const {handleWSAuth} = useWebSocketContext();

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const res = await fetch("http://localhost:3000/api/auth/login",
                {
                    method: "POST", 
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({username, password})
                }
            );

            if (!res.ok) {
                console.error(res.status);
            }

            const data = await res.json() as UserAuth;
            console.log(data);

            handleSignIn(data);
            handleWSAuth(data.token);
            navigate("/chat/b42f337e-2950-4059-8205-077c73b45398");
        } catch (err: any) {
            setError(err.message);
            console.log(err);
        }
    }

    return (
        <>
            <h3>Login</h3>
            <form id="loginForm" className="authForm" onSubmit={handleLogin}>
                <input type="text" 
                        onChange={(e) => setUsernameInput(e.target.value)} 
                        placeholder="Username..."
                        maxLength={20} 
                        required />
                <input type="password" 
                        onChange={(e) => setPasswordInput(e.target.value)} 
                        placeholder="Password..." 
                        maxLength={20}
                        required />
                <button type="submit">Login</button>
                <Link to="/register">Don't have an account?</Link>
            </form>
            {error && <p>Error: {error}</p>}
        </>
    )

}

export default Login;