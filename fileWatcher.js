const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');
const alphaTab = require('@coderline/alphatab');
const findSongOnSpotify = require('./spotify');
const getGuitarProMetadata = require('./alphatab');
const addFile = require('./addFile');
const deleteFile = require('./deleteFile');


// Update this to instead just send a request to the addSong, removeSong, or updateSong endpoint in the main app
// const folderPath = path.join('/Users', 'timdobranski', 'Desktop', 'guitarProFiles');

const fileHandler = async (eventType, filename, folderPath) => {
  if (filename) {
    const filePath = path.join(folderPath, filename);

    try {
      const stats = await fs.promises.stat(filePath);

      if (stats.isFile()) {
        console.log(`${filename} has been ${eventType}`);

        if (eventType === 'rename') {
          // File was added or updated - add to storage and songs table if not already there
          console.log(`Uploading ${filename} to Supabase storage and adding to songs table.`);
          await addFile(filePath, filename);
          console.log(`Entry for ${filename} added to songs table.`);
        } else if (eventType === 'change') {
          // File modified
          console.log(`Updating 'updated at' for ${filename} in songs table.`);
          // Update 'updated at' in songs table
          // Add code to update the 'updated at' field for the corresponding record
        }
      } else {
        console.log(`Detected change in ${filename}, but it's a directory, not a file.`);
      }
    } catch (error) {
      if (eventType === 'rename' && error.code === 'ENOENT') {
        // File was removed - delete from storage and songs table
        console.log(`Removing ${filename} from Supabase storage and songs table.`);
        deleteFile(filename);
      } else {
        console.error(`Error processing ${filename}:`, error);
      }
    }
  } else {
    console.log(`Filename not provided for event type ${eventType}.`);
  }
};

module.exports = fileHandler;

