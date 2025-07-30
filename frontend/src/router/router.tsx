import { createBrowserRouter, RouterProvider } from "react-router";
import Home from "./routes/Home";
import Auth from "./routes/Auth";
import { useMemo } from "react";
import ErrorPage from "./ErrorPage";
import Chat from "./routes/Chat";

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
            element: <Auth />,
            errorElement: <ErrorPage />
        },
        ])
    }, []);

    return <RouterProvider router={router} />
}

export default Router;
