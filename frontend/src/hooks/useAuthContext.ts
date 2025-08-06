import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContextProvider";

export default function useAuthContext() {
    const authContext = useContext(AuthContext);
    if (!authContext) {
        throw new Error("auth context provider is null")
    }
    return authContext;
}