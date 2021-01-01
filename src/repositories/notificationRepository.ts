import { browser } from "webextension-polyfill-ts";

const STORAGE_KEY = "NOTIFICATION";

export interface Notification {
  message: string;
  timestamp: number;
}

async function getNotifications(): Promise<Array<Notification>> {
  const result = (await browser.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  return result || [];
}

async function addNotification(notification: Notification): Promise<void> {
  const notifications: Array<Notification> = await getNotifications();
  notifications.push(notification);
  await browser.storage.local.set({
    [STORAGE_KEY]: notifications,
  });
  await browser.notifications.create({
    type: "basic",
    title: "New message from Zenti",
    message: notification.message,
    iconUrl: "favicon.png",
  });
}

async function removeNotification(timestamp: number): Promise<void> {
  const notifications = await getNotifications();
  const notificationToDeleteIndex = notifications.findIndex(
    (e) => e.timestamp === timestamp
  );
  if (notificationToDeleteIndex > -1) {
    notifications.splice(notificationToDeleteIndex, 1);
  }
  return await browser.storage.local.set({ [STORAGE_KEY]: notifications });
}

function subscribe(
  handler: (notifications: Array<Notification>) => void
): void {
  getNotifications().then(handler);
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    if (changes[STORAGE_KEY]) {
      handler(changes[STORAGE_KEY].newValue);
    }
  });
}

const notificationRepository = {
  getNotifications,
  addNotification,
  subscribe,
  removeNotification,
  // unsubscribe - to implement later in case there are mem leaks
};

export default notificationRepository;
