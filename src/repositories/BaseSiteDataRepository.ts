import dayjs from "dayjs";
import { browser } from "webextension-polyfill-ts";
import { AnalyticsData } from "../commons/typedefs";

export type Url = string;

abstract class BaseSiteDataRepository<T> {
  protected readonly dataKeyPrefix: string;

  constructor(dataKey: string) {
    this.dataKeyPrefix = `${dataKey}_`;
  }

  private getDataKey(date: Date): string {
    return this.dataKeyPrefix + this.toISOStringLocalDate(date);
  }

  private toISOStringLocalDate(date: Date): string {
    return dayjs(date).format().slice(0, 10);
  }

  async getDataByDate(date: Date): Promise<AnalyticsData<T>> {
    const dataKey = this.getDataKey(date);
    const data: AnalyticsData<T> =
      (await browser.storage.local.get(dataKey))[dataKey] || {};
    return data;
  }

  async setDataByDate(date: Date, data: AnalyticsData<T>) {
    const dataKey = this.getDataKey(date);
    await browser.storage.local.set({ [dataKey]: data });
  }

  async getAllDataWithinRangeInclusive(
    startDate: Date = dayjs().subtract(1, "month").toDate(),
    endDate: Date = new Date()
  ): Promise<Map<Url, AnalyticsData<T>>> {
    const convertedStartDate = dayjs(startDate);
    const convertedEndDate = dayjs(endDate);
    let dateDifference = convertedEndDate.diff(convertedStartDate, "day");
    const result: Map<string, AnalyticsData<T>> = new Map();
    do {
      const date = convertedStartDate.add(dateDifference, "day").toDate();
      const data = await this.getDataByDate(date);
      result.set(this.toISOStringLocalDate(date), data);
      dateDifference -= 1;
    } while (dateDifference >= 0);
    return result;
  }

  abstract flattenMap(map: Map<string, AnalyticsData<T>>): AnalyticsData<T>;
}

export default BaseSiteDataRepository;
