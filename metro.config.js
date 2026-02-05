const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for web
config.resolver.sourceExts.push('web.js', 'web.jsx', 'web.ts', 'web.tsx');

module.exports = config;
