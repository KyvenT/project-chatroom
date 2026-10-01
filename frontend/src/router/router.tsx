import { createBrowserRouter, RouterProvider } from "react-router";
import AuthLayout from "./routes/auth/AuthLayout";
import { useMemo } from "react";
import ErrorPage from "./ErrorPage";
import Chat from "./routes/chat/Chat";
import ChatLayout from "./routes/chat/ChatLayout";
import ChatHome from "./routes/chat/ChatHome";

// Pages outside the chat are only downloaded when first opened, keeping them
// out of the bundle signed-in users load for the chat.
const Router = () => {
  const router = useMemo(() => {
    return createBrowserRouter([
      {
        path: "/",
        lazy: {
          Component: async () =>
            (await import("./routes/landing/Landing")).default,
        },
        errorElement: <ErrorPage />,
        hydrateFallbackElement: <></>,
      },
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
        hydrateFallbackElement: <></>,
        children: [
          {
            path: "login",
            lazy: {
              Component: async () =>
                (await import("./routes/auth/Login")).default,
            },
          },
          {
            path: "register",
            lazy: {
              Component: async () =>
                (await import("./routes/auth/Signup")).default,
            },
          },
          {
            path: "logout",
            lazy: {
              Component: async () =>
                (await import("./routes/auth/Logout")).default,
            },
          },
          {
            path: "join/:joinKey",
            lazy: {
              Component: async () =>
                (await import("./routes/join/JoinChatroom")).default,
            },
          },
        ],
      },
      {
        Component: ChatLayout,
        errorElement: <ErrorPage />,
        hydrateFallbackElement: <></>,
        children: [
          {
            path: "account",
            lazy: {
              Component: async () =>
                (await import("./routes/utility/AccountProfile"))
                  .AccountProfilePage,
            },
          },
          {
            path: "settings",
            lazy: {
              Component: async () =>
                (await import("./routes/utility/Settings")).SettingsPage,
            },
          },
        ],
      },
    ]);
  }, []);

  return <RouterProvider router={router} />;
};

export default Router;
