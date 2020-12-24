import { Divider, Grid, makeStyles, Typography } from "@material-ui/core";
import React from "react";
import Options from "../components/Options";
import StatisticsView from "../components/StatisticsView";
import NotificationView from "../components/NotificationView";
import DefaultAppWrapper from "../components/DefaultAppWrapper";
import getGreeting from "../../utils/getGreeting";
import PageSentimentView from "../components/PageSentimentView";

const useStyles = makeStyles((theme) => ({
  rootGrid: {
    padding: theme.spacing(2),
    minWidth: 320,
  },
}));

export default function () {
  const classes = useStyles();
  return (
    <DefaultAppWrapper>
      <Grid
        container
        spacing={2}
        className={classes.rootGrid}
        alignItems="center"
        justify="center"
      >
        <Grid item xs={12}>
          <Typography align="center" variant="h1">
            {getGreeting()}
          </Typography>
        </Grid>
        <Grid container>
          <PageSentimentView />
        </Grid>
        <Grid item xs={12}>
          <NotificationView />
        </Grid>
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
    </DefaultAppWrapper>
  );
}
