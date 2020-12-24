import {
  Grid,
  LinearProgress,
  Typography,
  IconButton,
} from "@material-ui/core";
import React from "react";
import { browser } from "webextension-polyfill-ts";
import {
  GRAB_AND_ANALYSE,
  STATE_CONNECT,
  ANALYSE_TEXT,
  ANALYSE_TEXT_ERROR,
  INIT_ANALYSIS,
  Action,
} from "../../commons/messages";
import { TabState } from "../../commons/typedefs";
import computeColorHex from "../../utils/computeColorHex";
import { getSentimentScoreLikertValue } from "../../utils/sentimentScoreUtil";
import ConfigContext from "../ConfigContext";
import SentimentIcon from "./SentimentIcon";
import RefreshIcon from "@material-ui/icons/Refresh";

function PageSentimentView() {
  const configContext = React.useContext(ConfigContext);
  const [currentScore, setCurrentScore] = React.useState<number>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasErrored, setHasErrored] = React.useState(false);
  async function onReload() {
    const tabFallback = configContext.tabFallback;
    const message: Action = {
      type: GRAB_AND_ANALYSE,
      tabFallback: await tabFallback,
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
    <>
      {isLoading && (
        <Grid item xs={12}>
          <LinearProgress />
        </Grid>
      )}
      {currentScore && (
        <>
          <Grid container item xs={3} justify="center" alignItems="center">
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
    </>
  );
}

export default PageSentimentView;
