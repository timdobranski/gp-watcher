const supabase = require('./supabase');

const deleteFile = async (filename) => {
  // STEP 1: Remove file from Supabase storage
  try {
    const { data: removeData, error: removeError } = await supabase.storage
      .from('teacher-storage')
      .remove([`songs/${filename}`]);

    if (removeError) {
      console.log('Error removing file from storage:', removeError);
      throw removeError;
    }

    console.log(`File ${filename} removed from Supabase storage.`);
  } catch (error) {
    console.error('Error in storage file removal:', error);
  }

  // STEP 2: Remove entry from songs table
try {
  const { data: deleteData, error: deleteError } = await supabase
    .from('songs')
    .delete()
    .match({ gp_url: `songs/${filename}` });

  if (deleteError) {
    console.log('Error deleting record from songs table:', deleteError);
    throw deleteError;
  }

  console.log(`Entry for ${filename} removed from songs table.`);
} catch (error) {
  console.error('Error in table record removal:', error);
}

}


module.exports = deleteFile;