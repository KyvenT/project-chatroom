import { createContext, useState } from "react";
import type { UserAuth } from "../types/User";

interface AuthContextProviderProps {
    children: React.ReactNode;
}

interface AuthContextType {
    user: UserAuth;
    handleSignIn: (newUser: UserAuth) => void;
    handleLogOut: () => void;
    isLoggedIn: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthContextProvider({ children }: AuthContextProviderProps) {
    const [user, setUser] = useState<UserAuth>({userId: "", username: "", token: ""});
    const isLoggedIn = user.token !== "";

    const handleSignIn = (newUser: UserAuth) => {
        if (!newUser.userId || !newUser.username || !newUser.token) {
            throw new Error("credentials missing");
        }
        setUser({userId: newUser.userId, username: newUser.username, token: newUser.token})
    }

    const handleLogOut = () => {
        setUser({userId: "", username: "", token: ""})
    }

    return <AuthContext.Provider value={{ user, handleSignIn, handleLogOut, isLoggedIn }}>
        {children}
    </AuthContext.Provider>
}