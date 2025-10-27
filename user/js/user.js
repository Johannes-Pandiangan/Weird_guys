document.addEventListener("DOMContentLoaded", () => {
  const books = JSON.parse(localStorage.getItem("books")) || [];
  const bookContainer = document.getElementById("bookContainer");
  const searchInput = document.getElementById("searchInput");

  function renderBooks(filter = "") {
    const filteredBooks = books.filter(book => 
      book.title.toLowerCase().includes(filter.toLowerCase())
    );

    bookContainer.innerHTML = filteredBooks.map(book => `
      <div class="bg-white shadow-lg p-4 rounded">
        <h3 class="font-bold text-lg">${book.title}</h3>
        <p class="text-gray-600">Penulis: ${book.author}</p>
        <button class="bg-blue-500 text-white px-3 py-1 mt-2 rounded hover:bg-blue-600">Pinjam</button>
      </div>
    `).join("");
  }

  searchInput.addEventListener("input", e => renderBooks(e.target.value));
  renderBooks();
});
