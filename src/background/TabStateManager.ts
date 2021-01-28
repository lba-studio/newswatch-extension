import { browser, Tabs } from "webextension-polyfill-ts";
import { TabState } from "../commons/typedefs";
import getTabId from "./utils/getTabId";

export type StateListener = (state: TabState) => void;

export interface TabData {
  listeners: Set<StateListener>;
  state: TabState;
}

function getInitialState(): TabState {
  return {
    contentConfig: {
      highlightSelectedText: false,
    },
  };
}

class TabStateManager {
  private readonly stateMap: Map<number, TabData>;

  constructor() {
    this.stateMap = new Map();
    browser.tabs.onRemoved.addListener((tabId) => {
      this.stateMap.delete(tabId);
    });
  }

  setState(tab: Tabs.Tab, nextState: Partial<TabState>): void {
    const tabId = getTabId(tab);
    const tabData: TabData = this.stateMap.get(tabId) || {
      listeners: new Set(),
      state: getInitialState(),
    };
    tabData.state = { ...tabData.state, ...nextState };
    this.stateMap.set(tabId, { ...tabData, ...nextState });
  }

  getState(tab: Tabs.Tab): TabState {
    const tabId = getTabId(tab);
    return this.stateMap.get(tabId)?.state || getInitialState();
  }

  addListener(tab: Tabs.Tab, listener: StateListener): this {
    const tabData: TabData = this.stateMap.get(getTabId(tab)) || {
      listeners: new Set(),
      state: getInitialState(),
    };
    tabData.listeners.add(listener);
    return this;
  }

  removeListener(tab: Tabs.Tab, listener: StateListener): this {
    console.debug("Deleting listener for tab", tab);
    this.stateMap.get(getTabId(tab))?.listeners.delete(listener);
    return this;
  }

  notifyListeners(tab: Tabs.Tab): this {
    const tabData = this.stateMap.get(getTabId(tab));
    if (!tabData) {
      console.error(
        `Cannot commit state of missing tab data of tab ID ${tab.id}.`,
        tab
      );
      return this;
    }
    tabData.listeners.forEach((listener) => listener(tabData.state));
    return this;
  }
}

export default TabStateManager;
