const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
require("dotenv").config();

const clientEnv = {
  "process.env.API_BASE_URL": JSON.stringify(process.env.API_BASE_URL || "https://first-auth.onrender.com/api"),
};

module.exports = {
  entry: "./src/js/index.js",
  output: {
    // Match the <script> tags in your HTML files
    filename: "js/app.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new webpack.DefinePlugin(clientEnv),
    new CopyPlugin({
      patterns: [
        { from: "**/*.html", context: path.resolve(__dirname, "src"), noErrorOnMissing: true },
        { from: "css/*.css", context: path.resolve(__dirname, "src"), noErrorOnMissing: true },
        { 
          from: "pics", 
          to: "pics", 
          context: path.resolve(__dirname, "src"), 
          noErrorOnMissing: true 
        },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, "dist"),
    },
    historyApiFallback: {
      rewrites: [
        { from: /^\/about$/, to: '/about.html' },
        { from: /^\/services$/, to: '/services.html' },
        { from: /^\/login$/, to: '/login.html' },
        { from: /^\/privacy$/, to: '/privacy.html' },
        { from: /^\/dashboard$/, to: '/dashboard.html' }
      ],
    },
    port: 8080,
    compress: true,
    hot: false,
    liveReload: true,
    open: false,
  },
};