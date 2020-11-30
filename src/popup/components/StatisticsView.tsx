import dayjs from "dayjs";
import _ from "lodash";
import React from "react";
import timeSpentRepository, {
  TimeSpentOnSiteData,
} from "../../background/repository/timeSpentRepository";
import Chart from "chart.js";
import {
  Box,
  makeStyles,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@material-ui/core";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import sentimentSiteDataRepository from "../../background/repository/sentimentSiteDataRepository";
import computeColorHex from "../../utils/computeColorHex";
import { getSentimentScoreLikertValue } from "../../utils/sentimentScoreUtil";
import Color from "color";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeople";

dayjs.extend(duration);
dayjs.extend(relativeTime);

// color-code pie to determine sentiment
// a pie determines the amount of time spent on a particular site

const shades = ["#25ABE4", "#0E93CC", "#057DB0"];

const MAX_DATA_SHOWN = 3;
const MAX_LABEL_LENGTH = 16;

const useStyles = makeStyles({
  canvasContainer: {
    height: 256,
  },
});

interface StatisticsData {
  url: string;
  value: TimeSpentOnSiteData;
  sentimentScore: number;
}

function StatisticsView() {
  const [data, setData] = React.useState<Array<StatisticsData>>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasErrored, setHasErrored] = React.useState(false);
  const [searchPeriodDays, setSearchPeriodDays] = React.useState(0);
  const classes = useStyles();
  function getColor(ctx: Parameters<Chart.Scriptable<any>>[0]): string {
    const score = data?.[ctx.dataIndex!].sentimentScore;
    const color = score ? computeColorHex(score) : "gray";
    return Color(color)
      .darken(ctx.dataIndex! / 10)
      .hex()
      .toString();
  }
  React.useEffect(() => {
    setIsLoading(true);
    timeSpentRepository
      .getAllDataWithinRangeInclusive(
        dayjs().subtract(searchPeriodDays, "day").toDate()
      )
      .then(async (res) => {
        console.log(res);
        const flattenedDataForTimePeriod = timeSpentRepository.flattenMap(res);
        const sentimentSiteData = await sentimentSiteDataRepository
          .getAllDataWithinRangeInclusive(
            dayjs().subtract(searchPeriodDays, "day").toDate()
          )
          .then((e) => sentimentSiteDataRepository.flattenMap(e));
        const data: Array<StatisticsData> = Object.keys(
          flattenedDataForTimePeriod
        )
          .map((url) => ({
            url: url,
            value: flattenedDataForTimePeriod[url],
            sentimentScore: sentimentSiteData[url]?.averageSentiment,
          }))
          .sort((a, b) => b.value.timeSpentSecond - a.value.timeSpentSecond);

        setData(data);
      })
      .catch((e) => {
        console.error(e);
        setHasErrored(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchPeriodDays]);
  React.useEffect(() => {
    if (!data) {
      return;
    }
    console.log(data);
    const canvasContext: CanvasRenderingContext2D = _.invoke(
      canvasRef,
      "current.getContext",
      "2d"
    );
    if (canvasContext) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      const labels = data.slice(0, MAX_DATA_SHOWN).map((e) => {
        return e.value.metadata?.prettyName.slice(0, MAX_LABEL_LENGTH) || e.url;
      });
      const values = data
        .slice(0, MAX_DATA_SHOWN)
        .map((e) => e.value.timeSpentSecond);
      chartRef.current = new Chart(canvasContext, {
        plugins: [],
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Average sentiment score",
              data: values,
              backgroundColor: getColor,
              borderColor: getColor,
            },
          ],
        },
        options: {
          tooltips: {
            callbacks: {
              title: (tooltipItem) => {
                const {
                  url,
                  value: { metadata },
                } = data[tooltipItem[0].index!];
                return `${
                  metadata?.prettyName.slice(0, MAX_LABEL_LENGTH) || url
                }`;
              },
              label: (tooltipItem, datasets) => {
                const {
                  url,
                  value: { timeSpentSecond },
                } = data[tooltipItem.index!];
                const duration = dayjs.duration(timeSpentSecond, "second");
                const timeLabel = `${duration
                  .asHours()
                  .toFixed(0)
                  .padStart(2, "0")}:${duration
                  .minutes()
                  .toString()
                  .padStart(2, "0")}:${duration
                  .seconds()
                  .toString()
                  .padStart(2, "0")}`;
                return `${url}: ${timeLabel}`;
              },
              footer: (tooltipItem, datasets) => {
                const {
                  value: { timeSpentSecond },
                  sentimentScore,
                } = data[tooltipItem[0].index!];
                const duration = dayjs.duration(timeSpentSecond, "second");
                const durationString = duration.humanize();
                return `${
                  durationString[0].toUpperCase() + durationString.slice(1)
                }. ${
                  sentimentScore
                    ? `Content is usually ${getSentimentScoreLikertValue(
                        sentimentScore
                      ).toString()}.`
                    : ""
                }`;
              },
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          legend: {
            labels: {
              fontColor: "white",
            },
          },
        },
      });
    }
  }, [data]);
  return (
    <>
      {data?.length ? (
        <>
          <Typography align="center" variant="h2" gutterBottom>
            Time Spent on Site
          </Typography>
          <Tabs
            value={searchPeriodDays}
            onChange={(e, val) => setSearchPeriodDays(val)}
            variant="fullWidth"
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Today" value={0} />
            <Tab label="Past week" value={6} />
            <Tab label="Past month" value={27} />
          </Tabs>
          <div className={classes.canvasContainer}>
            <canvas
              aria-label="graph for website usage"
              role="img"
              ref={canvasRef}
            >
              Score graph goes here. Your browser may not support this
              functionality.
            </canvas>
          </div>
        </>
      ) : (
        <Box display="flex" flexDirection="column" alignItems="center">
          <EmojiPeopleIcon color="primary" fontSize="large" />
          <Typography align="center">
            There seems to be nothing here... Check back later!
          </Typography>
        </Box>
      )}
    </>
  );
}

export default StatisticsView;
