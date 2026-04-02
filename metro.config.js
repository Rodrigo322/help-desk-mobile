const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "lucide-react-native": path.resolve(
    __dirname,
    "node_modules/lucide-react-native/dist/cjs/lucide-react-native.js"
  )
};

module.exports = config;
