const fs = require("fs").promises; // Import fs with promises
const cloudinary = require("cloudinary").v2; // Import Cloudinary v2

const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Configure Cloudinary

    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });

    // Check Cloudinary configuration
    if (
      !cloudinary.config().cloud_name ||
      !cloudinary.config().api_key ||
      !cloudinary.config().api_secret
    ) {
      throw new Error(
        "Cloudinary configuration missing or incomplete. Please check your environment variables."
      );
    }

    // Check if localFilePath is defined
    if (!localFilePath) {
      throw new Error("File path is undefined");
    }

    // Check if local file exists
    const fileStats = await fs.stat(localFilePath);
    if (!fileStats.isFile()) {
      throw new Error("File does not exist at the specified path");
    }

    // Upload file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Delete the locally saved temporary file
    await fs.unlink(localFilePath);

    console.log("File uploaded successfully:", response.url);
    return response;
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error.message);
    return null;
  }
};

const deleteOnCloudinary = async (url) => {
  try {
    // Configure Cloudinary

    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });

    // Check Cloudinary configuration
    if (
      !cloudinary.config().cloud_name ||
      !cloudinary.config().api_key ||
      !cloudinary.config().api_secret
    ) {
      throw new Error(
        "Cloudinary configuration missing or incomplete. Please check your environment variables."
      );
    }

    // Check if url is defined
    if (!url) {
      throw new Error("File url is undefined");
    }

    // Extract public ID from the URL
    const publicId = url.split("/").pop().split(".")[0];

    // Delete file from Cloudinary
    const response = await cloudinary.uploader.destroy(publicId);

    console.log("File deleted successfully from Cloudinary");
    return response;
  } catch (error) {
    console.error("Error deleting file from Cloudinary:", error.message);
    return null;
  }
};

module.exports = { uploadOnCloudinary, deleteOnCloudinary };
