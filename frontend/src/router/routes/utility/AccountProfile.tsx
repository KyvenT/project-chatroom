import { useQuery } from "@tanstack/react-query";
import { customQuery } from "../../../hooks/useCustomQuery";
import { useAuthStore } from "../../../hooks/useStores";
import { type UserDetails } from "../../../types/REST-types/User";
import { css, useTheme } from "@emotion/react";
import { mq } from "../../../styles/breakpoints";
import type { Theme } from "@emotion/react";
import { API_URL } from "../../../env";

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

      h2: {
        fontSize: "1.25rem",
        fontWeight: "600",
        margin: 0,
      },

      span: {
        fontSize: "1rem",
        fontWeight: "300",
      },

      ".flex": {
        display: "flex",
        gap: "8px",
        alignItems: "center",
      },
    }),
  );

export const AccountProfilePage = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  const { data } = useQuery<UserDetails>({
    queryKey: [],
    queryFn: () =>
      customQuery({
        fetchUrl: `${API_URL}/api/users/me`,
      }),
    staleTime: 0,
  });

  return (
    <div css={styles(theme)}>
      <div className="container">
        <h1 className="title">Account Details</h1>
        {/*<div className="profilePicture"></div>
        <input
          type="file"
          id="profilePictureInput"
          accept="image/png, image/jpeg"
        ></input>
        */}
        <div className="username flex">
          <h2>Username</h2>
          <span>{user.username}</span>
        </div>
        <div className="flex">
          <h2>User ID</h2>
          <span>{user.userId}</span>
        </div>
        <p>{user.isGuest ? "Guest account" : "User account"}</p>
        <p>
          Account created on:{" "}
          {data?.createdAt &&
            new Date(data?.createdAt).toLocaleDateString("en-US")}
        </p>
        {/*<p>{data?.email ? "Email verified" : "Email unverified"}</p>*/}
        {/*<button>Delete account</button>*/}
      </div>
    </div>
  );
};
