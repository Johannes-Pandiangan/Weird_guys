const express = require('express');
const cors = require('cors');
const db = require('./db'); // Impor modul koneksi database
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 

// --- Endpoint API untuk Buku ---

// 1. GET /api/books (Read All)
app.get('/api/books', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM books ORDER BY id DESC'); 
    res.json(result.rows); 
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ message: "Gagal mengambil data buku dari database." });
  }
});

// 2. POST /api/books (Create)
app.post('/api/books', async (req, res) => {
  const { 
    title, author, publisher, year, category, cover, 
    stock, description, status, borrowers 
  } = req.body;

  try {
    const INSERT_QUERY = `
      INSERT INTO books 
      (title, author, publisher, year, category, cover, stock, description, status, borrowers)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *;
    `;
    const values = [
      title, author, publisher, year, category, cover, 
      stock, description, status, JSON.stringify(borrowers || [])
    ];
    
    const result = await db.query(INSERT_QUERY, values);
    res.status(201).json(result.rows[0]); 
  } catch (err) {
    console.error("Error creating book:", err);
    res.status(500).json({ message: "Gagal menambahkan buku." });
  }
});

// 3. PUT /api/books/:id (Update)
app.put('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    title, author, publisher, year, category, cover, 
    stock, description, status, borrowers 
  } = req.body;

  try {
    const UPDATE_QUERY = `
      UPDATE books SET
        title = $1, author = $2, publisher = $3, year = $4, category = $5, 
        cover = $6, stock = $7, description = $8, status = $9, borrowers = $10
      WHERE id = $11
      RETURNING *;
    `;
    const values = [
      title, author, publisher, year, category, cover, 
      stock, description, status, JSON.stringify(borrowers || []), id
    ];

    const result = await db.query(UPDATE_QUERY, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Buku dengan ID ${id} tidak ditemukan.` });
    }
    
    res.json(result.rows[0]); 
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ message: "Gagal memperbarui buku." });
  }
});

// 4. DELETE /api/books/:id (Delete)
app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const DELETE_QUERY = 'DELETE FROM books WHERE id = $1 RETURNING *;';
    const result = await db.query(DELETE_QUERY, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Buku dengan ID ${id} tidak ditemukan.` });
    }

    res.status(204).send(); 
  } catch (err) {
    console.error("Error deleting book:", err);
    res.status(500).json({ message: "Gagal menghapus buku." });
  }
});

// --- ROUTE ROOT ---
app.get('/', (req, res) => {
    res.send('Smart Library API sedang berjalan...');
});


// --- Menjalankan Server ---
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});