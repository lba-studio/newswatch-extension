import { Tabs } from "webextension-polyfill-ts";

export default function getTabId(tab: Tabs.Tab): number {
  if (!tab || !tab.id) {
    console.error("Unable to get tab.id for tab.", tab);
    throw new Error("Unable to get tab.id for tab.");
  }
  return tab.id;
}
