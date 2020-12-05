import { browser } from "webextension-polyfill-ts";

const STORAGE_KEY = "NOTIFICATION";

export interface Notification {
  message: string;
}

async function getNotifications(): Promise<Array<Notification>> {
  const result = (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  return result || [];
}

async function addNotifications(notification: Notification): Promise<void> {
  const notifications: Array<Notification> = await getNotifications();
  notifications.push(notification);
  await browser.storage.local.set({
    [STORAGE_KEY]: notifications,
  });
}

function subscribe(
  handler: (notifications: Array<Notification>) => void
): void {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    handler(changes[STORAGE_KEY].newValue);
  });
}

const notificationRepository = {
  getNotifications,
  addNotifications,
  subscribe,
  // unsubscribe - to implement later in case there are mem leaks
};

export default notificationRepository;
