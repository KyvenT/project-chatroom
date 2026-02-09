import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { UserAuth } from "../../../types/REST-types/User";
import useAuthContext from "../../../hooks/useAuthContext";
import { authPageStyles, type LoginCredentials } from "./Login";
import { useForm, type SubmitHandler } from "react-hook-form";
import Button from "../../../components/Button";
import { Eye, EyeClosed } from "lucide-react";
import { handleWSAuth } from "../../../ws-router/out-going-ws-messages/auth";
import useWebSocketContext from "../../../hooks/useWebSocketContext";
import { useTheme } from "@emotion/react";
import { API_URL } from "../../../env";

const Signup = () => {
  const navigate = useNavigate();
  const { ws, setWs } = useWebSocketContext();
  const [error, setError] = useState<String>("");
  const { handleSignIn } = useAuthContext();
  const [isRevealingPassword, setIsRevealingPassword] =
    useState<boolean>(false);
  const theme = useTheme();
  const { register, handleSubmit, setFocus } = useForm<LoginCredentials>();

  const handleRegister: SubmitHandler<LoginCredentials> = async (data) => {
    const { username, password } = data;

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        console.error(res.status);
        const errorData = await res.json();
        throw new Error(errorData.message || "Signup failed");
      }

      const data = (await res.json()) as UserAuth;
      console.log(data);

      handleSignIn(data);
      handleWSAuth(ws, setWs, data.token);
      navigate("/chat");
    } catch (err: any) {
      setError(err.message);
      console.log(err);
    }
  };

  const handleRevealPasswordClick = () => {
    setIsRevealingPassword((prev) => !prev);
    setFocus("password");
  };

  return (
    <div css={authPageStyles(theme)}>
      <h1>Register account</h1>
      <form
        id="registerForm"
        className="authForm"
        onSubmit={handleSubmit(handleRegister)}
      >
        <input
          className="textInput usernameInput"
          {...register("username")}
          type="text"
          placeholder="Username..."
          minLength={3}
          maxLength={20}
          required
          autoFocus
        />
        <div className="passwordContainer">
          <input
            className="textInput passwordInput"
            {...register("password")}
            {...(isRevealingPassword ? { type: "text" } : { type: "password" })}
            placeholder="Password..."
            minLength={6}
            maxLength={128}
            required
          />
          <Button
            className="revealPasswordBtn"
            type="button"
            onClick={handleRevealPasswordClick}
          >
            {isRevealingPassword ? (
              <EyeClosed size="1.5rem" />
            ) : (
              <Eye size="1.5rem" />
            )}
          </Button>
        </div>{" "}
        <button className="submitBtn" type="submit">
          Register
        </button>
        <Link to="/login">Already have an account?</Link>
      </form>
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default Signup;
