import {
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  makeStyles,
  MuiThemeProvider,
  Typography,
} from "@material-ui/core";
import React from "react";
import { browser } from "webextension-polyfill-ts";
import {
  Action,
  ANALYSE_TEXT,
  ANALYSE_TEXT_ERROR,
  GRAB_AND_ANALYSE,
  INIT_ANALYSIS,
  STATE_CONNECT,
} from "../commons/messages";
import computeColorHex from "../utils/computeColorHex";
import { getSentimentScoreLikertValue } from "../utils/sentimentScoreUtil";
import SentimentIcon from "./components/SentimentIcon";
import { appTheme } from "./styles";
import RefreshIcon from "@material-ui/icons/Refresh";
import Options from "./components/Options";
import { TabState } from "../commons/typedefs";
import ConfigContext from "./ConfigContext";
import StatisticsView from "./components/StatisticsView";

const useStyles = makeStyles((theme) => ({
  rootGrid: {
    padding: theme.spacing(2),
    minWidth: 320,
  },
}));

const globalTabFallbackPromise = browser.tabs
  .query({ active: true, currentWindow: true })
  .then((e) => e[0]);

export default function () {
  const classes = useStyles();
  const [currentScore, setCurrentScore] = React.useState<number>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasErrored, setHasErrored] = React.useState(false);
  async function onReload() {
    const tabFallback = await globalTabFallbackPromise;
    const message: Action = {
      type: GRAB_AND_ANALYSE,
      tabFallback: tabFallback,
    };
    await browser.runtime.sendMessage(message);
  }
  React.useEffect(() => {
    const statePort = browser.runtime.connect(undefined, {
      name: STATE_CONNECT,
    });
    statePort.onMessage.addListener((state: TabState) => {
      switch (state.lastAction) {
        case ANALYSE_TEXT:
          setIsLoading(false);
          break;
        case ANALYSE_TEXT_ERROR:
          setHasErrored(true);
          break;
        case INIT_ANALYSIS:
          setIsLoading(true);
          break;
      }
      setCurrentScore(state.lastScore);
    });
  }, []);
  React.useEffect(() => {
    if (currentScore) {
      setHasErrored(false);
    }
  }, [currentScore]);
  React.useEffect(() => {
    if (hasErrored) {
      setCurrentScore(undefined);
    }
  }, [hasErrored]);
  return (
    <MuiThemeProvider theme={appTheme}>
      <CssBaseline>
        <ConfigContext.Provider
          value={{
            tabFallback: globalTabFallbackPromise,
          }}
        >
          <Grid
            container
            spacing={2}
            className={classes.rootGrid}
            alignItems="center"
            justify="center"
          >
            {isLoading && (
              <Grid item xs={12}>
                <LinearProgress />
              </Grid>
            )}
            {currentScore && (
              <>
                <Grid
                  container
                  item
                  xs={3}
                  justify="center"
                  alignItems="center"
                >
                  <SentimentIcon
                    score={currentScore}
                    htmlColor={computeColorHex(currentScore)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    align="center"
                    style={{ color: computeColorHex(currentScore) }}
                    variant="h6"
                  >
                    {getSentimentScoreLikertValue(currentScore)} (
                    {currentScore.toFixed(1)})
                  </Typography>
                </Grid>
              </>
            )}
            {!currentScore && !isLoading && (
              <Grid item xs={9}>
                <Typography align="center" variant="h6">
                  No score
                </Typography>
              </Grid>
            )}
            {!isLoading && (
              <Grid container justify="center" item xs={3}>
                <IconButton
                  color="primary"
                  aria-label="recalculate"
                  onClick={() => {
                    onReload();
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Grid>
            )}
            <Grid item xs={12}>
              <StatisticsView />
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <Options />
            </Grid>
          </Grid>
        </ConfigContext.Provider>
      </CssBaseline>
    </MuiThemeProvider>
  );
}
