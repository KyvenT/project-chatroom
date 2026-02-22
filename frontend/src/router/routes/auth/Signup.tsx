import { useState } from "react";
import { Link, useNavigate } from "react-router";
import type { UserAuth } from "../../../types/REST-types/User";
import { useAuthStore } from "../../../hooks/useStores";
import { authPageStyles, type LoginCredentials } from "./Login";
import { useForm, type SubmitHandler } from "react-hook-form";
import Button from "../../../components/Button";
import { Eye, EyeClosed } from "lucide-react";
import { useTheme } from "@emotion/react";
import { API_URL } from "../../../env";
import {
  customMutation,
  type MutationArgs,
} from "../../../utils/customMutation";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "../../../components/Loader";
import { startWSConnection } from "../../../ws-router/ws";
import { sendWSMessage } from "../../../ws-router/sender";

const Signup = () => {
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
      startWSConnection();
      console.log("WebSocket connection established, sending auth message");
      sendWSMessage({ type: "auth", token: loginResponse.token });
      navigate("/chat");
    },
  });

  const handleRegister: SubmitHandler<LoginCredentials> = async (data) => {
    const { username, password } = data;

    mutate({
      fetchUrl: `${API_URL}/api/auth/register`,
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
        {isPending && <Loader />}
        {error && <p>Error: {error}</p>}
        <button className="submitBtn" type="submit">
          Register
        </button>
        <Link to="/login">Already have an account?</Link>
      </form>
    </div>
  );
};

export default Signup;
