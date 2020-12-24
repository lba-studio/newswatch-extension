import { Auth0Provider } from "@auth0/auth0-react";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

ReactDOM.render(
  <Auth0Provider
    domain="dev-vuys1721.auth0.com"
    clientId="ZCsxjjGMwqlv8thKhrcLYk8283e5GXFr"
  >
    <App />
  </Auth0Provider>,
  document.getElementById("root")
);
