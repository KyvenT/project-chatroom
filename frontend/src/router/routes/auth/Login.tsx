import { useState } from "react";
import { Link, useNavigate } from "react-router"
import useAuthContext from "../../../hooks/useAuthContext";
import type { UserAuth } from "../../../types/User";

const Login = () => {
    const navigate = useNavigate();
    const [usernameInput, setUsernameInput] = useState<String>("");
    const [passwordInput, setPasswordInput] = useState<String>("");
    const [error, setError] = useState<String>("");
    const {handleSignIn} = useAuthContext();

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const res = await fetch("http://localhost:3000/api/auth/login",
                {
                    method: "POST", 
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({usernameInput, passwordInput})
                }
            );

            if (!res.ok) {
                console.error(res.status);
            }

            const data = await res.json() as UserAuth;
            console.log(data);

            handleSignIn(data)
            navigate("/chat");
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