import { browser } from "webextension-polyfill-ts";
import { AnalyticsData } from "../commons/typedefs";

const TIME_SPENT_DATA_KEY = "TIME_SPENT_ON_SITE";

type Hostname = string;

interface Heartbeat {
  source: Hostname;
}

interface TimeSpentOnSiteData {
  timeSpentSecond: number; // in seconds
}

/**
 * @description a class used to manage heartbeats coming from multiple sources (i.e. pages)
 */
class PageHeartbeatManager {
  private readonly heartbeatQueue: Array<Heartbeat> = [];
  private isHandlerRunning: boolean = false;

  constructor(private readonly prettyName = "PageHeartbeatManager") {}

  async heartbeat(pageHostname: string) {
    // strip the page url to the relevant domain
    this.heartbeatQueue.push({ source: pageHostname });
    this.startHandler();
  }

  private async startHandler() {
    let heartbeatBeingHandled: Heartbeat | undefined;
    try {
      if (this.isHandlerRunning) {
        return;
      }
      const data: AnalyticsData<TimeSpentOnSiteData> =
        (await browser.storage.local.get(TIME_SPENT_DATA_KEY))[
          TIME_SPENT_DATA_KEY
        ] || {};
      this.isHandlerRunning = true;
      while (this.heartbeatQueue.length > 0) {
        heartbeatBeingHandled = this.heartbeatQueue.shift();
        if (!heartbeatBeingHandled) {
          break;
        }
        const dataForSite: TimeSpentOnSiteData = data[
          heartbeatBeingHandled.source
        ] || {
          timeSpentSecond: 0,
        };
        dataForSite.timeSpentSecond += 1;
        data[heartbeatBeingHandled.source] = dataForSite;
        // console.debug("Received heartbeat", heartbeatBeingHandled.source);
      }
      await browser.storage.local.set({ [TIME_SPENT_DATA_KEY]: data });
    } catch (e) {
      console.error(`${this.prettyName} failed to unload queue.`, e);
      if (heartbeatBeingHandled) {
        // chuck it back into the pile
        this.heartbeatQueue.push(heartbeatBeingHandled);
        heartbeatBeingHandled = undefined;
      }
    } finally {
      this.isHandlerRunning = false;
    }
  }
}

export default PageHeartbeatManager;
