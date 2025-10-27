let books = JSON.parse(localStorage.getItem("books")) || [];

const form = document.getElementById("bookForm");
const bookList = document.getElementById("bookList");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;

  books.push({ title, author });
  localStorage.setItem("books", JSON.stringify(books));
  renderBooks();
  form.reset();
});

function renderBooks() {
  bookList.innerHTML = books.map((book, i) => `
    <div class="bg-white shadow-lg p-4 rounded">
      <h3 class="font-bold">${book.title}</h3>
      <p class="text-gray-600">${book.author}</p>
      <div class="flex justify-between mt-2">
        <button onclick="editBook(${i})" class="bg-yellow-400 px-2 py-1 rounded">Edit</button>
        <button onclick="deleteBook(${i})" class="bg-red-500 text-white px-2 py-1 rounded">Hapus</button>
      </div>
    </div>
  `).join("");
}

function editBook(index) {
  const newTitle = prompt("Edit judul buku:", books[index].title);
  const newAuthor = prompt("Edit penulis:", books[index].author);
  if (newTitle && newAuthor) {
    books[index] = { title: newTitle, author: newAuthor };
    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
  }
}

function deleteBook(index) {
  if (confirm("Yakin ingin menghapus buku ini?")) {
    books.splice(index, 1);
    localStorage.setItem("books", JSON.stringify(books));
    renderBooks();
  }
}

renderBooks();
