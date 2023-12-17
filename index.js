const path = require('path');
const fs = require('fs');
const supabase = require('./supabase');
const addFile = require('./addFile');
const fileHandler = require('./fileWatcher');
const startupCheck = require('./startupCheck');

const songsFolderPath = path.join('/Users', 'timdobranski', 'Desktop', 'guitarProFiles');

// Run the startup check
startupCheck(songsFolderPath)
.then(() => {
  console.log('Startup check complete.');

  // Set up file watcher after the startup check is done
  fs.watch(songsFolderPath, { recursive: true }, (eventType, filename) => {
    fileHandler(eventType, filename, songsFolderPath);
  });
}).catch(err => {
  console.error('Error during startup check:', err);
});
// watch exercises folder for changes

// watch studentSongs file for changes