import { browser } from "webextension-polyfill-ts";

const KEY_SUFFIX = "ANALYTICS_RECORD_";

interface SiteAnalyticsData {
  visitNumber: number;
  averageScore?: number;
}

interface AnalyticsData {
  [url: string]: SiteAnalyticsData;
}

async function recordSiteVisit(siteUrl: string, score?: number) {
  const key = KEY_SUFFIX + "SITE_VISIT";
  const savedAnalyticsData: AnalyticsData = await browser.storage.local.get(
    key
  );
  const siteAnalyticsData: SiteAnalyticsData = savedAnalyticsData[siteUrl] || {
    visitNumber: 0,
  };
  siteAnalyticsData.visitNumber += 1;
  if (score) {
    siteAnalyticsData.averageScore = siteAnalyticsData.averageScore
      ? (siteAnalyticsData.averageScore + score) / 2
      : score;
  }
  savedAnalyticsData[siteUrl] = siteAnalyticsData;
  await browser.storage.local.set({ [key]: savedAnalyticsData });
}

export default {
  recordSiteVisit,
};
