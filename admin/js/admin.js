let currentPage = 1;
const itemsPerPage = 10;
const API_URL = "https://weird-guys-backend.vercel.app/api/books";
const LOGGED_IN_ADMIN_NAME = localStorage.getItem('adminName') || 'Admin Tak Dikenal';


document.addEventListener("DOMContentLoaded", () => {
  let books = []; 
  let editBookId = null; 

  // BARU: Tampilkan nama admin di header
  const adminNameDisplay = document.getElementById('adminNameDisplay');
  if (adminNameDisplay) {
      adminNameDisplay.textContent = LOGGED_IN_ADMIN_NAME;
  }

  // Elements
  const bookListEl = document.getElementById("bookList");
  const toggleAddFormBtn = document.getElementById("toggleAddForm");
  const bookFormWrap = document.getElementById("bookFormWrap");
  const bookForm = document.getElementById("bookForm");
  const cancelEditBtn = document.getElementById("cancelEdit");
  const searchInput = document.getElementById("searchBook"); 

  // Inputs
  const f_title = document.getElementById("f_title");
  const f_author = document.getElementById("f_author");
  const f_publisher = document.getElementById("f_publisher");
  const f_year = document.getElementById("f_year");
  const f_category = document.getElementById("f_category");
  const f_cover_file = document.getElementById("f_cover_file"); 
  const f_existing_cover = document.getElementById("f_existing_cover"); 
  const f_stock = document.getElementById("f_stock");
  const f_description = document.getElementById("f_description");
  const f_status = document.getElementById("f_status");

  // Toggle form
  toggleAddFormBtn.addEventListener("click", () => {
    bookFormWrap.classList.toggle("hidden");
    if (!bookFormWrap.classList.contains("hidden")) {
      resetForm();
    }
  });

  cancelEditBtn.addEventListener("click", () => {
    resetForm();
    bookFormWrap.classList.add("hidden");
  });
  
  // Helpers for escaping
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  // --- API FUNCTIONS ---
  
  // 1. Fetch data dari API 
  async function fetchBooks() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Gagal memuat data buku dari server.");
      books = await response.json();
      // MEMASTIKAN setiap buku memiliki array borrowers yang kosong jika tidak ada data
      books.forEach(b => {
          b.borrowers = b.borrowers || [];
      });
      return books;
    } catch (error) {
      console.error("Error fetching books:", error);
      books = [];
      return [];
    }
  }

  // 2. Save book (POST atau PUT) - MENGGUNAKAN FORMDATA
  async function saveBook(formData, method, id = null) {
    const url = method === 'POST' ? API_URL : `${API_URL}/${id}`;
    
    try {
      const response = await fetch(url, {
        method: method,
        body: formData, // Mengirim FormData
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `Gagal menyimpan buku: Status ${response.status}.`;
        
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || response.statusText;
        } else {
            errorMessage = `Gagal menyimpan buku: Server mengirimkan format data yang salah (${response.status}). Cek konsol server untuk detail error.`;
        }
        
        throw new Error(errorMessage);
      }
      
      if (response.status === 204) return true;
      
      return await response.json();

    } catch (error) {
      alert(error.message);
      console.error("Save error:", error);
      return null;
    }
  }

  // 3. Delete book (DELETE)
  async function deleteBook(id) {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      if (response.status === 204) {
        return true; 
      }
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Gagal menghapus buku: ${errorData.message || response.statusText}`);
      }
      return false;
    } catch (error) {
      alert(error.message);
      console.error("Delete error:", error);
      return false;
    }
  }
  
  // --- RENDERING & PAGINATION ---
  
  function renderPagination(filteredLength) {
    const totalPages = Math.ceil(filteredLength / itemsPerPage);
    const pagEl = document.getElementById("pagination");

    if (!pagEl) return;
    pagEl.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      pagEl.insertAdjacentHTML(
        "beforeend",
        `
        <button
          class="px-3 py-1 border rounded ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-white'}"
          onclick="changePage(${i})"
        >
          ${i}
        </button>
      `
      );
    }
  }

  window.changePage = function (page) {
    currentPage = page;
    renderBooks();
  };


  async function renderBooks() {
    await fetchBooks(); 
    
    const filter = searchInput.value.toLowerCase();
    
    const filtered = books.filter(
        (b) =>
            (b.title || "").toLowerCase().includes(filter) ||
            (b.author || "").toLowerCase().includes(filter) ||
            (b.category || "").toLowerCase().includes(filter)
    );
    
    bookListEl.innerHTML = "";

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    const paginatedBooks = filtered.slice(start, end);

    if (filtered.length === 0) {
      bookListEl.innerHTML = `<div class="col-span-3 text-gray-600">Belum ada buku atau tidak ada hasil pencarian.</div>`;
      renderPagination(0);
      return;
    }

    paginatedBooks.forEach((book, i) => {
        const dbId = book.id; 

        const statusClass =
          book.status === "Tersedia"
            ? "text-green-600"
            : book.stock > 0
            ? "text-yellow-600"
            : "text-red-600";
            
        // Cover menggunakan URL lengkap
        const coverUrl = book.cover ? book.cover : null;
        // MODIFIKASI: Menggunakan wrapper div untuk object-contain dan tinggi yang seragam
        const cover = coverUrl
          ? `
            <div class="w-full h-56 bg-gray-100 flex items-center justify-center rounded mb-2 overflow-hidden border border-gray-300">
                <img src="${escapeHtml(coverUrl)}" class="h-full w-auto object-contain">
            </div>
          `
          : "";

        // TAMPILAN BARU: Tampilkan daftar peminjam dengan detail dan tombol "Dikembalikan"
        // PASTIKAN b.id digunakan sebagai borrowingId
        const borrowerList = (book.borrowers || [])
          .map((b) => `
              <div class="bg-gray-100 p-2 rounded mb-2 border border-gray-200">
                <p class="text-xs text-gray-800 mb-1">
                  <strong>Nama:</strong> ${escapeHtml(b.name)}
                </p>
                <p class="text-xs text-gray-800 mb-2">
                  <strong>No. HP:</strong> ${escapeHtml(b.phone)}
                </p>
                ${b.handledBy ? `<p class="text-xs text-gray-800 mb-2"><strong>Dilayani oleh:</strong> ${escapeHtml(b.handledBy)}</p>` : ''} 
                <button 
                  onclick="adminRemoveBorrower(${dbId}, ${b.id})" // MENGGUNAKAN ID PEMINJAMAN (b.id) dan ID BUKU (dbId)
                  class="w-full px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                >
                  Dikembalikan
                </button>
              </div>
          `)
          .join('');
        
        const currentBorrowers = (book.borrowers || []).length;
        const totalStock = (book.stock || 0) + currentBorrowers;

        bookListEl.insertAdjacentHTML(
          "beforeend",
          `
          <div class="bg-white border rounded p-4 shadow-sm">
            ${cover}
            <h3 class="font-semibold text-lg">${escapeHtml(book.title)}</h3>
            <p class="text-sm text-gray-600">${escapeHtml(book.author || "")}</p>
            
            <div class="mt-3">
              <div class="text-sm ${statusClass}">Status: ${book.status} (${book.stock} stok tersisa dari ${totalStock})</div>
            </div>
            
            ${book.added_by_admin ? `<p class="text-sm text-gray-600 mt-1">Ditambahkan oleh: <strong>${escapeHtml(book.added_by_admin)}</strong></p>` : ''} 

            <div class="mt-3">
              <p class="text-sm font-semibold">Peminjam (${currentBorrowers}):</p>
              ${borrowerList || '<p class="text-xs text-gray-500">Tidak ada peminjam saat ini.</p>'}
            </div>

            <div class="mt-3 flex gap-2">
              <button onclick="adminShowBorrowForm(${dbId})" class="px-2 py-1 bg-yellow-400 text-sm rounded">Pinjam</button>
              <button onclick="adminStartEdit(${dbId})" class="px-2 py-1 bg-blue-500 text-white text-sm rounded">Edit</button>
              <button onclick="adminDelete(${dbId})" class="px-2 py-1 bg-red-500 text-white text-sm rounded">Hapus</button>
            </div>
            
            <div id="borrowForm-${dbId}" class="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded hidden">
                <h4 class="font-semibold text-sm mb-2">Pinjam Buku: ${escapeHtml(book.title)}</h4>
                <input type="text" id="bname-${dbId}" placeholder="Nama Peminjam" class="w-full p-1 border rounded text-sm mb-2" required>
                <input type="text" id="bphone-${dbId}" placeholder="No. HP Peminjam" class="w-full p-1 border rounded text-sm mb-3" required>
                <div class="flex gap-2 justify-end">
                    <button onclick="adminCancelBorrow(${dbId})" class="px-3 py-1 text-sm border rounded">Batal</button>
                    <button onclick="adminConfirmBorrow(${dbId})" class="px-3 py-1 text-sm bg-green-500 text-white rounded">Konfirmasi Pinjam</button>
                </div>
            </div>
          </div>
        `
      );
    });

    renderPagination(filtered.length);
  }


  // --- FORM LOGIC ---
  
  // Add / Edit form submit - MENGGUNAKAN FORMDATA
  bookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const currentStock = Number(f_stock.value) || 0;
    const initialStatus = f_status.checked ? "Tersedia" : (currentStock > 0) ? "Tersedia" : "Habis";
    
    const formData = new FormData();
    
    // Append fields
    formData.append('title', f_title.value.trim());
    formData.append('author', f_author.value.trim());
    formData.append('publisher', f_publisher.value.trim());
    formData.append('year', f_year.value);
    formData.append('category', f_category.value.trim());
    formData.append('stock', currentStock);
    formData.append('description', f_description.value.trim());
    formData.append('status', initialStatus);

    if (!f_title.value.trim()) return alert("Judul wajib diisi");
    
    let result = null;
    let method = 'POST';
    
    if (editBookId) {
      // Mode Edit (PUT)
      method = 'PUT';
      
      const existingBook = books.find(b => b.id === editBookId);
      // HAPUS PENGIRIMAN DATA BORROWERS LAMA
      // formData.append('borrowers_json', JSON.stringify(existingBook.borrowers || [])); 
      
      // Pertahankan added_by_admin yang sudah ada
      formData.append('added_by_admin', existingBook.added_by_admin || LOGGED_IN_ADMIN_NAME); 


      if (f_cover_file.files.length > 0) {
          // File baru diupload
          formData.append('cover_file', f_cover_file.files[0]);
      } else if (f_existing_cover.value) {
          // Tidak ada file baru, tapi ada file lama. Kirim path URL relatif lama.
          formData.append('existing_cover', f_existing_cover.value);
      }
      
      result = await saveBook(formData, method, editBookId);
      if (result) alert("Buku berhasil diperbarui");
      
    } else {
      // Mode Tambah (POST)
      method = 'POST';
      // HAPUS PENGIRIMAN DATA BORROWERS KOSONG
      // formData.append('borrowers_json', JSON.stringify([])); 
      // Tambahkan nama admin yang sedang login
      formData.append('added_by_admin', LOGGED_IN_ADMIN_NAME); 
      
      if (f_cover_file.files.length > 0) {
          formData.append('cover_file', f_cover_file.files[0]);
      }

      result = await saveBook(formData, method);
      if (result) alert("Buku berhasil ditambahkan");
    }

    if (result) {
        resetForm();
        bookFormWrap.classList.add("hidden");
        renderBooks(); 
    }
  });

  function resetForm() {
    bookForm.reset();
    f_status.checked = true;
    editBookId = null;
    f_existing_cover.value = ''; 
    f_cover_file.value = ''; 
  }
  
  searchInput.addEventListener("input", () => {
      currentPage = 1;
      renderBooks(); 
  });


  // --- ADMIN ACTIONS (Exposed to global for inline onclick) ---
  
  window.adminShowBorrowForm = (id) => {
    const el = document.getElementById(`borrowForm-${id}`);
    if (el) el.classList.remove('hidden');
  };

  window.adminCancelBorrow = (id) => {
    const el = document.getElementById(`borrowForm-${id}`);
    if (el) el.classList.add('hidden');
  };

  // adminConfirmBorrow - MENGGUNAKAN ENDPOINT BARU
  window.adminConfirmBorrow = async (id) => {
    const book = books.find(b => b.id === id);
    if (!book) return alert("Buku tidak ditemukan di cache.");
    
    const nameInput = document.getElementById(`bname-${id}`);
    const phoneInput = document.getElementById(`bphone-${id}`);
    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();
    
    if (!name) return alert("Nama peminjam wajib diisi");
    if (!phone) return alert("Nomor telepon wajib diisi");
    // Cek stok langsung dari cache
    if (book.stock <= 0) return alert("Stok habis, tidak bisa dipinjam");
    
    // Data yang akan dikirim ke endpoint baru (POST)
    const borrowData = { 
        name, 
        phone, 
        handledBy: LOGGED_IN_ADMIN_NAME // Nama admin yang sedang login
    };
    
    try {
        const response = await fetch(`${API_URL}/${id}/borrow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(borrowData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
             throw new Error(result.message || 'Gagal memproses peminjaman.');
        }

        alert(`Buku "${book.title}" dipinjam oleh ${name}`);
        adminCancelBorrow(id);
        renderBooks(); // Render ulang untuk memuat data peminjam baru
    } catch (error) {
        alert(error.message);
        console.error("Borrow error:", error);
    }
  };

  // adminRemoveBorrower - MENGGUNAKAN ENDPOINT BARU
  window.adminRemoveBorrower = async (bookId, borrowingId) => { // Menerima bookId dan borrowingId
    const book = books.find(b => b.id === bookId);
    if (!book) return;
    
    if (!confirm("Yakin ingin mencatat buku ini sudah dikembalikan? (Stok akan bertambah 1)")) return;
    
    try {
        // DELETE ke endpoint baru
        const response = await fetch(`${API_URL}/${bookId}/borrowings/${borrowingId}`, {
            method: 'DELETE'
        });
        
        if (response.status !== 204) {
             // Coba parse JSON error, tapi tangani jika bukan JSON
             const contentType = response.headers.get("content-type");
             let errorMessage = 'Gagal memproses pengembalian buku.';
             if (contentType && contentType.includes("application/json")) {
                 const errorData = await response.json();
                 errorMessage = errorData.message || errorMessage;
             }
             throw new Error(errorMessage);
        }
        
        alert("Buku dicatat sudah dikembalikan dan stok diperbarui.");
        renderBooks(); // Render ulang untuk memuat data stok dan peminjam terbaru
    } catch (error) {
        alert(error.message);
        console.error("Return error:", error);
    }
  };

  // edit book - populate form
  window.adminStartEdit = (id) => {
    const bk = books.find(b => b.id === id);
    if (!bk) return;
    
    editBookId = id; 
    
    f_title.value = bk.title || '';
    f_author.value = bk.author || '';
    f_publisher.value = bk.publisher || '';
    f_year.value = bk.year || '';
    f_category.value = bk.category || '';
    f_stock.value = bk.stock || 0;
    f_description.value = bk.description || '';
    f_status.checked = (bk.status === "Tersedia");
    
    // Set hidden input dengan path cover URL relatif yang ada
   f_existing_cover.value = bk.cover || ''; // Ini akan menjadi URL Cloudinary
    f_cover_file.value = null; 

    bookFormWrap.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // delete book
  window.adminDelete = async (id) => {
    const book = books.find(b => b.id === id);
    if (!book) return;
    
    if (!confirm(`Yakin ingin menghapus buku "${book.title}"? Semua data peminjaman dan file cover fisik juga akan hilang.`)) return;
    
    const success = await deleteBook(id);
    
    if (success) {
        alert("Buku berhasil dihapus.");
        renderBooks(); 
    }
  };

  // initial render
  renderBooks();
});