import { useEffect } from "react";
import useAuthContext from "../../../hooks/useAuthContext";
import { useNavigate } from "react-router";
import useWebSocketContext from "../../../hooks/useWebSocketContext";
import { useQueryClient } from "@tanstack/react-query";

const Logout = () => {
  const { handleLogOut } = useAuthContext();
  const { closeWS } = useWebSocketContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.removeQueries();
    handleLogOut();
    closeWS();
    navigate("/login");
  }, []);

  return <div>Logging out</div>;
};

export default Logout;
