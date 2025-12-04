document.addEventListener("DOMContentLoaded", () => {
  const bookListEl = document.getElementById("bookList");
  const searchInput = document.getElementById("searchInput");
  const API_URL = /*"https://weird-guys-five.vercel.app/api/books";*/"http://localhost:5000/api/books"; 

  let currentPage = 1;
  const itemsPerPage = 10;
  let allBooks = []; 

  async function fetchBooks() {
    try {
      const response = await fetch(API_URL); 
      if (!response.ok) {
        throw new Error('Gagal mengambil data buku dari server.');
      }
      allBooks = await response.json(); 
    } catch (error) {
      console.error("Error fetching books:", error);
      allBooks = []; 
    }
  }

  async function render(filter = "") {
    await fetchBooks(); 
    const books = allBooks; 

    const filtered = books.filter(
      (b) =>
        (b.title || "").toLowerCase().includes(filter.toLowerCase()) ||
        (b.author || "").toLowerCase().includes(filter.toLowerCase()) ||
        (b.category || "").toLowerCase().includes(filter.toLowerCase())
    );

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    const paginated = filtered.slice(start, end);

    bookListEl.innerHTML = "";

    if (filtered.length === 0) {
      bookListEl.innerHTML = `
        <div class="col-span-3 text-gray-600">Tidak ada buku ditemukan.</div>
      `;
      renderPagination(0);
      return;
    }

    paginated.forEach((book) => {
      // MODIFIKASI: Gunakan wrapper div untuk object-contain dan tinggi yang seragam
      const coverUrl = book.cover ? book.cover : null;
      const cover = coverUrl
        ? `
            <div class="w-full h-56 bg-gray-100 flex items-center justify-center rounded mb-2 overflow-hidden border border-gray-300">
                <img src="${coverUrl}" class="h-full w-auto object-contain">
            </div>
          `
        : "";

      const statusClass =
        book.status === "Tersedia"
          ? "text-green-600"
          : book.stock > 0
          ? "text-yellow-600"
          : "text-red-600";

      bookListEl.insertAdjacentHTML(
        "beforeend",
        `
        <div class="bg-white border rounded p-4 shadow-sm">
          ${cover}
          <h3 class="font-semibold">${book.title}</h3>

          <p class="text-sm mt-2 text-gray-700">
            ${
              book.description
                ? book.description.substring(0, 140) +
                  (book.description.length > 140 ? "..." : "")
                : ""
            }
          </p>

          <p class="text-sm text-gray-700">Penulis: ${book.author}</p>
          <p class="text-sm text-gray-700">Penerbit: ${book.publisher}</p>

          <p class="mt-2 font-medium ${statusClass}">
            Status: ${book.status} (${book.stock} stok)
          </p>
        </div>
      `
      );
    });

    renderPagination(filtered.length);
  }

  function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagEl = document.getElementById("pagination");

    if (!pagEl) return;

    pagEl.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
      pagEl.insertAdjacentHTML(
        "beforeend",
        `
        <button
          class="px-3 py-1 border rounded ${
            i === currentPage ? "bg-indigo-600 text-white" : "bg-white"
          }"
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

  searchInput.addEventListener("input", (e) => {
    currentPage = 1;
    render(e.target.value);
  });

  render();
});