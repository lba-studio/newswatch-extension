import dayjs from "dayjs";
import _ from "lodash";
import React from "react";
import timeSpentRepository, {
  TimeSpentOnSiteData,
} from "../../background/repository/timeSpentRepository";
import Chart from "chart.js";
import { makeStyles, Paper, Tab, Tabs, Typography } from "@material-ui/core";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import sentimentSiteDataRepository from "../../background/repository/sentimentSiteDataRepository";
import computeColorHex from "../../utils/computeColorHex";
import { getSentimentScoreLikertValue } from "../../utils/sentimentScoreUtil";
import Color from "color";

dayjs.extend(duration);
dayjs.extend(relativeTime);

// color-code pie to determine sentiment
// a pie determines the amount of time spent on a particular site

const shades = ["#25ABE4", "#0E93CC", "#057DB0"];

const MAX_DATA_SHOWN = 3;

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
  const [searchPeriodDays, setSearchPeriodDays] = React.useState(1);
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
    const canvasContext: CanvasRenderingContext2D = _.invoke(
      canvasRef,
      "current.getContext",
      "2d"
    );
    if (canvasContext) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      console.log(data);
      const labels = data.slice(0, MAX_DATA_SHOWN).map((e) => {
        return e.value.metadata?.prettyName || e.url;
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
        <Tab label="Today" value={1} />
        <Tab label="Past week" value={7} />
        <Tab label="Past month" value={28} />
      </Tabs>
      <div className={classes.canvasContainer}>
        <canvas aria-label="graph for website usage" role="img" ref={canvasRef}>
          Score graph goes here. Your browser may not support this
          functionality.
        </canvas>
      </div>
    </>
  );
}

export default StatisticsView;
