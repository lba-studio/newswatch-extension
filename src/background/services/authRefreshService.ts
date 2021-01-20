import { browser } from "webextension-polyfill-ts";
import authService from "../../services/auth.service";

const ALARM_KEY = "ALARM_REFRESH_AUTH";

function init(): void {
  authService.onUserChange((user) => {
    if (user) {
      browser.alarms.create(ALARM_KEY, {
        when: (user.expiry - 300) * 1000,
      });
      browser.alarms.onAlarm.addListener((alarm) => {
        if (alarm.name !== ALARM_KEY) {
          return;
        }
        authService.refreshAuth();
      });
    }
  });
}

const authRefreshService = { init };

export default authRefreshService;
