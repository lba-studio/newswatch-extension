import {
  Box,
  Button,
  Grid,
  LinearProgress,
  Switch,
  Typography,
} from "@material-ui/core";
import React from "react";
import { browser } from "webextension-polyfill-ts";
import {
  Action,
  PUSH_CONTENT_CONFIG,
  STATE_CONNECT,
} from "../../commons/messages";
import { ContentConfig, TabState } from "../../commons/typedefs";
import AuthContext from "../auth/AuthContext";
import ConfigContext from "./ConfigContext";

function Options() {
  const configContext = React.useContext(ConfigContext);
  const { user, logout } = React.useContext(AuthContext);
  const [contentConfig, setContentConfig] = React.useState<ContentConfig>({
    highlightSelectedText: false,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  React.useEffect(() => {
    const statePort = browser.runtime.connect(undefined, {
      name: STATE_CONNECT,
    });
    statePort.onMessage.addListener((state: TabState) => {
      setContentConfig(state.contentConfig);
      setIsLoading(false);
    });
  }, []);
  const updateContentConfig = React.useCallback(
    (nextContentConfig: Partial<ContentConfig>) => {
      if (!isLoading) {
        const updatedContentConfig = Object.assign(
          contentConfig,
          nextContentConfig
        );
        (async () => {
          const message: Action<ContentConfig> = {
            type: PUSH_CONTENT_CONFIG,
            payload: updatedContentConfig,
            tabFallback: await configContext.tabFallback,
          };
          await browser.runtime.sendMessage(message);
        })();
      }
    },
    [isLoading, contentConfig, configContext]
  );
  return (
    <>
      <Grid container justify="center">
        {!isLoading ? (
          <Grid container item xs={12} direction="row" alignItems="center">
            <Box flex="1 1">
              <Typography>View analyzed text</Typography>
            </Box>
            <Box flex="0 0">
              <Switch
                color="primary"
                checked={contentConfig.highlightSelectedText}
                onChange={() =>
                  updateContentConfig({
                    highlightSelectedText: !contentConfig.highlightSelectedText,
                  })
                }
                name="textHighlight"
              />
            </Box>
          </Grid>
        ) : (
          <Grid item xs={12}>
            <LinearProgress />
          </Grid>
        )}
        <Grid container justify="flex-end" item xs={12}>
          <Button
            color="primary"
            onClick={() => browser.runtime.openOptionsPage()}
          >
            Options
          </Button>
          {user && (
            <Button color="primary" onClick={() => logout()}>
              Logout
            </Button>
          )}
        </Grid>
      </Grid>
    </>
  );
}

export default Options;
