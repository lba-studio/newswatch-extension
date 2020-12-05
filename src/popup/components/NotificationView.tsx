import {
  Box,
  Card,
  CardContent,
  CardHeader,
  makeStyles,
} from "@material-ui/core";
import React from "react";

const useStyles = makeStyles((theme) => ({
  insightCard: {
    marginBottom: theme.spacing(1),
  },
}));

function NotificationView() {
  const classes = useStyles();
  return (
    <Box display="flex" flexDirection="column">
      <Card className={classes.insightCard}>
        <CardContent>
          How are you? This is a test notification by Zenti!
        </CardContent>
      </Card>
      <Card className={classes.insightCard}>
        <CardContent>
          Hey! We saw that you've been reading a lot of negative content on
          reddit.com. Perhaps you should cut back on it?
        </CardContent>
      </Card>
    </Box>
  );
}

export default NotificationView;
