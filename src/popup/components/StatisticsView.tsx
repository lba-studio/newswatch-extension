import dayjs from "dayjs";
import _ from "lodash";
import React from "react";
import timeSpentRepository, {
  TimeSpentOnSiteData,
} from "../../background/repository/timeSpentRepository";
import Chart from "chart.js";
import { makeStyles } from "@material-ui/core";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);

// color-code pie to determine sentiment
// a pie determines the amount of time spent on a particular site

const shades = ["#25ABE4", "#0E93CC", "#057DB0"];

const useStyles = makeStyles({
  canvasContainer: {
    height: 256,
  },
});

function StatisticsView() {
  const [data, setData] = React.useState<
    Array<{
      key: string;
      value: TimeSpentOnSiteData;
    }>
  >();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const chartRef = React.useRef<Chart | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasErrored, setHasErrored] = React.useState(false);
  const classes = useStyles();
  React.useEffect(() => {
    setIsLoading(true);
    timeSpentRepository
      .getAllDataWithinRangeInclusive(dayjs().subtract(1, "day").toDate())
      .then((res) => {
        const flattenedDataForTimePeriod = timeSpentRepository.flattenMap(res);
        setData(
          Object.keys(flattenedDataForTimePeriod)
            .map((key) => ({
              key: key,
              value: flattenedDataForTimePeriod[key],
            }))
            .sort((a, b) => b.value.timeSpentSecond - a.value.timeSpentSecond)
        );
      })
      .catch((e) => {
        console.error(e);
        setHasErrored(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);
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
      const labels = data.slice(0, 3).map((e) => e.key);
      const values = data.slice(0, 3).map((e) => e.value.timeSpentSecond);
      chartRef.current = new Chart(canvasContext, {
        plugins: [],
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Average sentiment score",
              data: values,
              backgroundColor: (ctx) => shades[ctx.dataIndex!] || "gray",
              borderColor: (ctx) => shades[ctx.dataIndex!] || "gray",
            },
          ],
        },
        options: {
          tooltips: {
            callbacks: {
              label: (tooltipItem, datasets) => {
                const {
                  key,
                  value: { timeSpentSecond },
                } = data[tooltipItem.index!];
                const duration = dayjs.duration(timeSpentSecond, "second");
                const timeLabel = `${duration
                  .hours()
                  .toString()
                  .padStart(2, "0")}:${duration
                  .minutes()
                  .toString()
                  .padStart(2, "0")}:${duration
                  .seconds()
                  .toString()
                  .padStart(2, "0")}`;
                return `${key}: ${timeLabel}`;
              },
              footer: (tooltipItem, datasets) => {
                const { timeSpentSecond } = data[tooltipItem[0].index!].value;
                const duration = dayjs.duration(timeSpentSecond, "second");
                return duration.humanize();
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
    <div className={classes.canvasContainer}>
      <canvas aria-label="graph for website usage" role="img" ref={canvasRef}>
        Score graph goes here. Your browser may not support this functionality.
      </canvas>
    </div>
  );
}

export default StatisticsView;
