import { browser, Tabs } from "webextension-polyfill-ts";
import { TabState } from "../commons/typedefs";

export type StateListener = (state: TabState) => void;

export interface TabData {
  listeners: Set<StateListener>;
  state: TabState;
}

class TabStateManager {
  private stateMap: Map<number, TabData> = new Map();
  constructor() {
    browser.tabs.onRemoved.addListener((tabId) => {
      this.stateMap.delete(tabId);
    });
  }

  private get defaultState(): TabState {
    return {
      contentConfig: {
        highlightSelectedText: false,
      },
    };
  }

  private getTabId(tab: Tabs.Tab): number {
    if (!tab || !tab.id) {
      console.error("Unable to get tab.id for tab.", tab);
      throw new Error("Unable to get tab.id for tab.");
    }
    return tab.id;
  }

  setState(tab: Tabs.Tab, nextState: Partial<TabState>): void {
    const tabId = this.getTabId(tab);
    const tabData: TabData = this.stateMap.get(tabId) || {
      listeners: new Set(),
      state: {
        contentConfig: {
          highlightSelectedText: false,
        },
      },
    };
    tabData.state = { ...tabData.state, ...nextState };
    this.stateMap.set(tabId, { ...tabData, ...nextState });
  }

  getState(tab: Tabs.Tab): TabState {
    const tabId = this.getTabId(tab);
    return this.stateMap.get(tabId)?.state || this.defaultState;
  }

  addListener(tab: Tabs.Tab, listener: StateListener): this {
    const tabData: TabData = this.stateMap.get(this.getTabId(tab)) || {
      listeners: new Set(),
      state: this.defaultState,
    };
    tabData.listeners.add(listener);
    return this;
  }

  removeListener(tab: Tabs.Tab, listener: StateListener): this {
    console.debug("Deleting listener for tab", tab);
    this.stateMap.get(this.getTabId(tab))?.listeners.delete(listener);
    return this;
  }

  commitState(tab: Tabs.Tab): this {
    const tabData = this.stateMap.get(this.getTabId(tab));
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
