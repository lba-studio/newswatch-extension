import { browser } from "webextension-polyfill-ts";
import { Heartbeat, PAGE_HEARTBEAT } from "../commons/messages";

class StatisticsManager {
  private hearbeatTimeoutToken?: number;
  private async heartbeat(init = false) {
    this.hearbeatTimeoutToken = window.setTimeout(async () => {
      await browser.runtime.sendMessage({
        type: PAGE_HEARTBEAT,
        payload: {
          hostname: window.location.hostname,
          firstHeartbeat: init,
          path: window.location.pathname,
        } as Heartbeat,
      });
      this.heartbeat();
    }, 1000);
  }

  start(): this {
    if (!this.hearbeatTimeoutToken) {
      this.heartbeat(true);
    }
    return this;
  }

  stop(): this {
    window.clearTimeout(this.hearbeatTimeoutToken);
    this.hearbeatTimeoutToken = undefined;
    return this;
  }
}

export default StatisticsManager;
