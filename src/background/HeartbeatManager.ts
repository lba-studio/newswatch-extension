import dayjs from "dayjs";
import { Tabs } from "webextension-polyfill-ts";
import timeSpentRepository, {
  TimeSpentOnSiteData,
} from "./repository/timeSpentRepository";

type Hostname = string;

interface Heartbeat {
  source: Hostname;
}

/**
 * @description a class used to manage heartbeats coming from multiple sources (i.e. pages)
 */
class PageHeartbeatManager {
  private readonly heartbeatQueue: Array<Heartbeat> = [];
  private isHandlerRunning: boolean = false;

  constructor(private readonly prettyName = "PageHeartbeatManager") {}

  async heartbeat(pageHostname: string, tab: Tabs.Tab) {
    if (!tab.active) {
      return;
    }
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
      const currentDate = new Date();
      const data = await timeSpentRepository.getDataByDate(currentDate);
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
      timeSpentRepository.setDataByDate(currentDate, data);
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
