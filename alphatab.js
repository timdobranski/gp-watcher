const alphaTab = require('@coderline/alphatab');
const fs = require('fs');

async function getGuitarProMetadata(guitarProFilePath) {
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

module.exports = getGuitarProMetadata;