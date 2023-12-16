const supabase = require('./supabase');
const fs = require('fs');
// adds a new file to the songs table, and uploads the file to Supabase storage
const addFile = async (filePath, filename, metadata, spotifyMetadata) => {
  const fileContent = fs.readFileSync(filePath);
  const { data: storageResponse, error: storageError } = await supabase.storage
    .from('teacher-storage')
    .upload(`songs/${filename}`, fileContent);

  if (storageError) {
    console.log('ERROR IN STORAGE UPLOAD:');
    throw storageError;
  }
  console.log(`File ${filename} uploaded to Supabase storage.`);

  const { data, error } = await supabase
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
      updated_at: new Date().toISOString(),
      image_url: spotifyMetadata.album.images[0].url || null,
      release_date: spotifyMetadata.album.release_date || null,
    }]);

  if (error) {
    throw error;
  }
  console.log(`Entry for ${filename} added to songs table.`);
}

module.exports = addFile;