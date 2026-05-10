import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
const PORT = 3000;
const PDF_DIR = path.join(__dirname, 'pdfs');
const TAGS_FILE = path.join(__dirname, 'tags.json');

const getTags = () => {
    if (!fs.existsSync(TAGS_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(TAGS_FILE, 'utf-8'));
    } catch {
        return {};
    }
};

const saveTags = (tagsData: any) => {
    fs.writeFileSync(TAGS_FILE, JSON.stringify(tagsData, null, 2));
};

// Ensure PDF directory exists
if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR);
}

// API to list PDFs with metadata
app.get('/api/pdfs', (req, res) => {
    try {
        const tagsData = getTags();
        const files = fs.readdirSync(PDF_DIR);
        const pdfData = files
            .filter(file => file.toLowerCase().endsWith('.pdf'))
            .map(file => {
                const stats = fs.statSync(path.join(PDF_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime,
                    path: `/pdfs/${encodeURIComponent(file)}`,
                    tags: tagsData[file] || []
                };
            });
        res.json(pdfData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to list PDFs' });
    }
});

app.post('/api/pdfs/:name/tags', (req, res) => {
    try {
        const fileName = req.params.name;
        const { tags } = req.body;
        
        if (!Array.isArray(tags)) {
            return res.status(400).json({ error: 'Tags must be an array of strings' });
        }
        
        const tagsData = getTags();
        tagsData[fileName] = tags;
        saveTags(tagsData);
        
        res.json({ success: true, tags });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update tags' });
    }
});

// Serve static PDFs
app.use('/pdfs', express.static(PDF_DIR));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Serving PDFs from: ${PDF_DIR}`);
});
