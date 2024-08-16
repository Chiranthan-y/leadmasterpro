document.getElementById("login-btn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await window.api.login(username, password);
  if (response.success) {
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("main-page").classList.remove("hidden");
  } else {
    document.getElementById("login-status").innerText =
      "Incorrect username or password";
  }
});

document.getElementById("load-data-btn").addEventListener("click", async () => {
  const data = await window.api.loadData();
  createTable(data);
});

document.getElementById("save-data-btn").addEventListener("click", async () => {
  const data = extractTableData();
  await window.api.saveData(data);
});

document.getElementById("add-row-btn").addEventListener("click", () => {
  addEmptyRow();
});

document.getElementById("logout-btn").addEventListener("click", () => {
  document.getElementById("main-page").classList.add("hidden");
  document.getElementById("login-page").classList.remove("hidden");
});

function createTable(data) {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  // Create table header
  const headerRow = document.createElement("tr");
  data[0].forEach((header) => {
    const th = document.createElement("th");
    th.innerText = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Create table body with input fields
  data.slice(1).forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "text";
      input.value = cell;
      td.appendChild(input);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  // Add an empty row for new data
  addEmptyRow(tbody);

  table.appendChild(thead);
  table.appendChild(tbody);
  tableContainer.appendChild(table);
}

function addEmptyRow(tbody) {
  const tr = document.createElement("tr");
  const headers = document.querySelectorAll("#table-container table thead th");
  headers.forEach(() => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    td.appendChild(input);
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
}

function extractTableData() {
  const table = document.querySelector("#table-container table");
  const data = [];

  const headers = document.querySelectorAll("#table-container table thead th");
  const headerRow = [];
  headers.forEach((th) => {
    headerRow.push(th.innerText);
  });
  data.push(headerRow);

  const rows = document.querySelectorAll("#table-container table tbody tr");
  rows.forEach((row) => {
    const rowData = [];
    const cells = row.querySelectorAll("td input");
    cells.forEach((cell) => {
      rowData.push(cell.value);
    });
    data.push(rowData);
  });

  return data;
}
