function onAction(actionType: string): void {
  const key = `ANALYTICS_EVENT_COUNTER_${actionType}`;
  const previousValue = Number(localStorage.getItem(key)) || 0;
  localStorage.setItem(key, (previousValue + 1).toString());
}

export default {
  onAction,
};
