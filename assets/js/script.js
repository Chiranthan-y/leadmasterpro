let loggedInUser = "";

document.getElementById("login-btn").addEventListener("click", async () => {
  showSpinner();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await window.api.login(username, password);
  hideSpinner();
  if (response.success) {
    loggedInUser = username; // Store the logged-in username
    document.getElementById("login-page").classList.add("hidden");
    document.getElementById("main-page").style.display = "block";
    document.querySelector(".text-blue-500").innerText = loggedInUser; // Display the logged-in username
  } else {
    document.getElementById("login-status").innerText =
      "Incorrect username or password";
  }
});

document.getElementById("load-data-btn").addEventListener("click", async () => {
  showSpinner();
  const data = await window.api.loadData(loggedInUser); // Pass the logged-in username
  const dropdownOptions = await window.api.loadDropdownOptions();
  createTable(data, dropdownOptions);
  hideSpinner();
});

document.getElementById("save-data-btn").addEventListener("click", async () => {
  showSpinner();
  const data = extractTableData();
  await window.api.saveData(data);
  hideSpinner();
  alert("Data saved!");

  // Reset the border color of all cells to default after saving
  document.querySelectorAll("#table-container td").forEach((cell) => {
    cell.style.border = ""; // Reset border to default
  });

  // Reset the text color of all inputs and selects to default after saving
  document
    .querySelectorAll("#table-container input, #table-container select")
    .forEach((element) => {
      element.style.color = ""; // Reset color to default
    });
});

document.getElementById("logout-btn").addEventListener("click", () => {
  showSpinner();
  document.getElementById("main-page").style.display = "none";
  document.getElementById("login-page").classList.remove("hidden");
  loggedInUser = ""; // Clear the logged-in username on logout
  hideSpinner();

  // Clear the table data
  document.getElementById("table-container").innerHTML = "";
});

document.getElementById("add-row-btn").addEventListener("click", () => {
  const tbody = document.querySelector("#table-container table tbody");
  addEmptyRow(tbody, dropdownOptions, data[0], data.length);
});

//Fucntions

function createTable(dataWithIndex, dropdownOptions) {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  // Create table header
  const headerRow = document.createElement("tr");
  const header = dataWithIndex[0].row;
  header.forEach((headerCell) => {
    const th = document.createElement("th");
    th.innerText = headerCell;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Create table body with input fields or dropdowns
  dataWithIndex.slice(1).forEach(({ row, originalIndex }) => {
    const tr = document.createElement("tr");
    tr.dataset.originalIndex = originalIndex; // Store original index

    row.forEach((cell, colIndex) => {
      const td = document.createElement("td");
      const header = dataWithIndex[0].row[colIndex]; // Get the header name for the column

      if (header === "Ref No" || header === "Counsellor") {
        td.innerText = cell;
      } else if (header === "Follow-up Date") {
        const input = document.createElement("input");
        input.type = "date";
        input.value = cell || new Date().toISOString().split("T")[0];
        td.appendChild(input);
        input.addEventListener("input", () => {
          td.style.border = "2px solid red"; // Highlight the cell while editing
        });
      } else if (dropdownOptions[header]) {
        const select = document.createElement("select");
        dropdownOptions[header].forEach((option) => {
          const optionElement = document.createElement("option");
          optionElement.value = option;
          optionElement.text = option;
          if (option === cell) {
            optionElement.selected = true;
          }
          select.appendChild(optionElement);
        });
        td.appendChild(select);
        select.addEventListener("change", () => {
          td.style.border = "2px solid red"; // Highlight the cell while editing
        });
      } else {
        const input = document.createElement("input");
        input.type = "text";
        input.value = cell;
        td.appendChild(input);
        input.addEventListener("input", () => {
          td.style.border = "2px solid red"; // Highlight the cell while editing
        });
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  tableContainer.appendChild(table);
}

function addEmptyRow(tbody, dropdownOptions, headers, rowCount) {
  const tr = document.createElement("tr");
  headers.forEach((header, colIndex) => {
    const td = document.createElement("td");

    if (header === "Ref No") {
      // Auto-generate Ref No
      const year = new Date().getFullYear();
      const refNo = `${year}|${rowCount}`;
      td.innerText = refNo;
    } else if (header === "Counsellor") {
      // Pre-fill with logged-in user
      td.innerText = loggedInUser;
    } else if (header === "Follow-up Date") {
      // Create a date input with the current date
      const input = document.createElement("input");
      input.type = "date";
      input.value = new Date().toISOString().split("T")[0];
      td.appendChild(input);
      input.addEventListener("input", () => {
        td.style.border = "2px solid red"; // Highlight the cell while editing
      });
    } else if (dropdownOptions[header]) {
      // Create a select element if dropdown options exist for this column
      const select = document.createElement("select");
      dropdownOptions[header].forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.text = option;
        select.appendChild(optionElement);
      });
      td.appendChild(select);
      select.addEventListener("change", () => {
        td.style.border = "2px solid red"; // Highlight the cell while editing
      });
    } else {
      // Otherwise, create a text input
      const input = document.createElement("input");
      input.type = "text";
      td.appendChild(input);
      input.addEventListener("input", () => {
        td.style.border = "2px solid red"; // Highlight the cell while editing
      });
    }
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
}

function showSpinner() {
  document.getElementById("spinner").classList.remove("hidden");
}

function hideSpinner() {
  document.getElementById("spinner").classList.add("hidden");
}

function extractTableData() {
  const table = document.querySelector("#table-container table");
  const rows = Array.from(table.querySelectorAll("tbody tr"));

  const dataWithIndex = rows.map((row, rowIndex) => {
    const cells = Array.from(row.querySelectorAll("td"));
    const rowData = cells.map((cell, colIndex) => {
      const input = cell.querySelector("input, select");
      const originalValue = input ? input.defaultValue : cell.innerText;
      const currentValue = input ? input.value : cell.innerText;

      // Check if the current value is different from the original value
      if (currentValue !== originalValue) {
        cell.style.border = "2px solid red"; // Highlight the cell with a red border
      }

      return currentValue;
    });

    return { originalIndex: row.dataset.originalIndex, rowData };
  });

  return dataWithIndex;
}
