import { AnalyticsData } from "../../commons/typedefs";
import BaseSiteDataRepository from "./BaseSiteDataRepository";

const TIME_SPENT_DATA_KEY = "TIME_SPENT_ON_SITE";

export interface TimeSpentOnSiteData {
  prettyName?: string;
  timeSpentSecond: number; // in seconds
}

class TimeSpentRepository extends BaseSiteDataRepository<TimeSpentOnSiteData> {
  constructor() {
    super(TIME_SPENT_DATA_KEY);
  }

  flattenMap(
    map: Map<string, AnalyticsData<Partial<TimeSpentOnSiteData>>>
  ): AnalyticsData<TimeSpentOnSiteData> {
    let combinedValue: AnalyticsData<TimeSpentOnSiteData> = {};
    map.forEach((dateEntry) => {
      Object.keys(dateEntry).forEach((url) => {
        if (!combinedValue[url]) {
          combinedValue[url] = {
            timeSpentSecond: 0,
          };
        }
        combinedValue[url].timeSpentSecond =
          (dateEntry[url]?.timeSpentSecond || 0) +
          (combinedValue[url]?.timeSpentSecond || 0);
      });
    });
    return combinedValue;
  }
}

const timeSpentRepository = new TimeSpentRepository();

export default timeSpentRepository;
