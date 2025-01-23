const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const router = express.Router();

// Configure S3 Client for any S3-compatible storage
const s3Client = new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY,
        secretAccessKey: process.env.STORAGE_SECRET_KEY,
    },
    forcePathStyle: true, // Required for most S3-compatible services
});

// Configure multer with file size limits
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

// Error handler middleware
const handleErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size is too large. Max size is 5MB.' });
        }
        return res.status(400).json({ error: err.message });
    }
    next(err);
};

// Upload endpoint
router.post('/upload', upload.single('file'), handleErrors, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate unique filename to prevent overwrites
        const uniqueFileName = `${Date.now()}-${req.file.originalname}`;

        const command = new PutObjectCommand({
            Bucket: process.env.STORAGE_BUCKET_NAME,
            Key: uniqueFileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });

        await s3Client.send(command);

        res.status(200).json({ 
            message: 'File uploaded successfully',
            fileName: uniqueFileName,
            fileUrl: `${process.env.STORAGE_PUBLIC_URL}/${uniqueFileName}`
        });

    } catch (error) {
        console.error('Storage upload error:', error);
        res.status(500).json({ 
            error: 'Failed to upload file',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router; 