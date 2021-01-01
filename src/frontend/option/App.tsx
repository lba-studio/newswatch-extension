import { Button, Card, Grid, makeStyles, Typography } from "@material-ui/core";
import React from "react";
import StatisticsView from "../components/StatisticsView";
import NotificationView from "../components/NotificationView";
import getGreeting from "../../utils/getGreeting";
import AuthContext from "../auth/AuthContext";

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
  const { user, launchWebAuthFlow, logout } = React.useContext(AuthContext);
  return (
    <>
      <Card className={classes.rootContainer}>
        <Grid container spacing={2} alignItems="center" justify="center">
          <Grid item xs={12}>
            <Typography align="center" variant="h1">
              {getGreeting(user?.name)}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <NotificationView />
          </Grid>
          <Grid item xs={12}>
            <StatisticsView />
          </Grid>
          <Grid container item xs={12}>
            <Grid item xs={12} sm={6}>
              <Button fullWidth disabled={!user} onClick={() => logout()}>
                Logout
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                disabled={Boolean(user)}
                onClick={() => launchWebAuthFlow()}
              >
                Login
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Card>
    </>
  );
}
