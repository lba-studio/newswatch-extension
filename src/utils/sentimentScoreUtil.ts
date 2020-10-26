import { SentimentLikertValue } from "../commons/typedefs";

export function getSentimentScoreLikertValue(
  score: number
): SentimentLikertValue {
  if (score >= 0.5) {
    return SentimentLikertValue.VERY_POSITIVE;
  }
  if (score >= 0.2) {
    return SentimentLikertValue.POSITIVE;
  }
  if (score >= 0.1) {
    return SentimentLikertValue.SLIGHTLY_POSITIVE;
  }
  if (score <= -0.5) {
    return SentimentLikertValue.VERY_NEGATIVE;
  }
  if (score <= -0.2) {
    return SentimentLikertValue.NEGATIVE;
  }
  if (score <= -0.1) {
    return SentimentLikertValue.SLIGHTLY_NEGATIVE;
  }
  return SentimentLikertValue.NEUTRAL;
}
