const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');
const addFile = require('./addFile');
const getGuitarProMetadata = require('./alphatab');
const findSongOnSpotify = require('./spotify');

// when a file is found in the recursive walk, process it
async function processFile(filePath, filename, baseDir) {

  // Check if the file has a Guitar Pro file extension
  const validExtensions = ['.gp3', '.gp4', '.gp5', '.gpx', '.gp'];
  if (!validExtensions.some(ext => filename.endsWith(ext))) {
    console.log(`Skipping non-Guitar Pro file: ${filename}`);
    return;
  }
  // generate the relative path for storage (artist name then song name)
  const relativePath = path.relative(baseDir, filePath);
  // const storagePath = relativePath;

  // Check if the file already exists in the songs table
  const { data: existingFiles, error } = await supabase
    .from('songs')
    .select('gp_url, file_size')
    .eq('gp_url', `songs/${relativePath}`);

  if (error) {
    console.error('Error querying Supabase:', error);
    return;
  }

  // Compare file sizes to determine if the local one is newer
  const localFileSize = fs.statSync(filePath).size;
  let shouldProcessFile = true;

  if (existingFiles && existingFiles.length > 0) {
    const storageFileSize = existingFiles[0].file_size;
    shouldProcessFile = localFileSize !== storageFileSize;
  }

  // Process the file if it's new or updated
  if (shouldProcessFile) {
    try {
      // const metadata = await getGuitarProMetadata(filePath);
      // const spotifyMetadata = await findSongOnSpotify(metadata.title, metadata.artist);

      await addFile(filePath, relativePath);
      console.log(`Processed new file: ${filename}`);
    } catch (processError) {
      console.error(`Error processing file ${filename}:`, processError);
    }
  }
}

// iterate recursively through all files in the directory
function walkDirectory(directory, fileCallback) {
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    const fileStat = fs.statSync(fullPath);
    if (fileStat.isDirectory()) {
      walkDirectory(fullPath, fileCallback);
    } else if (fileStat.isFile()) {
      fileCallback(fullPath, file);
    }
  });
}

const startupCheck = async (songsFolderPath) => {
  walkDirectory(songsFolderPath, async (filePath, filename) => {
    await processFile(filePath, filename, songsFolderPath); // Add songsFolderPath here
  });
};

module.exports = startupCheck;
