import axios from "axios";
import React from "react";
import { AuthContext, ILoginContext } from "./AuthContext";

const authScopes = ["openid", "profile", "email"];

const AUTH_DOMAIN = "https://dev-vuys1721.us.auth0.com";
const CLIENT_ID = "pGn4wahztmqeKLBQd7wVT8UlfUDwW3m";

async function getCodeChallenge(codeVerifier: string) {
  const msgBuffer = new TextEncoder().encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => ("00" + b.toString(16)).slice(-2))
    .join("");
  return hashHex;
}

async function getAuthUrl(codeVerifier: string, stateToken: string) {
  const authUrlSearchParams = new URLSearchParams({
    response_type: "code",
    redirect_uri: window.location.href,
    scope: authScopes.join(" "),
    client_id: "pGn4wahztmqeKLBQd7wVT8UlfUDwW3m",
    prompt: "login",
    code_challenge: await getCodeChallenge(codeVerifier),
    state: stateToken,
  });
  const authUrl = `${AUTH_DOMAIN}/authorize?${authUrlSearchParams.toString()}`;
  return authUrl;
}

interface AuthHookData extends ILoginContext {
  launchWebAuthFlow: () => void;
}

function generateRandomString(crypto: Crypto, length = 16) {
  const codeArray = new Uint32Array(length);
  crypto.getRandomValues(codeArray);
  return Array.from(codeArray, (dec) => dec.toString(16).padStart(2, "0")).join(
    ""
  );
}

function useAuth(): AuthHookData {
  const authContext = React.useContext(AuthContext);
  const childWindow = React.useRef<Window | null>(null);
  const closeChildWindow = () => {
    if (childWindow.current) {
      childWindow.current.close();
      childWindow.current = null;
    }
  };
  const codeVerifierRef = React.useRef<string>();
  const stateTokenRef = React.useRef<string>();
  React.useEffect(() => {
    const messageListener = (event: MessageEvent<any>) => {
      const { type, response } = event.data || {};
      if (
        event.origin === "https://login.us.auth0.com/" &&
        type === "authorization_response"
      ) {
        const { code, state } = response || {};

        if (stateTokenRef.current === state) {
          // do things with the code
          axios
            .post(`${AUTH_DOMAIN}/oauth/token`, {
              client_id: CLIENT_ID,
              code: code,
              code_verifier: codeVerifierRef.current,
              grant_type: "authorization_code",
              redirect_uri: window.location.href,
            })
            .then(async (response) => {
              authContext.loadToken(response.data.idToken);
              closeChildWindow();
            });
        }
      }
    };
    if (!authContext.isLoading && !authContext.loadedData?.user) {
      window.addEventListener("message", messageListener);
    }
    return () => {
      closeChildWindow();
      window.removeEventListener("message", messageListener);
    };
  }, [authContext]);
  const launchWebAuthFlow = async () => {
    if (!childWindow.current || childWindow.current.closed) {
      const generatedCodeVerifier = generateRandomString(crypto);
      const generatedStateToken = generateRandomString(crypto);
      const currentChildWindow = window.open(
        await getAuthUrl(generatedCodeVerifier, generatedStateToken),
        "authPopup-auth0",
        "toolbar=no,location=yes,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,copyhistory=no,width=599,height=600,top=240,left=660.5"
      );
      if (!currentChildWindow) {
        throw new Error("Unable to open new window through window.open.");
      }
      codeVerifierRef.current = generatedCodeVerifier;
      stateTokenRef.current = generatedStateToken;
      childWindow.current = currentChildWindow;
      currentChildWindow.focus();
    }
  };
  return {
    ...authContext,
    launchWebAuthFlow,
  };
}

export default useAuth;
