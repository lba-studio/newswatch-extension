import { browser, Runtime, Tabs } from "webextension-polyfill-ts";
import { getSentiment } from "../services/sentiment.service";
import {
  Action,
  ANALYSE_TEXT,
  ANALYSE_TEXT_ERROR,
  GRAB_AND_ANALYSE,
  Heartbeat,
  INIT_ANALYSIS,
  PAGE_HEARTBEAT,
  PUSH_CONTENT_CONFIG,
  STATE_CONNECT,
} from "../commons/messages";
import analytics from "../utils/analytics";
import computeColorHex from "../utils/computeColorHex";
import Color from "color";
import { TabState } from "../commons/typedefs";
import TabStateManager from "./TabStateManager";
import PageHeartbeatManager from "./HeartbeatManager";
import sentimentSiteDataRepository from "../repositories/sentimentSiteDataRepository";

const stateManager = new TabStateManager();
const heartbeatManager = new PageHeartbeatManager();

async function getActiveTabFromBrowserContext(): Promise<Tabs.Tab | undefined> {
  // chrome: returns undefined if you're on the popup context or in the devtool context
  return (
    await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
  )[0];
}
async function getTab(
  sender: { tab?: Tabs.Tab },
  tabFallback?: Tabs.Tab
): Promise<Tabs.Tab | undefined> {
  return sender.tab || (await getActiveTabFromBrowserContext()) || tabFallback;
}

/**
 * @description handler for all messages which operate on the state, or requires StateManager
 */
async function statefulMessageHandler(req: Action, sender: { tab?: Tabs.Tab }) {
  const { payload, type, tabFallback } = req;
  const currentTab = await getTab(sender, tabFallback);
  let isUnknownAction = false;
  if (currentTab?.id) {
    analytics.onAction(type);
    switch (type) {
      case INIT_ANALYSIS:
        await browser.browserAction.setBadgeBackgroundColor({
          color: "#7A7A7A",
          tabId: currentTab.id,
        });
        await browser.browserAction.setBadgeText({
          text: "...",
          tabId: currentTab.id,
        });
        stateManager.setState(currentTab, { lastScore: undefined });
        break;
      case PUSH_CONTENT_CONFIG:
        stateManager.setState(currentTab, { contentConfig: payload });
        break;
      case ANALYSE_TEXT:
        if (payload && typeof payload === "string") {
          try {
            const score = await getSentiment(payload);
            await browser.browserAction.setBadgeBackgroundColor({
              color: Color(computeColorHex(score)).darken(0.5).string(),
              tabId: currentTab.id,
            });
            await browser.browserAction.setBadgeText({
              text: score.toFixed(1),
              tabId: currentTab.id,
            });

            if (currentTab.url) {
              const currentDate = new Date();
              const sentimentSiteData = await sentimentSiteDataRepository.getDataByDate(
                currentDate
              );
              const sentimentSiteDataKey = new URL(currentTab.url).hostname;
              const sentimentSiteForUrl =
                sentimentSiteData[sentimentSiteDataKey];
              let averageSentiment = sentimentSiteForUrl?.averageSentiment;
              averageSentiment = averageSentiment
                ? (averageSentiment + score) / 2
                : score;
              sentimentSiteData[sentimentSiteDataKey] = {
                ...sentimentSiteForUrl,
                ...{
                  averageSentiment,
                },
              };
              await sentimentSiteDataRepository.setDataByDate(
                currentDate,
                sentimentSiteData
              );
            }
            stateManager.setState(currentTab, { lastScore: score });
          } catch (e) {
            console.error(e);
            await browser.browserAction.setBadgeText({
              text: ":/",
              tabId: currentTab.id,
            });
            stateManager.setState(currentTab, {
              lastAction: ANALYSE_TEXT_ERROR,
              lastScore: undefined,
            });

            throw e;
          }
        } else {
          // no payload is passed in due to not meeting the threshold, ignore.
          stateManager.setState(currentTab, { lastScore: undefined });
          await browser.browserAction.setBadgeText({
            text: null,
            tabId: currentTab.id,
          });
        }
        break;
      default:
        console.warn("No tab-handler for action", type, req);
      case GRAB_AND_ANALYSE:
      case PAGE_HEARTBEAT:
        isUnknownAction = true;
        break;
    }
    if (!isUnknownAction) {
      // only commit known actions
      console.debug("currentState", type, currentTab.id, stateManager);
      stateManager.setState(currentTab, { lastAction: type });
      stateManager.commitState(currentTab);
    }
  } else {
    console.warn("Cannot find currentTab or its ID!", currentTab);
  }
}

/**
 * @description used to send/propagate/receive messages from & to content script - stuff that doesn't depend on states
 */
async function commandMessageHandlers(req: Action, sender: { tab?: Tabs.Tab }) {
  const { payload, type, tabFallback } = req;
  const currentTab = await getTab(sender, tabFallback);
  if (!currentTab?.id) {
    throw new Error("Cannot find active tab!");
  }
  switch (type) {
    case GRAB_AND_ANALYSE:
      await browser.tabs.sendMessage(currentTab.id, {
        type: GRAB_AND_ANALYSE,
      });
      break;
    case PAGE_HEARTBEAT:
      const { hostname, firstHeartbeat, path } = payload as Heartbeat;
      if (
        typeof hostname === "string" &&
        typeof firstHeartbeat === "boolean" &&
        typeof path === "string" &&
        sender.tab
      ) {
        heartbeatManager.heartbeat(hostname, sender.tab, path, firstHeartbeat);
      } else {
        console.error(
          `Unknown payload for ${PAGE_HEARTBEAT}, or cannot get sender tab. Skipping.`,
          payload,
          sender
        );
      }
      break;
    default:
      console.warn("No command handler for action type.", type);
    case INIT_ANALYSIS:
    case ANALYSE_TEXT:
    case PUSH_CONTENT_CONFIG:
      break;
  }
}

browser.runtime.onMessage.addListener(statefulMessageHandler);
browser.runtime.onMessage.addListener(commandMessageHandlers);

browser.runtime.onConnect.addListener(async (port) => {
  switch (port.name) {
    case STATE_CONNECT:
      if (port.sender?.id !== browser.runtime.id) {
        throw new Error(
          "Cannot connect from a non-extension context (has to be from an extension component)."
        );
      }
      const senderTab = await getTab(port.sender);
      if (!senderTab) {
        throw new Error("Cannot find senderTab!");
      }
      const stateListener = (state: TabState) => {
        port.postMessage(state);
      };
      stateManager.addListener(senderTab, stateListener);
      stateListener(stateManager.getState(senderTab));
      port.onDisconnect.addListener((disconnectedPort) => {
        console.debug("Disconnected from port", disconnectedPort.sender?.tab);
        stateManager.removeListener(senderTab, stateListener);
      });
      break;
    default:
      break;
  }
});

browser.contextMenus.create({
  title: "Get sentiment score",
  contexts: ["selection"],
  onclick: (info, tab) => {
    // was thinking of chucking in the tab information here, but in order to keep logic
    // consistent, opted to have the main action handlers handle the "which tab is it" question
    if (info.selectionText) {
      statefulMessageHandler({ type: INIT_ANALYSIS }, { tab }).then(
        async () => {
          await statefulMessageHandler(
            { type: ANALYSE_TEXT, payload: info.selectionText },
            { tab }
          );
        }
      );
    }
  },
});
// browser.browserAction.onClicked.addListener((tab, info) => {
//   if (tab.id) {
//     browser.tabs.sendMessage(tab.id, { type: GRAB_AND_ANALYSE });
//   }
// });
