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
            path: "/chat",
            // path: "/chat/:chatId", 
            // This would allow for dynamic chat room IDs, but for now we keep it static
            element: <Chat />,
            errorElement: <ErrorPage />
        },
        {
            path: "/auth",
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
