const supabase = require('./supabase');
const fs = require('fs');
const { format, utcToZonedTime } = require('date-fns-tz');
const getGuitarProMetadata = require('./alphatab');
const findSongOnSpotify = require('./spotify');


// adds a new file to the songs table, and uploads the file to Supabase storage
// if the file already exists in the songs table, it will only be updated in storage
const addFile = async (filePath, filename) => {
  const fileContent = fs.readFileSync(filePath);

  // STEP 1/4: get gp metadata
  const metadata = await getGuitarProMetadata(filePath);
  // console.log('guitar pro metadata:', metadata);

  // STEP 2/4: get spotify metadata
  const spotifyMetadata = await findSongOnSpotify(metadata.title, metadata.artist);
  // console.log('spotify metadata:', spotifyMetadata);


  // Upload to storage (or update if exists)
  const { error: storageError } = await supabase.storage
    .from('teacher-storage')
    .upload(`songs/${filename}`, fileContent, { upsert: true });

  if (storageError) {
    console.log('ERROR IN STORAGE UPLOAD:');
    throw storageError;
  }
  console.log(`File ${filename} uploaded to Supabase storage.`);

  // Check if file already exists in songs table
  const { data: existingFiles, error: existingFilesError } = await supabase
    .from('songs')
    .select('id')
    .eq('gp_url', `songs/${filename}`);

  if (existingFilesError) {
    throw existingFilesError;
  }
  // get file size to later check if the file is older or newer than the one in storage
  const size = fs.statSync(filePath).size;

  // If file does not exist in songs table, insert new record
  if (existingFiles.length === 0) {
    const { error: insertError } = await supabase
      .from('songs')
      .insert([{
        title: metadata.title || spotifyMetadata.name || null,
        gp_url: `songs/${filename}`,
        artist: metadata.artist || spotifyMetadata.artists[0].name || null,
        explicit: spotifyMetadata.explicit,
        spotify_url: spotifyMetadata.external_urls.spotify || null,
        spotify_id: spotifyMetadata.id || null,
        spotify_artist_id: spotifyMetadata.artists[0].id || null,
        album: metadata.album || spotifyMetadata.album.name || null,
        tempo: metadata.tempo || null,
        key: metadata.key || null,
        updated_at: null,
        image_url: spotifyMetadata.album.images[0].url || null,
        release_date: spotifyMetadata.album.release_date || null,
        file_size: size
      }]);

    if (insertError) {
      throw insertError;
    }
    console.log(`Entry for ${filename} added to songs table.`);
  } else {
    // If file already exists in songs table, update the 'updated_at' field
    const timeZone = 'America/Los_Angeles';
    const zonedTime = utcToZonedTime(new Date(), timeZone);
    const pacificTime = format(zonedTime, 'yyyy-MM-dd HH:mm:ssXXX', { timeZone });

  // Update the existing record
  const { error: updateError } = await supabase
    .from('songs')
    .update({ updated_at: pacificTime, file_size: size })
    .eq('gp_url', `songs/${filename}`);

  if (updateError) {
    throw updateError;
  }
    console.log(`File ${filename} already exists in songs table. Only the updated_at value has been modified to ${pacificTime}.`);
  }
};

module.exports = addFile;
