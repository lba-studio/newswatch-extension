import React from "react";
import { SentimentLikertValue } from "../../commons/typedefs";
import SentimentSatisfiedIcon from "@material-ui/icons/SentimentSatisfied";
import SentimentDissatisfiedIcon from "@material-ui/icons/SentimentDissatisfied";
import SentimentVeryDissatisfiedIcon from "@material-ui/icons/SentimentVeryDissatisfied";
import SentimentVerySatisfiedIcon from "@material-ui/icons/SentimentVerySatisfied";
import SvgIcon from "@material-ui/icons/SentimentSatisfied";
import { makeStyles } from "@material-ui/core";
import { getSentimentScoreLikertValue } from "../../utils/sentimentScoreUtil";

interface SentimentIconProps {
  score: number;
}

const useStyles = makeStyles({
  sentimentIcon: {
    fontSize: "2rem",
    textAlign: "center",
  },
});

function SentimentIcon(
  props: SentimentIconProps & React.ComponentProps<typeof SvgIcon>
) {
  const { score, className: propClassName, ...restOfProps } = props;
  const likertValue = getSentimentScoreLikertValue(score);
  const classes = useStyles();
  const iconProps: React.ComponentProps<typeof SvgIcon> = {
    className: classes.sentimentIcon + " " + propClassName,
    ...restOfProps,
  };
  switch (likertValue) {
    case SentimentLikertValue.NEUTRAL:
      return <SentimentSatisfiedIcon {...iconProps} />;
    case SentimentLikertValue.POSITIVE:
      return <SentimentSatisfiedIcon {...iconProps} />;
    case SentimentLikertValue.NEGATIVE:
      return <SentimentDissatisfiedIcon {...iconProps} />;
    case SentimentLikertValue.VERY_POSITIVE:
      return <SentimentVerySatisfiedIcon {...iconProps} />;
    case SentimentLikertValue.VERY_NEGATIVE:
      return <SentimentVeryDissatisfiedIcon {...iconProps} />;
    case SentimentLikertValue.SLIGHTLY_NEGATIVE:
      return <SentimentDissatisfiedIcon {...iconProps} />;
    case SentimentLikertValue.SLIGHTLY_POSITIVE:
      return <SentimentSatisfiedIcon {...iconProps} />;
  }
}

export default SentimentIcon;
