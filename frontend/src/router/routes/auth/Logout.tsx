import { useEffect } from "react";
import useAuthContext from "../../../hooks/useAuthContext";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

const Logout = () => {
  const { handleLogOut } = useAuthContext();
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
