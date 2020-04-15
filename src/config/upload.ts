import path from 'path';
import crypto from 'crypto';
import multer from 'multer';

const directoryFolder = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: directoryFolder,
  storage: multer.diskStorage({
    destination: directoryFolder,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(10).toString('HEX');
      const filename = `${fileHash}-${file.originalname}`;

      callback(null, filename);
    },
  }),
};
