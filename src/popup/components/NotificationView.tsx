import {
  Box,
  Card,
  IconButton,
  makeStyles,
  Typography,
} from "@material-ui/core";
import React from "react";
import notificationRepository, {
  Notification,
} from "../../repositories/notificationRepository";
import CloseIcon from "@material-ui/icons/Close";

const useStyles = makeStyles((theme) => ({
  insightCard: {
    marginBottom: theme.spacing(1),
  },
}));

function NotificationView() {
  const classes = useStyles();
  const [notifications, setNotifications] = React.useState<
    Array<Notification>
  >();
  React.useEffect(() => {
    notificationRepository.subscribe((notifications) =>
      setNotifications(notifications)
    );
  }, []);
  return (
    <Box display="flex" flexDirection="column">
      {notifications ? (
        notifications.reverse().map((notification) => (
          <Card className={classes.insightCard}>
            <Box display="flex" alignItems="center">
              <Box flex="1 1" p={1}>
                <Typography variant="subtitle2">
                  {notification.message}
                </Typography>
              </Box>
              <Box flex="0 0">
                <IconButton
                  onClick={() =>
                    notificationRepository.removeNotification(
                      notification.timestamp
                    )
                  }
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </Card>
        ))
      ) : (
        <></>
      )}
    </Box>
  );
}

export default NotificationView;
