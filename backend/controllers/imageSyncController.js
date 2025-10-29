const fs = require('fs');
const path = require('path');
const { Student } = require('../models');
const https = require('https');
const http = require('http');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Helper to download an image from a URL and save it at the given path.
 * Supports both http and https schemes without external deps.
 */
function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, res => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
            }
            const fileStream = fs.createWriteStream(outputPath);
            res.pipe(fileStream);
            fileStream.on('finish', () => fileStream.close(resolve));
        }).on('error', reject);
    });
}

/**
 * Sync student images: download missing images into uploads dir.
 * File name format: <FirstName>_<StudentId>.jpeg
 */
exports.syncStudentImages = async (req, res) => {
    try {
        const students = await Student.findAll({ attributes: ['firstName', 'studentId', 'photos'] });
        const downloadPromises = [];
        const summary = { downloaded: 0, skipped: 0 };

        students.forEach(student => {
            const fileName = `${student.firstName}_${student.studentId}.jpeg`;
            const filePath = path.join(UPLOADS_DIR, fileName);

            if (fs.existsSync(filePath)) {
                summary.skipped += 1;
                return; // Already exists
            }

            if (Array.isArray(student.photos) && student.photos.length > 0) {
                const photoUrl = student.photos[0];
                downloadPromises.push(
                    downloadImage(photoUrl, filePath)
                        .then(() => { summary.downloaded += 1; })
                        .catch(err => {
                            console.error(`Error downloading ${photoUrl}:`, err.message);
                        })
                );
            } else {
                console.warn(`No photo URL for student ${student.studentId}`);
            }
        });

        await Promise.all(downloadPromises);
        res.json({ message: 'Sync complete', ...summary });
    } catch (error) {
        console.error('Image sync error:', error);
        res.status(500).json({ error: error.message });
    }
};

// -------------------------
// List images in project-root /uploads
exports.listStudentImages = (req, res) => {
    try {
        const rootUploads = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(rootUploads)) {
            return res.json([]);
        }
        const files = fs.readdirSync(rootUploads).filter(f => /\.(jpe?g|png)$/i.test(f));
        res.json(files);
    } catch (err) {
        console.error('listStudentImages error:', err);
        res.status(500).json({ error: err.message });
    }
};
