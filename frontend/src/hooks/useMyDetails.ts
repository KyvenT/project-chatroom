import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../env";
import type { UserDetails } from "../types/REST-types/User";
import { customQuery } from "../utils/customQuery";
import { useAuthStore } from "./useStores";

// The signed-in user's account details
export const useMyDetails = () => {
  const user = useAuthStore((state) => state.user);
  return useQuery<UserDetails>({
    queryKey: ["userDetails", user.userId],
    queryFn: () => customQuery({ fetchUrl: `${API_URL}/api/users/me` }),
    enabled: !!user.token,
    staleTime: 0,
  });
};
