import { browser } from "webextension-polyfill-ts";
import { Heartbeat, PAGE_HEARTBEAT } from "../commons/messages";

class StatisticsManager {
  private hearbeatTimeoutToken?: ReturnType<typeof setTimeout>;
  private async heartbeat(init = false) {
    this.hearbeatTimeoutToken = setTimeout(async () => {
      await browser.runtime.sendMessage({
        type: PAGE_HEARTBEAT,
        payload: {
          hostname: window.location.hostname,
          firstHeartbeat: init,
        } as Heartbeat,
      });
      this.heartbeat();
    }, 1000);
  }

  start() {
    if (!this.hearbeatTimeoutToken) {
      this.heartbeat(true);
    }
    return this;
  }

  stop() {
    clearTimeout(this.hearbeatTimeoutToken);
    this.hearbeatTimeoutToken = undefined;
  }
}

export default StatisticsManager;
