import { AnalyticsData } from "../commons/typedefs";
import BaseSiteDataRepository from "./BaseSiteDataRepository";

const TIME_SPENT_DATA_KEY = "TIME_SPENT_ON_SITE";

export interface TimeSpentOnSiteData {
  metadata?: {
    prettyName: string;
    sourcePath: string;
  };
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
    let highestKey: string; // used for sorting metadata
    map.forEach((dateEntry, key) => {
      const isDataNewer = !highestKey || key > highestKey;
      if (isDataNewer) {
        highestKey = key;
      }
      Object.keys(dateEntry).forEach((url) => {
        if (!combinedValue[url]) {
          combinedValue[url] = {
            timeSpentSecond: 0,
          };
        }
        combinedValue[url].timeSpentSecond =
          (dateEntry[url]?.timeSpentSecond || 0) +
          (combinedValue[url]?.timeSpentSecond || 0);
        if (isDataNewer) {
          combinedValue[url].metadata =
            dateEntry[url]?.metadata || combinedValue[url].metadata;
        }
      });
    });
    return combinedValue;
  }
}

const timeSpentRepository = new TimeSpentRepository();

export default timeSpentRepository;
