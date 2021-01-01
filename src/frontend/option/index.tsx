import React from "react";
import ReactDOM from "react-dom";
import DefaultAppWrapper from "../components/DefaultAppWrapper";
import App from "./App";

ReactDOM.render(
  <DefaultAppWrapper>
    <App />
  </DefaultAppWrapper>,
  document.getElementById("root")
);
