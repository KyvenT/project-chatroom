import { QueryClient } from "@tanstack/react-query";

// shared so signing out can clear the previous user's cached data
export const queryClient = new QueryClient();
