import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { browser } from "webextension-polyfill-ts";
import notificationRepository from "../../repositories/notificationRepository";
import statisticsService from "../../services/statistics.service";

let isInitialised = false;
const ALARM_KEY = "ALARM_INSIGHT";

dayjs.extend(duration);

async function collectInsights(): Promise<void> {
  const negativeSiteLabels: Array<string> = [];
  const currentDate = new Date();
  const statisticsData = await statisticsService.getStatisticsData(currentDate);
  const threshold = dayjs.duration(1, "minute");
  statisticsData
    .filter(
      (data) => data.timeSpentOnSiteData.timeSpentSecond > threshold.asSeconds()
    )
    .sort(
      (a, b) =>
        b.timeSpentOnSiteData.timeSpentSecond -
        a.timeSpentOnSiteData.timeSpentSecond
    )
    .forEach((data) => {
      if (data.sentimentScore < -0.2) {
        negativeSiteLabels.push(data.url);
      }
    });
  if (negativeSiteLabels.length) {
    await notificationRepository.addNotification({
      message: `It seems like you've been visiting a few negative sites recently, such as ${negativeSiteLabels[0]}.`,
      timestamp: currentDate.valueOf(),
    });
  }
}

function setup(): void {
  if (isInitialised) {
    return;
  }
  isInitialised = true;
  browser.alarms.create(ALARM_KEY, {
    when: dayjs().add(1, "day").set("hour", 17).valueOf(),
    periodInMinutes: dayjs.duration(24, "hours").asMinutes(),
  });
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== "ALARM_KEY") {
      return;
    }
    collectInsights();
  });
}

const insightService = {
  setup,
  collectInsights,
};

export default insightService;
