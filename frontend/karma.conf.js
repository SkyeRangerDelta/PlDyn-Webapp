const fs = require('fs');
const BRAVE_WIN = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';

module.exports = function (config) {
  // On Windows, if CHROME_BIN isn't already set and Brave is present at the default install
  // location, point karma-chrome-launcher at it so tests run without needing Chrome installed.
  if (!process.env.CHROME_BIN && process.platform === 'win32' && fs.existsSync(BRAVE_WIN)) {
    process.env.CHROME_BIN = BRAVE_WIN;
  }

  config.set({
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    customLaunchers: {
      BraveHeadless: {
        base: 'ChromeHeadless',
      },
    },
    client: {
      jasmine: {
        // Disable random spec ordering to produce a stable execution sequence.
        // Angular 21's test isolation (jasmine-cleanup) has a race condition that
        // causes 'describe is not defined' for whichever spec file is loaded
        // synchronously during the cleanup phase. A fixed order keeps the
        // problematic slot occupied by the same spec every run, making it
        // easier to diagnose and work around.
        random: false,
      },
    },
  });
};
