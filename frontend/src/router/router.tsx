import { createBrowserRouter, RouterProvider } from "react-router";
import LandingPage from "./routes/Landing";
import AuthLayout from "./routes/auth/AuthLayout";
import { useMemo } from "react";
import ErrorPage from "./ErrorPage";
import Chat from "./routes/chat/Chat";
import Login from "./routes/auth/Login";
import Signup from "./routes/auth/Signup";
import ChatLayout from "./routes/chat/ChatLayout";
import ChatHome from "./routes/chat/ChatHome";
import Logout from "./routes/auth/Logout";

const Router = () => { 
    const router = useMemo(() => { return createBrowserRouter([
        {path: "/", element: <LandingPage />, errorElement: <ErrorPage />},
        {path: "/chat", element: <ChatLayout />, errorElement: <ErrorPage />,
            children: [
                {path: "", element: <ChatHome />},
                {path: ":chatroomId", element: <Chat />}
            ]
        },
        {element: <AuthLayout />, errorElement: <ErrorPage />,
            children: [
                {path: "login", element: <Login />},
                {path: "register", element: <Signup />},
                {path: "logout", element: <Logout />}
            ],
        },
        ])
    }, []);

    return <RouterProvider router={router} />
}

export default Router;