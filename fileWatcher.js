const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');
const alphaTab = require('@coderline/alphatab');
const findSongOnSpotify = require('./spotify');

// Update this to instead just send a request to the addSong, removeSong, or updateSong endpoint in the main app
const folderPath = path.join('/Users', 'timdobranski', 'Desktop', 'guitarProFiles');

async function getScoreMetadata(guitarProFilePath) {
  try {
    // Read the Guitar Pro file into a buffer
    const fileData = await fs.promises.readFile(guitarProFilePath);

    // Create a Uint8Array from the buffer
    const uint8Array = new Uint8Array(fileData);

    // Assuming alphaTab has a similar method in Node.js
    const settings = new alphaTab.Settings();
    const score = alphaTab.importer.ScoreLoader.loadScoreFromBytes(uint8Array, settings);

    // Extract metadata from the score
    const metadata = {
      title: score.title,
      subtitle: score.subTitle,
      artist: score.artist,
      album: score.album,
      words: score.words,
      music: score.music,
      // copyright: score.copyright,
      // tab: score.tab,
      instructions: score.instructions,
      tempo: score.tempoLabel,
      key: score.masterBars[0].keySignature
    };


    return metadata;
  } catch (error) {
    console.error('Error loading Guitar Pro file:', error);
    throw error;
  }
}


fs.watch(folderPath, async (eventType, filename) => {
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
          const metadata = await getScoreMetadata(filePath);
          console.log('guitar pro metadata:', metadata);

          // STEP 2/4: get spotify metadata
          const spotifyMetadata = await findSongOnSpotify(metadata.title, metadata.artist);
          console.log('spotify metadata:', spotifyMetadata);

          // STEP 3/4: Upload file to Supabase storage
          const fileContent = fs.readFileSync(filePath);
          const { data: storageResponse, error: storageError } = await supabase.storage
            .from('teacher-storage')
            .upload(`songs/${filename}`, fileContent);

          if (storageError) {
            console.log('ERROR IN STORAGE UPLOAD:');
            throw storageError;
          }
          console.log(`File ${filename} uploaded to Supabase storage.`);
          // STEP 4/4: Add entry to songs table
          const { data, error } = await supabase
            .from('songs')
            .insert([{
              title: filename,
              gp_url: `songs/${filename}`
            }]);

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

        // Remove file from Supabase storage
        // Add code to remove the file from Supabase storage here

        // Remove entry from songs table
        // Add code to delete the corresponding record from the songs table
      }
    } else if (eventType === 'change') {
      // File modified
      console.log(`Updating 'updated at' for ${filename} in songs table.`);

      // Update 'updated at' in songs table
      // Add code to update the 'updated at' field for the corresponding record
    }
  }
});
