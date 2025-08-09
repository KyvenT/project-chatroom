import { createBrowserRouter, RouterProvider } from "react-router";
import Home from "./routes/Home";
import AuthLayout from "./routes/auth/AuthLayout";
import { useMemo } from "react";
import ErrorPage from "./ErrorPage";
import Chat from "./routes/Chat";
import Login from "./routes/auth/Login";
import Signup from "./routes/auth/Signup";

const Router = () => { 
    const router = useMemo(() => { return createBrowserRouter([
        {
            path: "/",
            element: <Home />,
            errorElement: <ErrorPage />
        },
        {
            path: "/chat/:chatroomId", 
            element: <Chat />,
            errorElement: <ErrorPage />
        },
        {
            path: "/",
            element: <AuthLayout />,
            errorElement: <ErrorPage />,
            children: [
                {
                    path: "login",
                    element: <Login />,
                },
                {
                    path: "register",
                    element: <Signup />,
                }
            ],
        },
        ])
    }, []);

    return <RouterProvider router={router} />
}

export default Router;
