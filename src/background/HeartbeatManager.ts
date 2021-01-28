import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { browser, Tabs } from "webextension-polyfill-ts";
import { Action, PUSH_NOTIFICATION } from "../commons/messages";
import sentimentSiteDataRepository from "../repositories/sentimentSiteDataRepository";
import timeSpentRepository, {
  TimeSpentOnSiteData,
} from "../repositories/timeSpentRepository";
import getTabId from "./utils/getTabId";

dayjs.extend(duration);

type Hostname = string;

interface Heartbeat {
  source: Hostname;
  title?: string;
  firstHeartbeat: boolean;
  pagePath: string;
}

interface ActivityInfo {
  activeTimeOnSite: number;
  currentSource: Hostname;
  isUserNotified: boolean;
}

type TabId = number;

const CLEAR_ACTIVETIMEONSITE_ALARM_LABEL = "ALARM_CLEAR_ACTIVETIMEONSITE";
const ALARM_DELIMITER = ">>";

function getInitialActivityInfo(source: Hostname): ActivityInfo {
  return {
    activeTimeOnSite: 0,
    currentSource: source,
    isUserNotified: false,
  };
}

/**
 * @description a class used to manage heartbeats coming from multiple sources (i.e. pages)
 */
class PageHeartbeatManager {
  private readonly heartbeatQueue: Array<Heartbeat>;
  private readonly tabActivityInfoMap: Map<TabId, ActivityInfo>;
  private isHandlerRunning = false;

  constructor(private readonly prettyName = "PageHeartbeatManager") {
    this.heartbeatQueue = [];
    this.tabActivityInfoMap = new Map();
    browser.tabs.onRemoved.addListener((tabId) => {
      this.tabActivityInfoMap.delete(tabId);
    });
    browser.alarms.onAlarm.addListener(({ name }) => {
      const nameTokens = name.split(ALARM_DELIMITER);
      if (
        nameTokens.length === 2 &&
        nameTokens[0] === CLEAR_ACTIVETIMEONSITE_ALARM_LABEL
      ) {
        const tabId = Number(nameTokens[1]);
        const activityInfo = this.tabActivityInfoMap.get(tabId);
        if (!activityInfo) {
          return;
        }
        activityInfo.activeTimeOnSite = 0;
        this.tabActivityInfoMap.set(tabId, activityInfo);
      }
    });
  }

  async heartbeat(
    pageHostname: string,
    currentTab: Tabs.Tab,
    pagePath: string,
    firstHeartbeat = false
  ): Promise<void> {
    if (!currentTab.active) {
      return;
    }
    this.heartbeatQueue.push({
      source: pageHostname,
      title: currentTab.title,
      firstHeartbeat,
      pagePath,
    });
    this.startHandler();
    const alarmLabel =
      CLEAR_ACTIVETIMEONSITE_ALARM_LABEL +
      ALARM_DELIMITER +
      getTabId(currentTab);
    let activityInfo = this.tabActivityInfoMap.get(getTabId(currentTab));
    if (activityInfo && activityInfo.currentSource === pageHostname) {
      activityInfo.activeTimeOnSite += 1;
    } else {
      activityInfo = getInitialActivityInfo(pageHostname);
    }
    this.tabActivityInfoMap.set(getTabId(currentTab), activityInfo);
    browser.alarms.create(alarmLabel, {
      when: dayjs().add(1, "minute").valueOf(),
    });
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
            heartbeatBeingHandled.pagePath.split("/").length <
              dataForSite.metadata.sourcePath.split("/").length
          ) {
            dataForSite.metadata = {
              prettyName: heartbeatBeingHandled.title,
              sourcePath: heartbeatBeingHandled.pagePath,
            };
          }
        }
        data[heartbeatBeingHandled.source] = dataForSite;
      }
      await timeSpentRepository.setDataByDate(currentDate, data);
      await this.collectInsights();
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

  private async collectInsights() {
    const sentimentSiteData = await sentimentSiteDataRepository.getDataByDate(
      new Date()
    );
    for (const [tabId, info] of Array.from(this.tabActivityInfoMap.entries())) {
      if (
        !info.isUserNotified &&
        info.activeTimeOnSite > dayjs.duration(30, "second").asSeconds()
      ) {
        // hmm they're spending some time here...
        const sentimentData = sentimentSiteData[info.currentSource];
        if (sentimentData?.averageSentiment < -0.2) {
          // hmm it's been hella negative hey
          await browser.tabs.sendMessage(tabId, {
            type: PUSH_NOTIFICATION,
            payload:
              "Hey! We noticed you've been spending a lot of time here, and the content you've been consuming is considered to be negative.",
          } as Action<string>);
          info.isUserNotified = true;
          this.tabActivityInfoMap.set(tabId, info);
        }
      }
    }
  }
}

export default PageHeartbeatManager;
