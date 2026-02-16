import { useEffect } from "react";
import { useAuthStore } from "../../../hooks/useStores";
import { useNavigate } from "react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  customMutation,
  type MutationArgs,
} from "../../../hooks/useCustomMutation";
import type { ConfirmationResponse } from "../../../types/REST-types/Invite";
import { Loader } from "../../../components/Loader";
import { API_URL } from "../../../env";

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
  });

  useEffect(() => {
    mutate({
      fetchUrl: `${API_URL}/api/auth/logout`,
      method: "POST",
    });
  }, []);

  return (
    <div>
      Logging out...
      <Loader />
    </div>
  );
};

export default Logout;
