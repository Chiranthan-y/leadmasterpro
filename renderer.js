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
  const dropdownOptions = await window.api.loadDropdownOptions();
  createTable(data, dropdownOptions);
});

document.getElementById("save-data-btn").addEventListener("click", async () => {
  const data = extractTableData();
  await window.api.saveData(data);
  alert("Data saved!");
});

document.getElementById("logout-btn").addEventListener("click", () => {
  document.getElementById("main-page").classList.add("hidden");
  document.getElementById("login-page").classList.remove("hidden");
});

function createTable(data, dropdownOptions) {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headerRow = document.createElement("tr");
  data[0].forEach((header) => {
    const th = document.createElement("th");
    th.innerText = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  data.slice(1).forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell, colIndex) => {
      const td = document.createElement("td");
      if (dropdownOptions[colIndex]) {
        const select = document.createElement("select");
        dropdownOptions[colIndex].forEach((option) => {
          const optionElement = document.createElement("option");
          optionElement.value = option;
          optionElement.text = option;
          if (option === cell) {
            optionElement.selected = true;
          }
          select.appendChild(optionElement);
        });
        td.appendChild(select);
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.value = cell;
        td.appendChild(input);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  addEmptyRow(tbody, dropdownOptions);

  table.appendChild(thead);
  table.appendChild(tbody);
  tableContainer.appendChild(table);
}

function addEmptyRow(tbody, dropdownOptions) {
  const tr = document.createElement("tr");
  const headers = document.querySelectorAll("#table-container table thead th");
  headers.forEach((_, colIndex) => {
    const td = document.createElement("td");
    if (dropdownOptions[colIndex]) {
      const select = document.createElement("select");
      dropdownOptions[colIndex].forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.text = option;
        select.appendChild(optionElement);
      });
      td.appendChild(select);
    } else {
      const input = document.createElement("input");
      input.type = "text";
      td.appendChild(input);
    }
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
}

function extractTableData() {
  const table = document.querySelector("#table-container table");
  const data = [];
  const rows = table.querySelectorAll("tr");

  rows.forEach((row) => {
    const rowData = [];
    row.querySelectorAll("td").forEach((cell) => {
      const input = cell.querySelector("input, select");
      rowData.push(input.value);
    });
    data.push(rowData);
  });

  return data;
}
