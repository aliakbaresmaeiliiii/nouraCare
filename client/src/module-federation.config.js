const { ModuleFederationPlugin } = require("webpack").container;

module.exports = {
  output: {
    publicPath: "auto",
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "gahvareh",

      remotes: {
        pregnancyApp: "pregnancyApp@http://localhost:4201/remoteEntry.js",
        cycleApp: "cycleApp@http://localhost:3000/remoteEntry.js",
      },

      shared: {
        "@angular/core": { singleton: true },
        "@angular/common": { singleton: true },
        "@angular/router": { singleton: true },
      },
    }),
  ],
};