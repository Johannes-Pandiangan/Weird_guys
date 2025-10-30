document.addEventListener("DOMContentLoaded", () => {
  let books = JSON.parse(localStorage.getItem("books")) || [];

  function saveBooks() {
    localStorage.setItem("books", JSON.stringify(books));
    displayBooks();
  }

  function displayBooks() {
    const bookList = document.getElementById("bookList");
    bookList.innerHTML = "";
    books.forEach((book, i) => {
      bookList.innerHTML += `
        <div class="border p-4 rounded bg-white shadow">
          <h3 class="font-semibold text-lg">${book.title}</h3>
          <p class="text-gray-700">${book.author}</p>
          <p class="font-medium mt-2 ${book.status === "Tersedia" ? "text-green-600" : "text-red-600"}">
            Status: ${book.status}
          </p>
          ${book.status === "Dipinjam" ? `
            <div class="mt-2 text-sm text-gray-600 border-t pt-2">
              <p><strong>Peminjam:</strong> ${book.borrowerName}</p>
              <p><strong>Telepon:</strong> ${book.borrowerPhone}</p>
            </div>
          ` : ""}
          <div class="flex gap-2 mt-3">
            <button onclick="toggleStatus(${i})" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm">Ubah Status</button>
            <button onclick="editBook(${i})" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">Edit</button>
            <button onclick="deleteBook(${i})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Hapus</button>
          </div>
        </div>`;
    });
  }

  document.getElementById("addBookForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const author = document.getElementById("author").value;
    books.push({ title, author, status: "Tersedia", borrowerName: "", borrowerPhone: "" });
    saveBooks();
    e.target.reset();
  });

  // Ubah status peminjaman
  window.toggleStatus = (i) => {
    const book = books[i];
    if (book.status === "Tersedia") {
      const borrowerName = prompt("Masukkan nama peminjam:");
      if (!borrowerName) return alert("Nama peminjam wajib diisi!");
      const borrowerPhone = prompt("Masukkan nomor telepon peminjam:");
      if (!borrowerPhone) return alert("Nomor telepon wajib diisi!");
      book.status = "Dipinjam";
      book.borrowerName = borrowerName;
      book.borrowerPhone = borrowerPhone;
    } else {
      if (confirm(`Tandai buku "${book.title}" sudah dikembalikan?`)) {
        book.status = "Tersedia";
        book.borrowerName = "";
        book.borrowerPhone = "";
      }
    }
    saveBooks();
  };

  // Edit buku
  window.editBook = (i) => {
    const newTitle = prompt("Judul baru:", books[i].title);
    const newAuthor = prompt("Penulis baru:", books[i].author);
    if (newTitle && newAuthor) {
      books[i].title = newTitle;
      books[i].author = newAuthor;
      saveBooks();
    }
  };

  // Hapus buku
  window.deleteBook = (i) => {
    if (confirm("Yakin ingin menghapus buku ini?")) {
      books.splice(i, 1);
      saveBooks();
    }
  };

  displayBooks();
});
