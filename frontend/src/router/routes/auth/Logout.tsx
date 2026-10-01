import { useEffect } from "react";
import { useAuthStore } from "../../../hooks/useStores";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  customMutation,
  type MutationArgs,
} from "../../../utils/customMutation";
import type { ConfirmationResponse } from "../../../types/REST-types/Invite";
import { Loader } from "../../../components/Loader";
import { API_URL } from "../../../env";
import { closeWs } from "../../../ws-router/ws";

const Logout = () => {
  const handleLogOut = useAuthStore((state) => state.handleLogOut);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate } = useMutation<ConfirmationResponse, Error, MutationArgs>({
    mutationFn: customMutation<ConfirmationResponse>,
    onSuccess: () => {
      queryClient.clear();
      handleLogOut();
      navigate("/login");
    },
    onError: (error) => {
      if (error.message === "input validation error") {
        navigate("/login");
      }
    },
  });

  useEffect(() => {
    // closed by us, so the server ending the session doesn't look like a
    // revocation to handle
    closeWs();
    mutate({
      fetchUrl: `${API_URL}/api/auth/logout`,
      method: "POST",
    });
  }, [mutate]);

  return (
    <div>
      Logging out...
      <Loader />
    </div>
  );
};

export default Logout;
