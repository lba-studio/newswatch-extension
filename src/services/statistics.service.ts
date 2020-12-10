import { AnalyticsData, StatisticsData } from "../commons/typedefs";
import sentimentSiteDataRepository, {
  SentimentSiteData,
} from "../repositories/sentimentSiteDataRepository";
import timeSpentRepository, {
  TimeSpentOnSiteData,
} from "../repositories/timeSpentRepository";

function toStatisticsData(
  sentimentSiteData: AnalyticsData<SentimentSiteData>,
  timeSpentData: AnalyticsData<TimeSpentOnSiteData>
): Array<StatisticsData> {
  return Object.keys(timeSpentData).map((url) => ({
    url: url,
    timeSpentOnSiteData: timeSpentData[url],
    sentimentScore: sentimentSiteData[url]?.averageSentiment,
  }));
}

async function getStatisticsData(
  startDate = new Date(),
  endDate = new Date()
): Promise<Array<StatisticsData>> {
  const timeSpentData = await timeSpentRepository.getFlattenedDataWithinRangeInclusive(
    startDate,
    endDate
  );
  const sentimentSiteData = await sentimentSiteDataRepository.getFlattenedDataWithinRangeInclusive(
    startDate,
    endDate
  );
  return toStatisticsData(sentimentSiteData, timeSpentData);
}

const statisticsService = {
  getStatisticsData,
};

export default statisticsService;
