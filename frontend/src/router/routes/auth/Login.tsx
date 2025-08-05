import { Link, useNavigate } from "react-router"

const Login = () => {
    const navigate = useNavigate();

    const handleLogin = (event: React.FormEvent) => {
        event.preventDefault();
        
        navigate("/chat");
    }

    return (
        <>
            <h3>Login</h3>

            <form id="loginForm" className="authForm" onSubmit={handleLogin}>
                <input type="text" placeholder="Username..." required />
                <input type="password" placeholder="Password" required />
                <button type="submit">Login</button>
                <Link to="/auth/register">Don't have an account?</Link>
            </form>
        </>
    )

}

export default Login;