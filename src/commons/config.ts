const config = {
  authToken: localStorage.getItem("authToken"),
};

export function setConfig(key: keyof typeof config, value: string) {
  localStorage.setItem(key, value);
}
