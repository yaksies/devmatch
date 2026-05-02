const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Merge so we keep Expo’s workspace watch folders (packages/*, etc.).
const existingWatch = config.watchFolders ?? [];
config.watchFolders = [...new Set([...existingWatch, monorepoRoot])];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
