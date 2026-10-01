import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuthStore } from "../../../hooks/useStores";
import type { UserAuth } from "../../../types/REST-types/User";
import { useTheme } from "@emotion/react";
import { authPageStyles } from "../../../styles/authPage";
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
import { getSafeRedirect } from "../../../utils/safeRedirect";

export type LoginCredentials = {
  username: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  const [error, setError] = useState<string>("");
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
      navigate(getSafeRedirect(next));
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
        <Link
          to={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
        >
          Don't have an account?
        </Link>
      </form>
    </div>
  );
};

export default Login;
