import multer from 'multer';
import path from 'path';

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists or handle dynamically
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// File filter for allowed types (optional, can be customized)
const fileFilter = (req, file, cb) => {
  // Accept all files for now
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

export const uploadFile = upload;
export default upload; 