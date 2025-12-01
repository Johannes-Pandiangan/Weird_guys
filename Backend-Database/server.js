const express = require('express');
const cors = require('cors');
const { initializeDatabase, query } = require('./db'); 
const multer = require('multer'); 
const fs = require('fs'); 
const cloudinary = require('cloudinary').v2; 
const path = require('path'); 

const app = express();
const PORT = process.env.PORT || 5000;

// PENTING: Panggil inisialisasi database di scope global
initializeDatabase().catch(err => {
    console.log("Inisialisasi database gagal (mungkin tabel sudah ada):", err.message);
});


// --- KONFIGURASI CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Konfigurasi Multer untuk penyimpanan file sementara
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const TEMP_UPLOAD_DIR = path.join(__dirname, 'temp_uploads');
    if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
        fs.mkdirSync(TEMP_UPLOAD_DIR);
    }
    cb(null, TEMP_UPLOAD_DIR); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage }); 


function deleteTempFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) console.error("Gagal menghapus file sementara:", err);
        });
    }
}


// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 

const PROJECT_ROOT = path.join(__dirname, '..');

app.use(express.static(PROJECT_ROOT));

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await query('SELECT * FROM admin_users WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: "username atau kata sandi salah" });
        }
        res.json({ message: "Login berhasil" });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: "Terjadi kesalahan server saat login." });
    }
});


// --- Endpoint API untuk Buku ---

// 1. GET /api/books (Read All)
app.get('/api/books', async (req, res) => {
  try {
    const result = await query('SELECT * FROM books ORDER BY id DESC'); 
    res.json(result.rows); 
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ message: "Gagal mengambil data buku dari database." });
  }
});


// 2. POST /api/books (Create) - Upload ke Cloudinary
app.post('/api/books', upload.single('cover_file'), async (req, res) => {
  const { title, author, publisher, year, category, stock, description, status, borrowers_json } = req.body;
  const tempFilePath = req.file ? req.file.path : null; 
  
  const yearInt = year ? parseInt(year) : null;
  const stockInt = stock ? parseInt(stock) : 0;
  const borrowers = JSON.parse(borrowers_json || '[]'); 
  
  let coverUrl = null;

  try {
    if (tempFilePath) {
        const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
            folder: "smart-library-covers",
        });
        coverUrl = cloudinaryResult.secure_url;
    }
    
    const INSERT_QUERY = `
      INSERT INTO books 
      (title, author, publisher, year, category, cover, stock, description, status, borrowers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *;
    `;
    const values = [
      title, author, publisher, yearInt, category, coverUrl, 
      stockInt, description, status, JSON.stringify(borrowers)
    ];
    
    const result = await query(INSERT_QUERY, values);
    
    res.status(201).json(result.rows[0]); 
  } catch (err) {
    console.error("Error creating book:", err);
    res.status(500).json({ message: "Gagal menambahkan buku." });
  } finally {
    deleteTempFile(tempFilePath); 
  }
});


// 3. PUT /api/books/:id (Update) - Upload ke Cloudinary dan hapus cover lama
app.put('/api/books/:id', upload.single('cover_file'), async (req, res) => {
  const { id } = req.params;
  const { 
    title, author, publisher, year, category, 
    stock, description, status, borrowers_json, existing_cover 
  } = req.body;
  const yearInt = year ? parseInt(year) : null;
  const stockInt = stock ? parseInt(stock) : 0;
  const borrowers = JSON.parse(borrowers_json || '[]');
  const tempFilePath = req.file ? req.file.path : null; 

  let newCoverUrl = null;
  let oldCoverUrl = null;
  
  const existingBook = await query('SELECT cover FROM books WHERE id = $1', [id]);
  if (existingBook.rows.length > 0) {
      oldCoverUrl = existingBook.rows[0].cover;
  }
  
  try {
    if (tempFilePath) {
        const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
            folder: "smart-library-covers",
        });
        newCoverUrl = cloudinaryResult.secure_url;
        
        if (oldCoverUrl) {
            const publicId = path.basename(oldCoverUrl, path.extname(oldCoverUrl));
            await cloudinary.uploader.destroy(`smart-library-covers/${publicId}`); 
        }

    } else if (existing_cover) {
        newCoverUrl = oldCoverUrl; 
    } else {
        newCoverUrl = null;
        if (oldCoverUrl) {
            const publicId = path.basename(oldCoverUrl, path.extname(oldCoverUrl));
            await cloudinary.uploader.destroy(`smart-library-covers/${publicId}`);
        }
    }

    const UPDATE_QUERY = `
      UPDATE books SET
        title = $1, author = $2, publisher = $3, year = $4, category = $5, 
        cover = $6, stock = $7, description = $8, status = $9, borrowers = $10
      WHERE id = $11
      RETURNING *;
    `;
    const values = [
      title, author, publisher, yearInt, category, 
      newCoverUrl, stockInt, description, status, JSON.stringify(borrowers), id 
    ];

    const result = await query(UPDATE_QUERY, values);

    if (result.rows.length === 0) {
        return res.status(404).json({ message: `Buku dengan ID ${id} tidak ditemukan.` });
    }
    
    res.json(result.rows[0]); 
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ message: "Gagal memperbarui buku." });
  } finally {
    deleteTempFile(tempFilePath); 
  }
});

// 4. DELETE /api/books/:id (Delete) - Hapus file dari Cloudinary
app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;

  let coverUrlToDelete = null;
  
  try {
    const existingBook = await query('SELECT cover FROM books WHERE id = $1', [id]);
    if (existingBook.rows.length > 0) {
        coverUrlToDelete = existingBook.rows[0].cover;
    }

    const DELETE_QUERY = 'DELETE FROM books WHERE id = $1 RETURNING *;';
    const result = await query(DELETE_QUERY, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Buku dengan ID ${id} tidak ditemukan.` });
    }

    if (coverUrlToDelete) {
        const publicId = path.basename(coverUrlToDelete, path.extname(coverUrlToDelete));
        await cloudinary.uploader.destroy(`smart-library-covers/${publicId}`); 
        console.log(`File cover dihapus dari Cloudinary: ${publicId}`);
    }

    res.status(204).send(); 
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ message: "Gagal menghapus buku." });
  }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'index.html'));
});

app.get('/admin/login.html', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'admin', 'login.html'));
});

app.get('/user/home.html', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'user', 'home.html'));
});

app.get('/admin/home.html', (req, res) => {
    res.sendFile(path.join(PROJECT_ROOT, 'admin', 'home.html'));
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
