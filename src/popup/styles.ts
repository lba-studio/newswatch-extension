import { createMuiTheme, responsiveFontSizes } from "@material-ui/core";
export const appTheme = responsiveFontSizes(
  createMuiTheme({
    typography: {
      h1: {
        fontWeight: 700,
      },
      h2: {
        fontWeight: 500,
      },
      h3: {
        fontWeight: 400,
      },
      body1: {
        lineHeight: 1.5,
        marginBottom: "0.5rem",
      },
      subtitle1: {
        fontWeight: 500,
        letterSpacing: 2,
      },
      fontFamily: [
        "Montserrat",
        "Roboto",
        "-apple-system",
        "BlinkMacSystemFont",
      ].join(","),
    },
    overrides: {
      MuiCardHeader: {
        content: {
          minWidth: 0, // for enforcing flex and forcing wrapping
        },
      },
      MuiTableCell: {
        head: {
          fontWeight: 700,
          // color: "#666666",
        },
      },
      MuiLink: {
        root: {
          "&:hover": {
            color: "#fff",
          },
          // color: "#afafaf",
          transition: "color 0.5s",
        },
      },
    },
    palette: {
      type: "dark",
      primary: {
        main: "#fca311",
      },
      secondary: {
        main: "#3E7CB1",
      },
    },
  })
);
