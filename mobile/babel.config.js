const { expoRouterBabelPlugin } = require("babel-preset-expo/build/expo-router-plugin");

/**
 * In npm workspaces, `babel-preset-expo` is often hoisted to the repo root while
 * `expo-router` stays under `mobile/`. The preset's `hasModule("expo-router")` check
 * then fails and the router Babel plugin is skipped — `process.env.EXPO_ROUTER_*`
 * never inlines and Metro's `require.context` pass errors. We always register the
 * plugin from here so resolution is reliable.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Keep expo-router plugin first, add Reanimated plugin last as required.
    plugins: [expoRouterBabelPlugin, 'react-native-reanimated/plugin'],
  };
};
