import { CssBaseline, MuiThemeProvider } from "@material-ui/core";
import React from "react";
import ConfigContext, { globalTabFallbackPromise } from "./ConfigContext";
import { appTheme } from "../../commons/styles";
import AuthContextProvider from "../auth/AuthContextProvider";

interface DefaultAppWrapperProps {
  children: React.ReactNode;
}

function DefaultAppWrapper(props: DefaultAppWrapperProps) {
  const { children } = props;
  return (
    <AuthContextProvider>
      <MuiThemeProvider theme={appTheme}>
        <CssBaseline>
          <ConfigContext.Provider
            value={{
              tabFallback: globalTabFallbackPromise,
            }}
          >
            {children}
          </ConfigContext.Provider>
        </CssBaseline>
      </MuiThemeProvider>
    </AuthContextProvider>
  );
}

export default DefaultAppWrapper;
