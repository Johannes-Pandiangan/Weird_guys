let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener("DOMContentLoaded", () => {
  const bookListEl = document.getElementById("bookList");
  const searchInput = document.getElementById("searchInput");

  function loadBooks() {
    return JSON.parse(localStorage.getItem("books"))  [];
  }

  function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
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
  render(searchInput.value);
};


function render(filter = "") {
  const books = loadBooks();

  const filtered = books.filter(
    (b) =>
      (b.title || "").toLowerCase().includes(filter.toLowerCase()) ||
      (b.author || "").toLowerCase().includes(filter.toLowerCase())
  );

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  const paginated = filtered.slice(start, end);

  bookListEl.innerHTML = "";

  if (filtered.length === 0) {
    bookListEl.innerHTML = `<div class="col-span-3 text-gray-600">Tidak ada buku ditemukan.</div>`;
    return;
  }

  paginated.forEach((book) => {
    const cover = book.cover
      ? `<img src="${book.cover}" class="w-full h-40 object-cover rounded mb-2">`
      : "";

    bookListEl.insertAdjacentHTML(
      "beforeend",
      `
      <div class="bg-white border rounded p-4 shadow-sm">
        ${cover}
        <h3 class="font-semibold">${book.title}</h3>
        <p class="text-sm mt-2 text-gray-700">${
          book.description
            ? book.description.substring(0, 140) +
              (book.description.length > 140 ? "..." : "")
            : ""
        }</p>
        <p class="text-sm text-gray-600">Penulis: ${book.author}</p>
        <p class="text-sm text-gray-600">Penerbit: ${book.publisher}</p>
        <p class="mt-2 font-medium ${
          book.status === "Tersedia"
            ? "text-green-600"
            : book.stock > 0
            ? "text-yellow-600"
            : "text-red-600"
        }">
          Status: ${book.status} (${book.stock} stok)
        </p>
      </div>
    `
    );
  });

  renderPagination(filtered.length);
}

  searchInput.addEventListener("input", (e) => render(e.target.value));
  render();
});

