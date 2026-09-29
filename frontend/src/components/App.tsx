import { Global, ThemeProvider } from "@emotion/react";
import Router from "../router/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useRefreshToken } from "../utils/useRefreshToken";
import { useAuthStore } from "../hooks/useStores";
import { closeWs, startWSConnection } from "../ws-router/ws";
import { buildTheme } from "../styles/theme";
import { globalStyles } from "../styles/global";
import { useThemeStore } from "../hooks/useThemeStore";
import { usePreventScrollChaining } from "../hooks/usePreventScrollChaining";

const queryClient = new QueryClient();

function App() {
  const handleSignIn = useAuthStore((state) => state.handleSignIn);
  const setSessionChecked = useAuthStore((state) => state.setSessionChecked);
  const user = useAuthStore((state) => state.user);
  const colorOverrides = useThemeStore((state) => state.overrides);
  const theme = useMemo(() => buildTheme(colorOverrides), [colorOverrides]);
  usePreventScrollChaining();

  useEffect(() => {
    const autoSignIn = async () => {
      const result = await useRefreshToken();
      if (!result.ok) {
        console.log("No valid refresh token, user remains logged out");
      } else {
        handleSignIn(result);
      }
      setSessionChecked();
    };

    autoSignIn();
  }, []);

  useEffect(() => {
    if (user.token) {
      startWSConnection();
    }
    return () => {
      closeWs();
    };
  }, [user.userId]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Global styles={globalStyles(theme)} />
        <Router />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
