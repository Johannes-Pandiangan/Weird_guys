document.addEventListener("DOMContentLoaded", () => {


  let books = JSON.parse(localStorage.getItem("books")) || [];
  let editIndex = -1; 

  // Elements
  const bookListEl = document.getElementById("bookList");
  const toggleAddFormBtn = document.getElementById("toggleAddForm");
  const bookFormWrap = document.getElementById("bookFormWrap");
  const bookForm = document.getElementById("bookForm");
  const cancelEditBtn = document.getElementById("cancelEdit");

  // Inputs
  const f_title = document.getElementById("f_title");
  const f_author = document.getElementById("f_author");
  const f_publisher = document.getElementById("f_publisher");
  const f_year = document.getElementById("f_year");
  const f_category = document.getElementById("f_category");
  const f_cover = document.getElementById("f_cover");
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

  // Load & render
  function saveBooks() {
    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
  }

  function renderBooks() {
    bookListEl.innerHTML = "";
    if (books.length === 0) {
      bookListEl.innerHTML = `<div class="col-span-3 text-gray-600">Belum ada buku. Tambah menggunakan tombol di atas.</div>`;
      return;
    }

    books.forEach((book, i) => {
      const statusClass = (book.status === "Tersedia") ? "text-green-600" : (book.stock > 0 ? "text-yellow-600" : "text-red-600");
      const cover = book.cover ? `<img src="${escapeHtml(book.cover)}" alt="cover" class="w-full h-44 object-cover rounded mb-2">` : '';
      const borrowersHtml = (book.borrowers && book.borrowers.length > 0)
        ? `<div class="mt-2 border-t pt-2 text-sm text-gray-700">
            <strong>Daftar peminjam:</strong>
            <ul class="mt-1 space-y-1">${book.borrowers.map((b, idx) => `<li>${escapeHtml(b.name)} — ${escapeHtml(b.phone)} <button onclick="adminRemoveBorrower(${i}, ${idx})" class="ml-2 text-xs text-red-600">hapus</button></li>`).join('')}</ul>
           </div>`
        : '';

      bookListEl.insertAdjacentHTML('beforeend', `
        <div class="bg-white border rounded p-4 shadow-sm">
          ${cover}
          <h3 class="font-semibold text-lg">${escapeHtml(book.title)}</h3>
          <p class="text-sm text-gray-600">${escapeHtml(book.author)} • ${escapeHtml(book.publisher || '')} ${book.year ? '• ' + escapeHtml(book.year) : ''}</p>
          <p class="mt-2 text-sm text-gray-700">${escapeHtml(book.description || '').substring(0, 180)}${(book.description && book.description.length>180)?'...':''}</p>

          <div class="mt-3 flex items-center justify-between">
            <div class="text-sm ${statusClass} font-medium">Status: ${escapeHtml(book.status)} (${book.stock} stok)</div>
            <div class="flex gap-2">
              <button onclick="adminShowBorrowForm(${i})" class="px-2 py-1 bg-yellow-400 text-sm rounded">Pinjam</button>
              <button onclick="adminStartEdit(${i})" class="px-2 py-1 bg-blue-500 text-white text-sm rounded">Edit</button>
              <button onclick="adminDelete(${i})" class="px-2 py-1 bg-red-500 text-white text-sm rounded">Hapus</button>
            </div>
          </div>

          ${borrowersHtml}

          <!-- area borrow form inline (hidden by default) -->
          <div id="borrowForm-${i}" class="mt-3 hidden bg-gray-50 p-3 rounded border">
            <div class="text-sm mb-2">Masukkan data peminjam untuk buku ini:</div>
            <input id="bname-${i}" placeholder="Nama peminjam" class="p-2 border rounded w-full mb-2" />
            <input id="bphone-${i}" placeholder="No. telepon" class="p-2 border rounded w-full mb-2" />
            <div class="flex justify-end gap-2">
              <button onclick="adminCancelBorrow(${i})" class="px-3 py-1 border rounded">Batal</button>
              <button onclick="adminConfirmBorrow(${i})" class="px-3 py-1 bg-indigo-600 text-white rounded">Konfirmasi Pinjam</button>
            </div>
          </div>
        </div>
      `);
    });
  }

  // Helpers for escaping
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  // Add / Edit form submit
  bookForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newBook = {
      title: f_title.value.trim(),
      author: f_author.value.trim(),
      publisher: f_publisher.value.trim(),
      year: f_year.value ? Number(f_year.value) : null,
      category: f_category.value.trim(),
      cover: f_cover.value.trim(),
      stock: Number(f_stock.value) || 0,
      description: f_description.value.trim(),
      status: f_status.checked ? "Tersedia" : (Number(f_stock.value) > 0 ? "Tersedia" : "Habis"),
      borrowers: []
    };

    if (!newBook.title) return alert("Judul wajib diisi");
    if (editIndex >= 0) {
      // keep existing borrowers when editing
      newBook.borrowers = books[editIndex].borrowers || [];
      books[editIndex] = newBook;
      alert("Buku diperbarui");
    } else {
      books.push(newBook);
      alert("Buku ditambahkan");
    }

    editIndex = -1;
    resetForm();
    saveBooks();
    bookFormWrap.classList.add("hidden");
  });

  function resetForm() {
    bookForm.reset();
    f_status.checked = true;
    editIndex = -1;
  }

  // Admin actions (exposed to global for inline onclick)
  window.adminShowBorrowForm = (index) => {
    // show borrow form for index
    const el = document.getElementById(`borrowForm-${index}`);
    if (!el) return;
    el.classList.remove('hidden');
  };

  window.adminCancelBorrow = (index) => {
    const el = document.getElementById(`borrowForm-${index}`);
    if (el) el.classList.add('hidden');
  };

  window.adminConfirmBorrow = (index) => {
    const nameInput = document.getElementById(`bname-${index}`);
    const phoneInput = document.getElementById(`bphone-${index}`);
    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();
    if (!name) return alert("Nama peminjam wajib diisi");
    if (!phone) return alert("Nomor telepon wajib diisi");

    const book = books[index];
    if (book.stock <= 0) return alert("Stok habis, tidak bisa dipinjam");

    // add borrower entry
    const borrower = { name, phone, date: new Date().toLocaleString() };
    book.borrowers = book.borrowers || [];
    book.borrowers.push(borrower);
    book.stock = Number(book.stock) - 1;

    // status update
    book.status = (book.stock > 0) ? "Tersedia" : "Dipinjam";

    saveBooks();
    alert(`Buku "${book.title}" dipinjam oleh ${name}`);
  };

  // remove borrower (admin can remove single borrower and increase stock)
  window.adminRemoveBorrower = (bookIndex, borrowerIndex) => {
    const book = books[bookIndex];
    if (!book || !book.borrowers || !book.borrowers[borrowerIndex]) return;
    if (!confirm("Hapus data peminjam ini (artinya buku dikembalikan untuk 1 eksemplar)?")) return;
    // remove and increment stock
    book.borrowers.splice(borrowerIndex, 1);
    book.stock = Number(book.stock) + 1;
    book.status = (book.stock > 0) ? "Tersedia" : "Dipinjam";
    saveBooks();
  };

  // edit book - populate form
  window.adminStartEdit = (index) => {
    const bk = books[index];
    if (!bk) return;
    editIndex = index;
    f_title.value = bk.title || '';
    f_author.value = bk.author || '';
    f_publisher.value = bk.publisher || '';
    f_year.value = bk.year || '';
    f_isbn.value = bk.isbn || '';
    f_category.value = bk.category || '';
    f_pages.value = bk.pages || '';
    f_cover.value = bk.cover || '';
    f_stock.value = bk.stock || 0;
    f_description.value = bk.description || '';
    f_status.checked = (bk.status === "Tersedia");
    bookFormWrap.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // delete book
  window.adminDelete = (index) => {
    if (!confirm("Yakin ingin menghapus buku ini? Semua data peminjaman juga akan hilang.")) return;
    books.splice(index, 1);
    saveBooks();
  };

  // initial render
  renderBooks();
});
