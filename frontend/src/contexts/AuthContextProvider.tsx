import { createContext, useState } from "react";

interface AuthContextProviderProps {
    children: React.ReactNode;
}

interface AuthContextType {
    user: {userId: string, username: string, token: string};
    handleSignIn: (newUser: {userId: string, username: string, token: string}) => void;
    handleLogOut: () => void;
    isLoggedIn: Boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export default function AuthContextProvider({ children }: AuthContextProviderProps) {
    const [user, setUser] = useState({userId: "", username: "", token: ""});
    const isLoggedIn = user.userId !== "";

    const handleSignIn = (newUser: {userId: string, username: string, token: string}) => {
        setUser({userId: newUser.userId, username: newUser.username, token: newUser.token})
    }

    const handleLogOut = () => {
        setUser({userId: "", username: "", token: ""})
    }

    return <AuthContext.Provider value={{ user, handleSignIn, handleLogOut, isLoggedIn }}>
        {children}
    </AuthContext.Provider>
}