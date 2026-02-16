import { useEffect } from "react";
import { useAuthStore } from "../../../hooks/useStores";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

const Logout = () => {
  const handleLogOut = useAuthStore((state) => state.handleLogOut);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.clear();
    handleLogOut();
    navigate("/login");
  }, []);

  return <div>Logging out</div>;
};

export default Logout;
