function onAction(actionType: string) {
  const key = `ANALYTICS_EVENT_COUNTER_${actionType}`;
  const previousValue = Number(localStorage.getItem(key)) || 0;
  localStorage.setItem(key, (previousValue + 1).toString());
}

export default {
  onAction,
};
