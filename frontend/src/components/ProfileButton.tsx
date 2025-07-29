import { css, useTheme, type Theme } from "@emotion/react";

const styles = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",

    button: {
        borderRadius: "20px",
    }
})

const colors = (theme: Theme) => ({
    backgroundColor: theme.colors.light_grey,
    color: theme.colors.white,

    button: {
        backgroundColor: theme.colors.dark_grey,
        color: theme.colors.white,
        border: "none",
        padding: "10px 20px",
        cursor: "pointer",

        "&:hover": {
            backgroundColor: theme.colors.light_grey,
        }
    }
});

const ProfileButton = () => {
    const theme = useTheme();

    return (
        <div css={[styles, colors(theme)]}>
            <button>
                Profile
            </button>
        </div>
    );
}

export default ProfileButton;