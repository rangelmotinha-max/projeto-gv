const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const base = path.join(__dirname, '..', '..', 'uploads', 'veiculos');
    ensureDir(base);
    cb(null, base);
  },
  filename: (req, file, cb) => {
    const safeName = (file.originalname || 'file').replace(/[^\w.\-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB por arquivo
    files: 20,
  },
  fileFilter: (req, file, cb) => {
    const isImage = /^image\//i.test(file.mimetype);
    const isPdf = file.mimetype === 'application/pdf';
    const isDoc =
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (file.fieldname === 'manual') {
      if (isPdf || isDoc) return cb(null, true);
      return cb(new Error('Manual deve ser PDF ou Word.'));
    }

    if (file.fieldname === 'fotos') {
      if (isImage) return cb(null, true);
      return cb(new Error('Fotos devem ser imagens.'));
    }

    cb(null, false);
  },
});

module.exports = upload;
