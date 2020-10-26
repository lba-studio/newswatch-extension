import React from "react";
import { browser, Tabs } from "webextension-polyfill-ts";
import { ContentConfig } from "../commons/typedefs";

export interface IConfigContext {
  tabFallback: Promise<Tabs.Tab | undefined>;
}

const ConfigContext = React.createContext<IConfigContext>({
  /**
   * because if the popup is interacted with, the browser API
   * might think that the current active "tab/window" is the popup.
   * this prevents that confusion by storing this info at the
   * earliest time the popup is opened
   */
  tabFallback: browser.tabs
    .query({ active: true, currentWindow: true })
    .then((e) => e[0]),
});

export default ConfigContext;
