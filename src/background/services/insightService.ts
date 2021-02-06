import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { browser } from "webextension-polyfill-ts";
import notificationRepository from "../../repositories/notificationRepository";
import statisticsService from "../../services/statistics.service";

let isInitialised = false;
const ALARM_KEY = "ALARM_INSIGHT";

dayjs.extend(duration);

interface IAlarmData {
  lastRunDate: number;
}

async function collectInsights(): Promise<void> {
  console.debug("Collecting insights...");
  const currentDate = new Date();
  const statisticsData = await statisticsService.getStatisticsData(currentDate);
  const threshold = dayjs.duration(1, "minute");
  const negativeSiteLabels: Array<string> = statisticsData
    .filter(
      (data) =>
        data.sentimentScore &&
        data.sentimentScore < -0.2 &&
        data.timeSpentOnSiteData.timeSpentSecond > threshold.asSeconds()
    )
    .sort(
      (a, b) =>
        b.timeSpentOnSiteData.timeSpentSecond -
        a.timeSpentOnSiteData.timeSpentSecond
    )
    .map((data) => {
      return data.url;
    });
  if (negativeSiteLabels.length) {
    await notificationRepository.addNotification({
      message: `It seems like you've been visiting a few negative sites recently, such as ${negativeSiteLabels[0]}.`,
      timestamp: currentDate.valueOf(),
    });
  } else {
    await notificationRepository.addNotification({
      message: "Score! You haven't visited any negative sites recently.",
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
    when: new Date().valueOf(),
    periodInMinutes: 1,
  });
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== ALARM_KEY) {
      return;
    }
    const alarmData: Partial<IAlarmData> =
      (await browser.storage.local.get(ALARM_KEY))[ALARM_KEY] || {};
    const d = dayjs();
    if (
      !(
        alarmData?.lastRunDate && d.isSame(dayjs(alarmData.lastRunDate), "day")
      ) &&
      d.hour() >= 17
    ) {
      collectInsights();
      alarmData.lastRunDate = d.valueOf();
    }
    await browser.storage.local.set({ [ALARM_KEY]: alarmData });
  });
}

const insightService = {
  setup,
  collectInsights,
};

export default insightService;
