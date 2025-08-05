import { Link, useNavigate } from "react-router";

const Signup = () => {
    const navigate = useNavigate();

    const handleRegister = (event: React.FormEvent) => {
        event.preventDefault();
        
        navigate("/chat");
    };

    return (
        <>
            <h3>Create an account</h3>
            <form id="registerForm" className="authForm" onSubmit={handleRegister}>
                <input type="text" placeholder="Username" required />
                <input type="password" placeholder="Password" required />
                <button type="submit">Register</button>
                <Link to="/auth/login">Already have an account?</Link>
            </form>
        </>
    )
}

export default Signup;