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
  const router = useMemo(() => {
    return createBrowserRouter([
      { path: "/", Component: LandingPage, errorElement: <ErrorPage /> },
      {
        path: "/chat",
        Component: ChatLayout,
        errorElement: <ErrorPage />,
        children: [
          { path: "", Component: ChatHome },
          { path: ":chatroomId", Component: Chat },
        ],
      },
      {
        Component: AuthLayout,
        errorElement: <ErrorPage />,
        children: [
          { path: "login", Component: Login },
          { path: "register", Component: Signup },
          { path: "logout", Component: Logout },
        ],
      },
    ]);
  }, []);

  return <RouterProvider router={router} />;
};

export default Router;
