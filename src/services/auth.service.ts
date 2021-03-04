import axios from "axios";
import { browser } from "webextension-polyfill-ts";

const CLIENT_ID = "ppGn4wahztmqeKLBQd7wVT8UlfUDwW3m";
const LOGIN_TOKEN_KEY = "LOGIN_TOKEN";
const AUTH_DOMAIN = "https://dev-vuys1721.us.auth0.com";
const LOGIN_ORIGIN = "https://login.us.auth0.com";
const TOKEN_URL = `${AUTH_DOMAIN}/oauth/token`;
const authScopes = ["openid", "profile", "email", "offline_access"];
const REFRESH_TOKEN_KEY = "REFRESH_TOKEN";

export interface User {
  name: string;
  expiry: number;
}

async function parseToken(token?: string): Promise<User | undefined> {
  if (!token) {
    return undefined;
  }
  const jwtSections = token.split(".");
  if (jwtSections.length !== 3) {
    console.error("Cannot parse token: malformed jwt.");
    return undefined;
  }
  const [, body] = jwtSections;
  const decodedBody = JSON.parse(atob(body));
  if (decodedBody.aud !== CLIENT_ID) {
    console.error("Cannot parse token: mismatched audience.");
    return undefined;
  }
  const expiry = Number(decodedBody.exp);
  if (new Date().valueOf() / 1000 > expiry) {
    try {
      await refreshAuth();
    } catch (e) {
      console.error(
        "Authentication expired and cannot be renewed. Please sign in again.",
        axios.isAxiosError(e)
          ? `${e.code}: ${JSON.stringify(e.response?.data)}`
          : e
      );
      await removeToken().catch(console.error);
    }
    return undefined;
  }
  return {
    name: decodedBody.name,
    expiry: Number(decodedBody.exp),
  };
}

async function getToken(): Promise<string | undefined> {
  const token = (await browser.storage.local.get(LOGIN_TOKEN_KEY))[
    LOGIN_TOKEN_KEY
  ];
  await parseToken(token);
  return token;
}

async function getUser(): Promise<User | undefined> {
  const token = await getToken();
  if (token && typeof token !== "string") {
    throw new Error("Login token is not of type string.");
  }
  return await parseToken(token);
}

async function setToken(idToken: string, refreshToken: string): Promise<void> {
  await browser.storage.local.set({
    [LOGIN_TOKEN_KEY]: idToken,
    [REFRESH_TOKEN_KEY]: refreshToken,
  });
}

async function removeToken(): Promise<void> {
  await browser.storage.local.remove([LOGIN_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

function onUserChange(handler: (user: User | undefined) => void): void {
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName !== "local") {
      return;
    }
    if (changes[LOGIN_TOKEN_KEY]) {
      handler(await parseToken(changes[LOGIN_TOKEN_KEY]?.newValue));
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

async function exchangeCode(code: string, codeVerifier: string): Promise<void> {
  const resp = await axios
    .post(TOKEN_URL, {
      client_id: CLIENT_ID,
      code: code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: window.location.href,
    })
    .then((response) => response.data);
  const newRefreshToken: string = resp.refresh_token;
  const newIdToken: string = resp.id_token;
  await setToken(newIdToken, newRefreshToken);
}

async function refreshAuth(): Promise<void> {
  const refreshToken = (await browser.storage.local.get(REFRESH_TOKEN_KEY))[
    REFRESH_TOKEN_KEY
  ];
  if (!refreshToken) {
    throw new Error("Cannot refresh auth: no refresh token.");
  }
  const resp = await axios
    .post(TOKEN_URL, {
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    })
    .then((response) => response.data);
  const newRefreshToken: string = resp.refresh_token;
  const newIdToken: string = resp.id_token;
  await setToken(newIdToken, newRefreshToken);
}

const authService = {
  getUser,
  refreshAuth,
  setToken,
  removeToken,
  onUserChange,
  exchangeCode,
  getAuthUrl,
  getToken,
  clientId: CLIENT_ID,
  authDomain: AUTH_DOMAIN,
  loginOrigin: LOGIN_ORIGIN,
};

export default authService;
