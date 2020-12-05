import AWS from "aws-sdk";
import _ from "lodash";

// TODO: remove creds
const comprehend = new AWS.Comprehend({
  credentials: {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: "ap-southeast-1",
});

export async function getSentiment(text: string): Promise<number> {
  // const sentimentResult = analyzer.analyze(text);
  // return sentimentResult.comparative as number;
  const result = await comprehend
    .detectSentiment({ LanguageCode: "en", Text: text })
    .promise();
  const positive = _.get(result, "SentimentScore.Positive");
  const negative = _.get(result, "SentimentScore.Negative");
  const score = positive - negative;
  return score;
}
