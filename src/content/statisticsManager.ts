import { browser } from "webextension-polyfill-ts";
import { PAGE_HEARTBEAT } from "../commons/messages";

class StatisticsManager {
  private hearbeatTimeoutToken?: ReturnType<typeof setTimeout>;
  private async initHeartbeat() {
    this.hearbeatTimeoutToken = setTimeout(async () => {
      await browser.runtime.sendMessage({
        type: PAGE_HEARTBEAT,
        payload: window.location.hostname,
      });
      this.initHeartbeat();
    }, 1000);
  }

  start() {
    if (!this.hearbeatTimeoutToken) {
      this.initHeartbeat();
    }
    return this;
  }

  stop() {
    clearTimeout(this.hearbeatTimeoutToken);
    this.hearbeatTimeoutToken = undefined;
  }
}

export default StatisticsManager;
