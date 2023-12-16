const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyAccessToken(clientId, clientSecret) {
    const headers = {
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const data = querystring.stringify({ grant_type: 'client_credentials' });

    try {
        const response = await axios.post('https://accounts.spotify.com/api/token', data, { headers });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Spotify access token:', error);
        throw error;
    }
}

async function searchSpotifySong(songName, artistName, accessToken) {
  const query = encodeURIComponent(`${songName} artist:${artistName}`);
  const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;

  const headers = {
      'Authorization': `Bearer ${accessToken}`
  };

  try {
      const response = await axios.get(url, { headers });
      return response.data.tracks.items[0]; // Returns the first matching track
  } catch (error) {
      console.error('Error searching Spotify song:', error);
      throw error;
  }
}

async function findSongOnSpotify(songName, artistName) {

  try {
      const accessToken = await getSpotifyAccessToken(clientId, clientSecret);
      const song = await searchSpotifySong(songName, artistName, accessToken);

      if (song) {
        //   console.log('Song found:', song);
          // Process the song information as needed
          return song;
      } else {
          console.log('Song not found');
      }
  } catch (error) {
      console.error('Error finding song on Spotify:', error);
  }
}



module.exports = findSongOnSpotify;