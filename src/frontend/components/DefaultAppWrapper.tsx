import { CssBaseline, MuiThemeProvider } from "@material-ui/core";
import React from "react";
import ConfigContext, { globalTabFallbackPromise } from "../ConfigContext";
import { appTheme } from "../styles";

interface DefaultAppWrapperProps {
  children: React.ReactNode;
}

function DefaultAppWrapper(props: DefaultAppWrapperProps) {
  const { children } = props;
  return (
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
  );
}

export default DefaultAppWrapper;
