import { useQuery } from "@tanstack/react-query";
import { verifiedQuery } from "../../../hooks/useCustomQuery";
import useAuthContext from "../../../hooks/useAuthContext";
import { type UserDetails } from "../../../types/REST-types/User";

export const AccountProfilePage = () => {
  const { user } = useAuthContext();
  const { data } = useQuery<UserDetails>({
    queryKey: [],
    queryFn: () =>
      verifiedQuery({ fetchUrl: `http://localhost:3000/api/users/me`, user }),
    staleTime: 0,
  });

  return (
    <div>
      <h1>Account</h1>
      <h2>Username: {user.username}</h2>
      <h3>User ID: {user.userId}</h3>
      <p>{user.isGuest ? "Guest account" : "User account"}</p>
      <p>
        Account created on:{" "}
        {data?.createdAt &&
          new Date(data?.createdAt).toLocaleDateString("en-US")}
      </p>
      <p>{data?.email ? "Email verified" : "Email unverified"}</p>
    </div>
  );
};
