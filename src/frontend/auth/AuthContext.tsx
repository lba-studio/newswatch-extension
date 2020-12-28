import React from "react";
import { browser } from "webextension-polyfill-ts";

const LOGIN_TOKEN_KEY = "LOGIN_TOKEN";

export interface User {
  name: string;
}

export interface ILoginData {
  user: User;
}
export interface ILoginContext {
  loadedData?: ILoginData;
  isLoading: boolean;
  loadToken: (token: string) => void;
}

function stubFn() {
  throw new Error("Function is not implemented in context.");
}

export const AuthContext = React.createContext<ILoginContext>({
  isLoading: true,
  loadToken: stubFn,
});

function parseToken(token?: string): ILoginData | undefined {
  if (!token) {
    return undefined;
  }
  // TODO parse the token
  return {
    user: {
      name: "Benjamin Smith",
    },
  };
}

async function getToken(): Promise<string | undefined> {
  const token = (await browser.storage.local.get(LOGIN_TOKEN_KEY))[
    LOGIN_TOKEN_KEY
  ];
  if (typeof token !== "string") {
    throw new Error("Login token is not of type string.");
  }
  return token;
}

async function setToken(token: string) {
  await browser.storage.local.set({ [LOGIN_TOKEN_KEY]: token });
}

export default function AuthContextProvider({ children }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loginData, setLoginData] = React.useState<ILoginData>();
  React.useEffect(() => {
    getToken().then((token) => {
      setLoginData(parseToken(token));
      setIsLoading(false);
    });
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") {
        return;
      }
      setLoginData(parseToken(changes[LOGIN_TOKEN_KEY].newValue));
    });
  }, []);
  const loadToken = React.useCallback(async (token: string) => {
    await setToken(token);
  }, []);
  return (
    <AuthContext.Provider
      value={{
        isLoading,
        loadedData: loginData,
        loadToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
