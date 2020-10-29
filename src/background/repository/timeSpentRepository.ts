import dayjs from "dayjs";
import { browser } from "webextension-polyfill-ts";
import { AnalyticsData } from "../../commons/typedefs";

const TIME_SPENT_DATA_KEY = "TIME_SPENT_ON_SITE";
const DATA_KEY_PREFIX = `${TIME_SPENT_DATA_KEY}_`;

export interface TimeSpentOnSiteData {
  timeSpentSecond: number; // in seconds
}

function getDataKey(date: Date): string {
  return DATA_KEY_PREFIX + toISOStringLocalDate(date);
}

function toISOStringLocalDate(date: Date): string {
  return dayjs(date).format().slice(0, 10);
}

async function getDataByDate(
  date: Date
): Promise<AnalyticsData<TimeSpentOnSiteData>> {
  const dataKey = getDataKey(date);
  const data: AnalyticsData<TimeSpentOnSiteData> =
    (await browser.storage.local.get(dataKey))[dataKey] || {};
  return data;
}

async function setDataByDate(
  date: Date,
  data: AnalyticsData<TimeSpentOnSiteData>
) {
  const dataKey = getDataKey(date);
  await browser.storage.local.set({ [dataKey]: data });
}

async function getAllDataWithinRangeInclusive(
  startDate: Date = dayjs().subtract(1, "month").toDate(),
  endDate: Date = new Date()
): Promise<Map<string, AnalyticsData<TimeSpentOnSiteData>>> {
  const convertedStartDate = dayjs(startDate);
  const convertedEndDate = dayjs(endDate);
  let dateDifference = convertedEndDate.diff(convertedStartDate, "day");
  const result: Map<string, AnalyticsData<TimeSpentOnSiteData>> = new Map();
  do {
    const date = convertedStartDate.add(dateDifference, "day").toDate();
    const data = await getDataByDate(date);
    result.set(toISOStringLocalDate(date), data);
    dateDifference -= 1;
  } while (dateDifference >= 0);
  return result;
}

export default {
  getDataByDate,
  setDataByDate,
  getAllDataWithinRangeInclusive,
};
