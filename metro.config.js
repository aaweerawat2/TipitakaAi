const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const fs = require('fs');
const path = require('path');

/**
 * Metro configuration for Tripitaka Offline AI
 * Handles large asset files (.pte, .sqlite, .onnx)
 */
const projectRoot = __dirname;

const defaultConfig = getDefaultConfig(projectRoot);

// Asset extensions for AI models and database
const assetExts = [
  ...defaultConfig.resolver.assetExts,
  'pte',      // ExecuTorch model files
  'sqlite',   // SQLite database files
  'onnx',     // ONNX model files
  'bin',      // Binary model files
  'json',     // JSON configuration files
];

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    assetExts: assetExts,
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
  },
  server: {
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Handle large file requests
        if (req.url.endsWith('.pte') || req.url.endsWith('.sqlite') || req.url.endsWith('.onnx')) {
          res.setHeader('Content-Type', 'application/octet-stream');
        }
        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
