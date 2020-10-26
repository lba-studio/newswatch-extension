/**
 * computes the color hex based on the passed in ratio (so something like #0101ff)
 * thanks to https://gist.github.com/mlocati/7210513
 * @param ratio a number from -1 to 1
 */
export default function (ratio: number): string {
  const perc = Math.min((ratio + 1) * 50, 100);
  return computeColor(perc);
}

function computeColor(percent: number) {
  let r, g;
  const b = 0;
  if (percent < 50) {
    r = 255;
    g = Math.round(5.1 * percent);
  } else {
    g = 255;
    r = Math.round(510 - 5.1 * percent);
  }
  var h = r * 0x10000 + g * 0x100 + b * 0x1;
  return "#" + ("000000" + h.toString(16)).slice(-6);
}
