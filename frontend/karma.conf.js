const fs = require('fs');
const BRAVE_WIN = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';

module.exports = function (config) {
  // On Windows, if CHROME_BIN isn't already set and Brave is present at the default install
  // location, point karma-chrome-launcher at it so tests run without needing Chrome installed.
  if (!process.env.CHROME_BIN && process.platform === 'win32' && fs.existsSync(BRAVE_WIN)) {
    process.env.CHROME_BIN = BRAVE_WIN;
  }

  config.set({
    customLaunchers: {
      BraveHeadless: {
        base: 'ChromeHeadless',
      },
    },
  });
};
