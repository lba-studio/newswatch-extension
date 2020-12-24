import dayjs from "dayjs";
import _ from "lodash";
import React from "react";
import Chart from "chart.js";
import { Box, makeStyles, Tab, Tabs, Typography } from "@material-ui/core";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import computeColorHex from "../../utils/computeColorHex";
import { getSentimentScoreLikertValue } from "../../utils/sentimentScoreUtil";
import Color from "color";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeople";
import trimText from "../../utils/trimText";
import { StatisticsData } from "../../commons/typedefs";
import statisticsService from "../../services/statistics.service";

dayjs.extend(duration);
dayjs.extend(relativeTime);

// const shades = ["#25ABE4", "#0E93CC", "#057DB0"];

const MAX_DATA_SHOWN = 3;
const MAX_LABEL_LENGTH = 25;

const useStyles = makeStyles({
  canvasContainer: {
    height: 256,
  },
});

function tooltipSplit(text: string): Array<string> {
  // because chartjs's responsiveness is garbage, so we need manual split
  const maxCharsPerLine = 36;
  const output: Array<string> = [];
  let lineIndex = 0;
  text.split(" ").forEach((token) => {
    let workingToken = token;
    while (workingToken.length) {
      const trimmedToken = workingToken.slice(0, maxCharsPerLine);
      if (
        output[lineIndex]?.length &&
        trimmedToken.length + output[lineIndex].length > maxCharsPerLine
      ) {
        // new line
        lineIndex += 1;
      }
      output[lineIndex] = [output[lineIndex], trimmedToken]
        .filter(Boolean)
        .join(" ");
      workingToken = workingToken.slice(maxCharsPerLine);
    }
  });
  return output;
}

function StatisticsView() {
  const [data, setData] = React.useState<Array<StatisticsData>>();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const [, setIsLoading] = React.useState(true);
  const [, setHasErrored] = React.useState(false);
  const [searchPeriodDays, setSearchPeriodDays] = React.useState(0);
  const classes = useStyles();
  function getColor(ctx: Parameters<Chart.Scriptable<any>>[0]): string {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    const dataIndex = ctx.dataIndex!;
    const score = data?.[dataIndex].sentimentScore;
    const color = score ? computeColorHex(score) : "gray";
    return Color(color)
      .darken(dataIndex / 10)
      .hex()
      .toString();
  }
  React.useEffect(() => {
    setIsLoading(true);
    statisticsService
      .getStatisticsData(dayjs().subtract(searchPeriodDays, "day").toDate())
      .then(async (res) => {
        const data = res.sort(
          (a, b) =>
            b.timeSpentOnSiteData.timeSpentSecond -
            a.timeSpentOnSiteData.timeSpentSecond
        );
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
        const prettyName = e.timeSpentOnSiteData.metadata?.prettyName;
        return prettyName ? trimText(prettyName, MAX_LABEL_LENGTH) : e.url;
      });
      const values = data
        .slice(0, MAX_DATA_SHOWN)
        .map((e) => e.timeSpentOnSiteData.timeSpentSecond);
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
                  timeSpentOnSiteData: { metadata },
                  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
                } = data[tooltipItem[0].index!];
                return tooltipSplit(`${metadata?.prettyName || url}`);
              },
              label: (tooltipItem) => {
                const {
                  url,
                  timeSpentOnSiteData: { timeSpentSecond },
                  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
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
              footer: (tooltipItem) => {
                const {
                  timeSpentOnSiteData: { timeSpentSecond },
                  sentimentScore,
                  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
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
