import IconButton from "@material-ui/core/IconButton";
import React from "react";
import CloseIcon from "@material-ui/icons/Close";
import { browser } from "webextension-polyfill-ts";
import { Action, PUSH_NOTIFICATION } from "../commons/messages";
import { appTheme } from "../commons/styles";
import { MuiThemeProvider } from "@material-ui/core/styles";
import Snackbar from "@material-ui/core/Snackbar";

function Overlay() {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState<string>();
  const handleClose = () => {
    setOpen(false);
    setMessage(undefined);
  };
  React.useEffect(() => {
    browser.runtime.onMessage.addListener(async (message: Action, sender) => {
      if (sender.tab) {
        return;
      } else {
        const { type } = message;
        switch (type) {
          case PUSH_NOTIFICATION: {
            const { payload } = message;
            if (typeof payload === "string") {
              const msg = payload;
              console.debug("Displaying message.", msg);
              setMessage(msg);
              setOpen(true);
            } else {
              console.error("Unknown message.", payload);
            }
            break;
          }
        }
      }
    });
  }, []);
  return (
    <MuiThemeProvider theme={appTheme}>
      <Snackbar
        style={{
          zIndex: 9999,
        }}
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        action={
          <React.Fragment>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </React.Fragment>
        }
        message={message}
      />
    </MuiThemeProvider>
  );
}

export default Overlay;
