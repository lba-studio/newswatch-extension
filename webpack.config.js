/* eslint-disable */
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const packageJson = require("./package.json");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const GenerateJsonPlugin = require("generate-json-webpack-plugin");
const ExtensionReloader = require("webpack-extension-reloader");
const dotenv = require("dotenv");

dotenv.config();

module.exports = (env, argv) => {
  const plugins = [
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ["!popup.html", "!option.html"],
    }),
    new CopyPlugin({
      patterns: [{ from: "public" }],
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ["popup"],
      filename: "popup.html",
      template: "./src/frontend/index-template.html",
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ["option"],
      filename: "option.html",
      template: "./src/frontend/index-template.html",
    }),
    new GenerateJsonPlugin("manifest.json", {
      name: `Zenti${argv.mode !== "production" ? " LOCALDEV" : ""}`,
      version: packageJson.version,
      manifest_version: 2,
      description:
        "A friendly robot which tells you how consuming a piece of content would make you feel.",
      permissions: ["storage", "contextMenus", "notifications", "alarms"],
      content_scripts: [
        {
          matches: ["<all_urls>"],
          js: ["content.js"],
          run_at: "document_idle",
        },
      ],
      browser_action: {
        default_title: "Zenti",
        default_popup: "popup.html",
      },
      background: {
        scripts: ["background.js"],
      },
      options_ui: {
        page: "option.html",
        browser_style: false,
        open_in_tab: true,
      },

      icons: {
        16: "favicon.png",
        48: "favicon.png",
        128: "favicon.png",
      },
      // persistent: argv.mode !== "production",
    }),
  ];
  if (argv.mode !== "production") {
    plugins.push(
      /* @ts-ignore because the typings are incorrect */
      new ExtensionReloader({
        entries: {
          contentScript: "content",
          background: "background",
          extensionPage: ["popup", "option"],
        },
      })
    );
  }
  const config = {
    mode: "development",
    entry: {
      background: "./src/background/index.ts",
      content: "./src/content/index.tsx",
      popup: "./src/frontend/popup/index.tsx",
      option: "./src/frontend/option/index.tsx",
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    devtool: "inline-source-map",
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: plugins,
    output: {
      filename: "[name].js",
      path: path.resolve(__dirname, "dist"),
    },
  };
  // if (argv.mode === "production") {
  //   config.optimization = {
  //     splitChunks: {
  //       chunks: "all",
  //     },
  //   };
  // }
  return config;
};
