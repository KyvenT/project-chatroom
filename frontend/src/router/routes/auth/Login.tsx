import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "../../../hooks/useStores";
import type { UserAuth } from "../../../types/REST-types/User";
import { css, useTheme } from "@emotion/react";
import type { Theme } from "@emotion/react";
import { mq } from "../../../styles/breakpoints";
import Button from "../../../components/Button";
import { Eye, EyeClosed } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { API_URL } from "../../../env";
import { useMutation } from "@tanstack/react-query";
import {
  customMutation,
  type MutationArgs,
} from "../../../utils/customMutation";
import { Loader } from "../../../components/Loader";

export const authPageStyles = (theme: Theme) =>
  css(
    mq({
      width: ["90dvw", "420px"],
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "stretch",
      gap: "8px",
      padding: "32px",
      backgroundColor: theme.colors.dark_grey,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      boxShadow: theme.shadow.popup,
      color: theme.colors.white,
      textAlign: "center",

      h1: {
        cursor: "default",
        fontSize: "1.5rem",
        fontWeight: 600,
        letterSpacing: "-0.02em",
      },

      ".authForm": {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "12px 0 0",
        gap: "12px",

        ".textInput": {
          fontSize: "0.95rem",
          minWidth: 0,
          width: "100%",
          outline: "none",
          color: theme.colors.white,
          backgroundColor: theme.colors.black,
          "&::placeholder": {
            color: theme.colors.light_grey,
          },
        },

        ".passwordContainer, .usernameInput": {
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.black,
          transition: "border-color 0.15s ease",
        },

        ".passwordContainer": {
          width: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 6px 0 0",
        },

        ".usernameInput": {
          padding: "10px 12px",
        },

        ".passwordInput": {
          flex: 1,
          border: 0,
          padding: "10px 12px",
          borderRadius: theme.radius.md,
        },

        ".passwordContainer:focus-within, .usernameInput:focus": {
          borderColor: theme.colors.accent,
        },

        ".submitBtn": {
          color: theme.colors.onAccent,
          cursor: "pointer",
          width: "100%",
          fontSize: "0.95rem",
          fontWeight: 500,
          padding: "10px 16px",
          backgroundColor: theme.colors.accent,
          border: 0,
          borderRadius: theme.radius.md,
          transition: "background-color 0.15s ease",
        },

        ".submitBtn:hover": {
          backgroundColor: theme.colors.accentHover,
        },

        ".revealPasswordBtn": {
          cursor: "pointer",
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          border: 0,
          color: theme.colors.light_grey,
        },

        ".revealPasswordBtn:hover": {
          color: theme.colors.white,
        },

        ".eyeIcon": {
          color: "inherit",
        },

        "> p": {
          color: theme.colors.danger,
          fontSize: "0.85rem",
        },

        "> span": {
          alignSelf: "center",
        },

        "> a": {
          fontSize: "0.85rem",
        },
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
  const handleSignIn = useAuthStore((state) => state.handleSignIn);
  const [isRevealingPassword, setIsRevealingPassword] =
    useState<boolean>(false);
  const theme = useTheme();
  const { register, handleSubmit, setFocus } = useForm<LoginCredentials>();
  const { mutate, isPending } = useMutation<UserAuth, Error, MutationArgs>({
    mutationFn: customMutation<UserAuth>,
    onError: (err) => {
      setError(err.message);
    },
    onSuccess: (loginResponse) => {
      setError("");
      if (!loginResponse) {
        console.error("Login response is undefined");
        return;
      }
      handleSignIn(loginResponse);
      navigate("/chat");
    },
  });

  const handleLogin: SubmitHandler<LoginCredentials> = async (data) => {
    const { username, password } = data;

    mutate({
      fetchUrl: `${API_URL}/api/auth/login`,
      method: "POST",
      reqBody: { username, password },
    });
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
              <EyeClosed className="eyeIcon" size="1.25rem" />
            ) : (
              <Eye className="eyeIcon" size="1.25rem" />
            )}
          </Button>
        </div>{" "}
        {isPending && <Loader />}
        {error && <p>Error: {error}</p>}
        <button className="submitBtn" type="submit">
          Login
        </button>
        <Link to="/register">Don't have an account?</Link>
      </form>
    </div>
  );
};

export default Login;
