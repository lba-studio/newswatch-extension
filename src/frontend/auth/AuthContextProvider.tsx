import React from "react";
import authService, { User } from "../../services/auth.service";
import AuthContext from "./AuthContext";

function generateRandomString(crypto: Crypto, length = 16) {
  const codeArray = new Uint32Array(length);
  crypto.getRandomValues(codeArray);
  return Array.from(codeArray, (dec) => dec.toString(16).padStart(2, "0")).join(
    ""
  );
}

async function logout() {
  await authService.removeToken();
}

export default function AuthContextProvider({ children }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loginData, setLoginData] = React.useState<User>();
  React.useEffect(() => {
    authService.getUser().then((user) => {
      setLoginData(user);
      setIsLoading(false);
    });
    authService.onUserChange((user) => setLoginData(user));
  }, []);
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
    if (!isLoading && !loginData) {
      const messageListener = (event: MessageEvent<any>) => {
        const { type, response } = event.data || {};
        if (
          event.origin === authService.loginOrigin &&
          type === "authorization_response"
        ) {
          const { code, state } = response || {};
          if (stateTokenRef.current === state) {
            const codeVerifier = codeVerifierRef.current;
            if (!codeVerifier) {
              console.error(
                "No codeVerifier can be found. Cannot exchange code."
              );
              return;
            }
            authService
              .exchangeCode(code, codeVerifier)
              .then(() => {
                closeChildWindow();
              })
              .catch((e) => console.error(e));
          }
        }
      };
      window.addEventListener("message", messageListener);
      return () => {
        window.removeEventListener("message", messageListener);
      };
    }
  }, [isLoading, loginData]);
  const launchWebAuthFlow = async () => {
    if (!childWindow.current || childWindow.current.closed) {
      const generatedCodeVerifier = generateRandomString(crypto);
      const generatedStateToken = generateRandomString(crypto);
      const currentChildWindow = window.open(
        await authService.getAuthUrl(
          generatedCodeVerifier,
          generatedStateToken
        ),
        undefined,
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
  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user: loginData,
        logout,
        launchWebAuthFlow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
