export enum SentimentLikertValue {
  POSITIVE = "Positive",
  VERY_POSITIVE = "Very Positive",
  SLIGHTLY_POSITIVE = "Slightly Positive",
  VERY_NEGATIVE = "Very Negative",
  NEGATIVE = "Negative",
  SLIGHTLY_NEGATIVE = "Slightly Negative",
  NEUTRAL = "Neutral",
}

export interface TabState {
  lastAction?: string;
  lastScore?: number;
  contentConfig: ContentConfig;
}

export interface ContentConfig {
  highlightSelectedText: boolean;
}

export interface AnalyticsData<T> {
  [url: string]: T;
}

