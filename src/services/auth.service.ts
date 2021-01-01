import axios from "axios";
import { browser } from "webextension-polyfill-ts";

const CLIENT_ID = "ppGn4wahztmqeKLBQd7wVT8UlfUDwW3m";
const LOGIN_TOKEN_KEY = "LOGIN_TOKEN";
const AUTH_DOMAIN = "https://dev-vuys1721.us.auth0.com";
const LOGIN_ORIGIN = "https://login.us.auth0.com";
const authScopes = ["openid", "profile", "email"];

export interface User {
  name: string;
}

function parseToken(
  token?: string,
  onError: () => void = console.error
): User | undefined {
  if (!token) {
    return undefined;
  }
  const jwtSections = token.split(".");
  if (jwtSections.length !== 3) {
    console.error("ERROR: Malformed JWT. Revoking.");
    onError();
    return undefined;
  }
  const [, body] = jwtSections;
  const decodedBody = JSON.parse(atob(body));
  const currentDate = new Date();
  if (currentDate.valueOf() / 1000 > Number(decodedBody.exp)) {
    console.error("Authentication expired. Please sign in again.");
    onError();
    return undefined;
  }
  if (decodedBody.aud !== CLIENT_ID) {
    onError();
    return undefined;
  }
  return {
    name: decodedBody.name,
  };
}

async function getToken(): Promise<string | undefined> {
  const token = (await browser.storage.local.get(LOGIN_TOKEN_KEY))[
    LOGIN_TOKEN_KEY
  ];
  if (token && typeof token !== "string") {
    throw new Error("Login token is not of type string.");
  }
  return token;
}

async function setToken(token: string): Promise<void> {
  await browser.storage.local.set({ [LOGIN_TOKEN_KEY]: token });
}

async function removeToken(): Promise<void> {
  await browser.storage.local.remove(LOGIN_TOKEN_KEY);
}

function onUserChange(handler: (user: User | undefined) => void): void {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    if (changes[LOGIN_TOKEN_KEY]) {
      handler(parseToken(changes[LOGIN_TOKEN_KEY]?.newValue));
    }
  });
}

async function getCodeChallenge(codeVerifier: string) {
  const msgBuffer = new TextEncoder().encode(codeVerifier);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
  return btoa(
    String.fromCharCode.apply(null, Array.from(new Uint8Array(hashBuffer)))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAuthUrl(
  codeVerifier: string,
  stateToken: string
): Promise<string> {
  const codeChallenge = await getCodeChallenge(codeVerifier);
  const authUrlSearchParams = new URLSearchParams({
    response_type: "code",
    redirect_uri: window.location.href,
    scope: authScopes.join(" "),
    client_id: authService.clientId,
    prompt: "login",
    code_challenge: codeChallenge,
    state: stateToken,
    response_mode: "web_message",
    code_challenge_method: "S256",
  });
  const authUrl = `${AUTH_DOMAIN}/authorize?${authUrlSearchParams.toString()}`;
  return authUrl;
}

async function exchangeCode(
  code: string,
  codeVerifier: string
): Promise<string> {
  return axios
    .post(`${AUTH_DOMAIN}/oauth/token`, {
      client_id: CLIENT_ID,
      code: code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: window.location.href,
    })
    .then((response) => response.data.id_token);
}

const authService = {
  parseToken,
  getToken,
  setToken,
  removeToken,
  onUserChange,
  exchangeCode,
  getAuthUrl,
  clientId: CLIENT_ID,
  authDomain: AUTH_DOMAIN,
  loginOrigin: LOGIN_ORIGIN,
};

export default authService;
