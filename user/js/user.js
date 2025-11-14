document.addEventListener("DOMContentLoaded", () => {
  const bookListEl = document.getElementById("bookList");
  const searchInput = document.getElementById("searchInput");

  function loadBooks() {
    return JSON.parse(localStorage.getItem("books"))  [];
  }

  function render(filter = "") {
    const books = loadBooks();
    const filtered = books.filter(b => (b.title  "").toLowerCase().includes(filter.toLowerCase())  (b.author  "").toLowerCase().includes(filter.toLowerCase()));
    bookListEl.innerHTML = "";
    if (filtered.length === 0) {
      bookListEl.innerHTML = <div class="col-span-3 text-gray-600">Tidak ada buku ditemukan.</div>;
      return;
    }

    filtered.forEach((book) => {
      const cover = book.cover ? <img src="${book.cover}" alt="cover" class="w-full h-40 object-cover rounded mb-2"> : '';
      const statusClass = (book.status === "Tersedia") ? "text-green-600" : (book.stock > 0 ? "text-yellow-600" : "text-red-600");
      const borrowersHtml = (book.borrowers && book.borrowers.length > 0)
        ? <div class="mt-2 text-sm text-gray-600">
           </div>
        : '';
      bookListEl.insertAdjacentHTML('beforeend', 
        <div class="bg-white border rounded p-4 shadow-sm">
          ${cover}
          <h3 class="font-semibold">${book.title}</h3>
          <p class="text-sm mt-2 text-gray-700">${book.description ? book.description.substring(0, 140) + (book.description.length>140?'...':'') : ''}</p><br>
          <p class="text-sm text-gray-1500">Penulis: ${book.author}</p>
          <p class="text-sm text-gray-1500">Penerbit: ${book.publisher}</p>
          <p class="mt-2 ${statusClass} font-medium">Status: ${book.status} (${book.stock} stok)</p>
          ${borrowersHtml}
        </div>
      );
    });
  }

  searchInput.addEventListener("input", (e) => render(e.target.value));
  render();
});
