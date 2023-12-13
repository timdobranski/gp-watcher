const fs = require('fs');
const path = require('path');
const supabase = require('./supabase');

// Replace with the path to your guitarProFiles folder
const folderPath = path.join('/Users', 'timdobranski', 'Desktop', 'guitarProFiles');

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
          // Upload file to Supabase storage
          const fileContent = fs.readFileSync(filePath);
          const { data: storageResponse, error: storageError } = await supabase.storage
            .from('teacher-storage')
            .upload(`songs/${filename}`, fileContent);

          if (storageError) {
            console.log('ERROR IN STORAGE UPLOAD:');
            throw storageError; // Use storageError directly
          }

          console.log(`File ${filename} uploaded to Supabase storage.`);

          // Add entry to songs table
          const { data, error } = await supabase
            .from('songs')
            .insert([{
              title: filename,
              gp_url: `songs/${filename}`
            }]);

          if (error) { // Use error directly
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
