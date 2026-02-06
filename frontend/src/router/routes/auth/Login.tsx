import { useState } from "react";
import { Link, useNavigate } from "react-router";
import useAuthContext from "../../../hooks/useAuthContext";
import type { UserAuth } from "../../../types/REST-types/User";
import useWebSocketContext from "../../../hooks/useWebSocketContext";
import { handleWSAuth } from "../../../ws-router/out-going-ws-messages/auth";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import { mq } from "../../../styles/breakpoints";
import Button from "../../../components/Button";
import { Eye, EyeClosed } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { API_URL } from "../../../env";

export const authPageStyles = (theme: Theme) =>
  css(
    mq({
      height: "100%",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: "16px",
      padding: "20px",
      backgroundColor: "white",
      borderRadius: "10px",
      boxShadow: "0 2px 2px rgba(0,0,0,0.1)",

      h1: {
        cursor: "default",
        fontSize: "1.75rem",
        fontWeight: "500",
      },

      ".authForm": {
        width: ["80dvw", "70dvw", "50dvw", "25dvw"],
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0.5rem 3rem 1.5rem",
        gap: "12px",

        ".textInput": {
          fontSize: "1.25rem",
          minWidth: 0,
          width: "90%",
          outline: "none",
        },

        ".passwordContainer": {
          width: "90%",
          display: "flex",
          border: `1px solid ${theme.colors.grey}`,
          borderRadius: "4px",
          alignItems: "center",
          padding: "4px",
        },

        ".usernameInput": {
          borderRadius: "4px",
          border: `1px solid ${theme.colors.grey}`,
          padding: "4px",
        },

        ".passwordInput": {
          flex: 1,
          border: 0,
          borderRadius: "4px 0 0 4px",
        },

        ".submitBtn": {
          cursor: "pointer",
          width: "fit-content",
          fontSize: "1.1rem",
          padding: "4px 8px",
          backgroundColor: theme.colors.white,
          border: `1px solid ${theme.colors.dark_grey}`,
          borderRadius: "4px",
          boxShadow: `1px 1px 2px 1px ${theme.colors.light_grey}`,
        },

        ".submitBtn:hover": {
          backgroundColor: "white",
        },

        ".submitBtn:active": {
          boxShadow: `inset 1px 1px 2px 1px ${theme.colors.light_grey}`,
        },

        ".revealPasswordBtn": {
          cursor: "pointer",
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          border: 0,
        },

        ".revealPasswordBtn:hover": {
          color: theme.colors.grey,
        },

        ".eyeIcon": {},
      },
    }),
  );

export type LoginCredentials = {
  username: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<String>("");
  const { handleSignIn } = useAuthContext();
  const { ws, setWs } = useWebSocketContext();
  const [isRevealingPassword, setIsRevealingPassword] =
    useState<boolean>(false);
  const theme = useTheme();
  const { register, handleSubmit, setFocus } = useForm<LoginCredentials>();

  const handleLogin: SubmitHandler<LoginCredentials> = async (data) => {
    const { username, password } = data;

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        console.error(res.status);
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
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
      <h1>Login</h1>
      <form
        id="loginForm"
        className="authForm"
        onSubmit={handleSubmit(handleLogin)}
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
              <EyeClosed className="eyeIcon" size="1.5rem" />
            ) : (
              <Eye className="eyeIcon" size="1.5rem" />
            )}
          </Button>
        </div>
        <button className="submitBtn" type="submit">
          Login
        </button>
        <Link to="/register">Don't have an account?</Link>
      </form>
      {error && <p>Error: {error}</p>}
    </div>
  );
};

export default Login;
