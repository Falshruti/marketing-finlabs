import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Public folder path (where Vite serves static files from)
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const MOCK_DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'mockData.js');

app.use(cors());
app.use(express.json());

// Multer storage — saves files to public/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PUBLIC_DIR);
  },
  filename: (req, file, cb) => {
    // Keep the original filename
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /\.(png|jpg|jpeg|gif|webp|docx|pdf|doc)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  },
});

// ─── GET: Read all mock data ───────────────────────────────────────────────
app.get('/api/entries', (req, res) => {
  try {
    const content = fs.readFileSync(MOCK_DATA_PATH, 'utf-8');

    // Extract all three arrays using regex
    const extractArray = (name) => {
      const regex = new RegExp(`export const ${name}\\s*=\\s*(\\[.*?\\]);`, 's');
      const match = content.match(regex);
      if (!match) return [];
      try {
        // eslint-disable-next-line no-eval
        return eval(match[1]);
      } catch {
        return [];
      }
    };

    res.json({
      whatsappCreatives: extractArray('whatsappCreatives'),
      emailTemplates: extractArray('emailTemplates'),
      videos: extractArray('videos'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST: Upload a file ───────────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    success: true,
    filename: req.file.originalname,
    path: `/${req.file.originalname}`,
  });
});

// ─── POST: Add a new entry to mockData.js ─────────────────────────────────
app.post('/api/add-entry', (req, res) => {
  try {
    const { tab, entry } = req.body;
    if (!tab || !entry) return res.status(400).json({ error: 'Missing tab or entry' });

    const arrayMap = {
      whatsapp: 'whatsappCreatives',
      email: 'emailTemplates',
      videos: 'videos',
    };

    const arrayName = arrayMap[tab];
    if (!arrayName) return res.status(400).json({ error: 'Invalid tab' });

    let content = fs.readFileSync(MOCK_DATA_PATH, 'utf-8');

    // Format the new entry with 2-space indentation
    const newEntryStr = '  ' + JSON.stringify(entry, null, 2).replace(/\n/g, '\n  ');

    // Find the closing ]; of the target array and insert the new entry before it
    // Always adds a comma after the last existing entry
    const regex = new RegExp(
      `(export const ${arrayName}\\s*=\\s*\\[)([\\s\\S]*?)(\\];)`,
      's'
    );
    const match = content.match(regex);
    if (!match) return res.status(500).json({ error: `Could not find ${arrayName} in mockData.js` });

    const existingBody = match[2];

    // Ensure there's a trailing comma on the last entry if array isn't empty
    const trimmedBody = existingBody.trimEnd();
    const bodyWithComma = trimmedBody.length > 0 && !trimmedBody.endsWith(',')
      ? trimmedBody + ','
      : trimmedBody;

    const updatedArray = `${match[1]}${bodyWithComma}\n${newEntryStr},\n${match[3]}`;
    content = content.replace(regex, updatedArray);

    fs.writeFileSync(MOCK_DATA_PATH, content, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── DELETE: Remove an entry from mockData.js ─────────────────────────────
app.delete('/api/delete-entry/:id', (req, res) => {
  try {
    const { id } = req.params;
    let content = fs.readFileSync(MOCK_DATA_PATH, 'utf-8');

    // Match the object block containing this id
    // Removes the object and surrounding commas/whitespace
    const idRegex = new RegExp(
      `\\s*\\{[^{}]*"id"\\s*:\\s*"${id}"[^{}]*\\},?`,
      's'
    );

    if (!idRegex.test(content)) {
      return res.status(404).json({ error: `Entry with id "${id}" not found` });
    }

    content = content.replace(idRegex, '');

    // Clean up any trailing commas before closing bracket
    content = content.replace(/,(\s*\])/g, '$1');

    fs.writeFileSync(MOCK_DATA_PATH, content, 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Upload server running at http://localhost:${PORT}\n`);
});
