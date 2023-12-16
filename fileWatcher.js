const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');
const alphaTab = require('@coderline/alphatab');
const findSongOnSpotify = require('./spotify');
const getGuitarProMetadata = require('./alphatab');
const addFile = require('./addFile');
const deleteFile = require('./deleteFile');


// Update this to instead just send a request to the addSong, removeSong, or updateSong endpoint in the main app
const folderPath = path.join('/Users', 'timdobranski', 'Desktop', 'guitarProFiles');

// on start, check all files in songs folder, and run addFile on any that aren't already in the songs table

fs.watch(folderPath, { recursive: true }, async (eventType, filename) => {
  if (filename) {
    console.log(`${filename} has been ${eventType}`);
    const filePath = path.join(folderPath, filename);
    const fileExists = fs.existsSync(filePath);

    if (eventType === 'rename') {
      if (fileExists) {
        // File added
        console.log(`Uploading ${filename} to Supabase storage and adding to songs table.`);

        try {
          // STEP 1/4: get gp metadata
          const metadata = await getGuitarProMetadata(filePath);
          // console.log('guitar pro metadata:', metadata);

          // STEP 2/4: get spotify metadata
          const spotifyMetadata = await findSongOnSpotify(metadata.title, metadata.artist);
          console.log('spotify metadata:', spotifyMetadata);

          // STEP 3 & 4/4: Add metadata to songs table and upload GP file to Supabase storage
          addFile(filePath, filename, metadata, spotifyMetadata);

          if (error) {
            throw error;
          }
          console.log(`Entry for ${filename} added to songs table.`);
        } catch (error) {
          console.error(error);
        }

      } else {
        // File removed
        console.log(`Removing ${filename} from Supabase storage and songs table.`);
        deleteFile(filename);
      }
    } else if (eventType === 'change') {
      // File modified
      console.log(`Updating 'updated at' for ${filename} in songs table.`);

      // Update 'updated at' in songs table
      // Add code to update the 'updated at' field for the corresponding record
    }
  }
});
