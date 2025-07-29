import { createBrowserRouter, RouterProvider } from "react-router";
import Chatroom from "./routes/Chat";
import Home from "./routes/Home";
import Auth from "./routes/Auth";
import { useMemo } from "react";
import ErrorPage from "./ErrorPage";

const Router = () => { 
    const router = useMemo(() => { return createBrowserRouter([
        {
            path: "/",
            element: <Home />,
            errorElement: <ErrorPage />
        },
        {
            path: "/chat",
            element: <Chatroom />,
            errorElement: <ErrorPage />
        },
        {
            path: "/auth",
            element: <Auth />,
            errorElement: <ErrorPage />
        },
        ])
    }, []);

    return <RouterProvider router={router} />
}

export default Router;
