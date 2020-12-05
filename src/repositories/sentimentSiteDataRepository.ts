import { AnalyticsData } from "../commons/typedefs";
import BaseSiteDataRepository from "./BaseSiteDataRepository";

const AVERAGE_SENTIMENT_DATA_KEY = "AVERAGE_SENTIMENT_ON_SITE";

export interface SentimentSiteData {
  averageSentiment: number;
}

class SentimentSiteDataRepository extends BaseSiteDataRepository<
  SentimentSiteData
> {
  constructor() {
    super(AVERAGE_SENTIMENT_DATA_KEY);
  }

  flattenMap(
    map: Map<string, AnalyticsData<SentimentSiteData>>
  ): AnalyticsData<SentimentSiteData> {
    let combinedValue: AnalyticsData<SentimentSiteData> = {};
    map.forEach((dateEntry) => {
      Object.keys(dateEntry).forEach((url) => {
        if (!combinedValue[url]) {
          combinedValue[url] = dateEntry[url];
        } else if (dateEntry[url]?.averageSentiment) {
          combinedValue[url].averageSentiment =
            (combinedValue[url].averageSentiment +
              dateEntry[url].averageSentiment) /
            2;
        }
      });
    });
    return combinedValue;
  }
}

const sentimentSiteDataRepository = new SentimentSiteDataRepository();

export default sentimentSiteDataRepository;
