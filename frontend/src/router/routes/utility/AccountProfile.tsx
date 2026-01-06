import { useQuery } from "@tanstack/react-query";
import { verifiedQuery } from "../../../hooks/useCustomQuery";
import useAuthContext from "../../../hooks/useAuthContext";
import { type UserDetails } from "../../../types/REST-types/User";
import { css, useTheme } from "@emotion/react";
import { mq } from "../../../styles/breakpoints";
import type { Theme } from "@emotion/react";

const styles = (theme: Theme) =>
  css(
    mq({
      ".container": {
        width: "90%",
        backgroundColor: theme.colors.grey,
        padding: "12px",
        margin: "auto",
      },

      ".profilePicture": {
        aspectRatio: "1",
        width: "100px",
        backgroundColor: theme.colors.light_grey,
        borderRadius: "50%",
        //backgroundImage: "",
      },
    })
  );

export const AccountProfilePage = () => {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { data } = useQuery<UserDetails>({
    queryKey: [],
    queryFn: () =>
      verifiedQuery({ fetchUrl: `http://localhost:3000/api/users/me`, user }),
    staleTime: 0,
  });

  return (
    <div css={styles(theme)}>
      <div className="container">
        <h1 className="title">Account Details</h1>
        <div className="profilePicture"></div>
        <input
          type="file"
          id="profilePictureInput"
          accept="image/png, image/jpeg"
        ></input>
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
    </div>
  );
};
