const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./script.js",
  output: {
    filename: "script.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "*.html", context: __dirname, noErrorOnMissing: true },
        { from: "*.css", context: __dirname, noErrorOnMissing: true },
        { from: "*.webp", context: __dirname, noErrorOnMissing: true },
        { from: "*.png", context: __dirname, noErrorOnMissing: true },
        { from: "*.jpg", context: __dirname, noErrorOnMissing: true },
        { from: "*.jpeg", context: __dirname, noErrorOnMissing: true },
        { from: "*.gif", context: __dirname, noErrorOnMissing: true },
        { from: "*.svg", context: __dirname, noErrorOnMissing: true },
        { from: "*.ico", context: __dirname, noErrorOnMissing: true },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, "dist"),
    },
    port: 8080,
    compress: true,
    hot: false,
    liveReload: true,
    open: false,
  },
};
