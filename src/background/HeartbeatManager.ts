import { Tabs } from "webextension-polyfill-ts";
import timeSpentRepository, {
  TimeSpentOnSiteData,
} from "./repository/timeSpentRepository";

type Hostname = string;

interface Heartbeat {
  source: Hostname;
  title?: string;
  firstHeartbeat: boolean;
  pagePath: string;
}

/**
 * @description a class used to manage heartbeats coming from multiple sources (i.e. pages)
 */
class PageHeartbeatManager {
  private readonly heartbeatQueue: Array<Heartbeat> = [];
  private isHandlerRunning: boolean = false;

  constructor(private readonly prettyName = "PageHeartbeatManager") {}

  async heartbeat(
    pageHostname: string,
    tab: Tabs.Tab,
    pagePath: string,
    firstHeartbeat = false
  ) {
    if (!tab.active) {
      return;
    }
    this.heartbeatQueue.push({
      source: pageHostname,
      title: tab.title,
      firstHeartbeat,
      pagePath,
    });
    this.startHandler();
  }

  private async startHandler() {
    let heartbeatBeingHandled: Heartbeat | undefined;
    try {
      if (this.isHandlerRunning) {
        return;
      }
      this.isHandlerRunning = true;
      const currentDate = new Date();
      const data = await timeSpentRepository.getDataByDate(currentDate);
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
        if (
          heartbeatBeingHandled.title &&
          heartbeatBeingHandled.firstHeartbeat
        ) {
          if (
            !dataForSite.metadata ||
            heartbeatBeingHandled.pagePath.split("/").length >
              dataForSite.metadata.sourcePath.split("/").length
          ) {
            dataForSite.metadata = {
              prettyName: heartbeatBeingHandled.title,
              sourcePath: heartbeatBeingHandled.pagePath,
            };
          }
        }
      }
      timeSpentRepository.setDataByDate(currentDate, data);
    } catch (e) {
      console.error(`${this.prettyName} failed to unload queue.`, e);
      if (heartbeatBeingHandled) {
        // dead-letters go back to the queue
        this.heartbeatQueue.push(heartbeatBeingHandled);
        heartbeatBeingHandled = undefined;
      }
    } finally {
      this.isHandlerRunning = false;
    }
  }
}

export default PageHeartbeatManager;
