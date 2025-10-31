document.addEventListener("DOMContentLoaded", () => {
  const books = JSON.parse(localStorage.getItem("books")) || [];
  const bookList = document.getElementById("bookList");
  const searchInput = document.getElementById("searchInput");

  function displayBooks(filter = "") {
    bookList.innerHTML = "";
    const filtered = books.filter(b => b.title.toLowerCase().includes(filter.toLowerCase()));
    filtered.forEach(book => {
      const statusClass = book.status === "Tersedia" ? "text-green-600" : "text-red-600";
      const card = `
        <div class="border p-4 rounded shadow bg-white">
          <h3 class="font-semibold text-lg">${book.title}</h3>
          <p class="text-gray-700">${book.author}</p>
          <p class="${statusClass} font-medium mt-2">${book.status}</p>
        </div>`;
      bookList.innerHTML += card;
    });
  }

  displayBooks();
  searchInput.addEventListener("input", (e) => displayBooks(e.target.value));
});
