import { createMuiTheme, responsiveFontSizes } from "@material-ui/core";
export const appTheme = responsiveFontSizes(
  createMuiTheme({
    typography: {
      h1: {
        fontSize: 24,
        fontWeight: 700,
      },
      h2: {
        fontSize: 22,
        fontWeight: 500,
      },
      h3: {
        fontSize: 21,
        fontWeight: 400,
      },
      h4: {
        fontSize: 20,
      },
      h5: {
        fontSize: 18,
      },
      h6: {
        fontSize: 16,
      },
      body2: {
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
