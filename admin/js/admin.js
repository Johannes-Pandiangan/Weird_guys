let currentPage = 1;
const itemsPerPage = 15;

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

  function renderPagination() {
  const totalPages = Math.ceil(books.length / itemsPerPage);
  const pagEl = document.getElementById("pagination");

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


function renderBooks() {
  bookListEl.innerHTML = "";

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  const paginatedBooks = books.slice(start, end);

  if (books.length === 0) {
    bookListEl.innerHTML = `<div class="col-span-3 text-gray-600">Belum ada buku.</div>`;
    return;
  }

  paginatedBooks.forEach((book, i) => {
    const realIndex = start + i;

    const statusClass =
      book.status === "Tersedia"
        ? "text-green-600"
        : book.stock > 0
        ? "text-yellow-600"
        : "text-red-600";

    const cover = book.cover
      ? `<img src="${escapeHtml(book.cover)}" class="w-full h-44 object-cover rounded mb-2">`
      : "";

    bookListEl.insertAdjacentHTML(
      "beforeend",
      `
      <div class="bg-white border rounded p-4 shadow-sm">
        ${cover}
        <h3 class="font-semibold text-lg">${escapeHtml(book.title)}</h3>
        <p class="text-sm text-gray-600">${escapeHtml(book.author || "")}</p>

        <div class="mt-3 flex items-center justify-between">
          <div class="text-sm ${statusClass}">Status: ${book.status} (${book.stock})</div>

          <div class="flex gap-2">
            <button onclick="adminShowBorrowForm(${realIndex})" class="px-2 py-1 bg-yellow-400 text-sm rounded">Pinjam</button>
            <button onclick="adminStartEdit(${realIndex})" class="px-2 py-1 bg-blue-500 text-white text-sm rounded">Edit</button>
            <button onclick="adminDelete(${realIndex})" class="px-2 py-1 bg-red-500 text-white text-sm rounded">Hapus</button>
          </div>
        </div>
      </div>
    `
    );
  });

  renderPagination();
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

