import { Card, Grid, makeStyles, Typography } from "@material-ui/core";
import React from "react";
import StatisticsView from "../components/StatisticsView";
import NotificationView from "../components/NotificationView";
import DefaultAppWrapper from "../components/DefaultAppWrapper";
import getGreeting from "../../utils/getGreeting";

const useStyles = makeStyles((theme) => ({
  rootContainer: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
    padding: theme.spacing(2),
    marginLeft: "auto",
    marginRight: "auto",
    maxWidth: 512,
  },
}));

export default function () {
  const classes = useStyles();
  return (
    <DefaultAppWrapper>
      <Card className={classes.rootContainer}>
        <Grid container spacing={2} alignItems="center" justify="center">
          <Grid item xs={12}>
            <Typography align="center" variant="h1">
              {getGreeting()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <NotificationView />
          </Grid>
          <Grid item xs={12}>
            <StatisticsView />
          </Grid>
        </Grid>
      </Card>
    </DefaultAppWrapper>
  );
}
