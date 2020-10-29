import Color from "color";
import { browser } from "webextension-polyfill-ts";
import {
  ANALYSE_TEXT,
  GRAB_AND_ANALYSE,
  INIT_ANALYSIS,
  PUSH_CONTENT_CONFIG,
  STATE_CONNECT,
} from "../commons/messages";
import { ContentConfig, TabState } from "../commons/typedefs";
import getMainTextBody, { ElementText } from "../utils/browser/getMainTextBody";
import computeColorHex from "../utils/computeColorHex";
import StatisticsManager from "./StatisticsManager";

const MIN_LENGTH = 1000;
const statisticsManager = new StatisticsManager();

statisticsManager.start();

// listen to config changes
let config: ContentConfig = {
  highlightSelectedText: false,
};
let originalBackgroundColorMap: Map<HTMLElement, Color> = new Map();

const statePort = browser.runtime.connect(undefined, {
  name: STATE_CONNECT,
});
statePort.onMessage.addListener((state: TabState) => {
  switch (state.lastAction) {
    case PUSH_CONTENT_CONFIG:
      console.debug("New config", state.contentConfig);
      config = Object.assign(config, state.contentConfig);
      break;
    default:
      break;
  }
  const score = state.lastScore;
  if (score) {
    const scoreColor = Color(computeColorHex(score));
    lastAnalyzed?.analyzedElements.elements.forEach((e) => {
      const currentBackgroundColor = Color(
        window.getComputedStyle(e).backgroundColor
      );
      const originalBackgroundColor =
        originalBackgroundColorMap.get(e) ||
        (originalBackgroundColorMap.set(e, currentBackgroundColor) &&
          currentBackgroundColor);
      if (state.contentConfig.highlightSelectedText) {
        e.style.backgroundColor = originalBackgroundColor.isLight()
          ? scoreColor.lighten(0.5).string()
          : scoreColor.darken(0.5).string();
      } else {
        e.style.backgroundColor = originalBackgroundColor.string();
        originalBackgroundColorMap.delete(e);
      }
    });
  }
});

statePort.onDisconnect.addListener((...args) => {
  console.error("Disconnected from statePort prematurely!", args);
});

analysePage();

function monkeyPatchUrlHistoryToDetectUrlChanges() {
  // detect url changes - https://stackoverflow.com/a/41825103 & https://stackoverflow.com/a/44819548
  let lastUrl = location.href;
  const { pushState, replaceState } = history;
  history.pushState = (...args) => {
    console.log("Monkeypatched pushState");
    pushState.apply(history, args);
    window.dispatchEvent(new Event("popstate"));
  };
  history.replaceState = (...args) => {
    console.log("Monkeypatched replaceState");
    replaceState.apply(history, args);
    window.dispatchEvent(new Event("popstate"));
  };
  window.addEventListener("popstate", (e) => {
    console.log(e);
    analysePage();
  });
  // https://stackoverflow.com/a/44819548
  document.body.addEventListener("click", () => {
    requestAnimationFrame(() => {
      if (lastUrl !== location.href) {
        lastUrl = location.href;
        analysePage();
      }
    });
  });
}

monkeyPatchUrlHistoryToDetectUrlChanges();

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (sender.tab) {
    return;
  } else {
    const { type, payload } = message;
    switch (type) {
      case GRAB_AND_ANALYSE:
        await analysePage();
        break;
    }
  }
});

let lastAnalyzed: { analyzedElements: ElementText } | undefined;

async function analysePage() {
  console.log("Analyzing page...");
  await browser.runtime.sendMessage({ type: INIT_ANALYSIS });
  return new Promise((res, rej) =>
    setTimeout(() => {
      const result = getMainTextBody();
      const innerText = result.cleanText.slice(0, 4000);
      console.log(innerText);
      let payload: string | undefined = innerText;
      if (innerText.length < MIN_LENGTH) {
        console.debug(
          "Skipping analysing text due to innerText length being lower than threshold.",
          innerText.length,
          MIN_LENGTH
        );
        payload = undefined;
      }
      browser.runtime
        .sendMessage({ type: ANALYSE_TEXT, payload })
        .then(() => {
          lastAnalyzed = {
            analyzedElements: result,
          };
          res();
        })
        .catch(rej);
    }, 3000)
  );
}
