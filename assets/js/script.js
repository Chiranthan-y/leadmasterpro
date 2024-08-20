let loggedInUser = "";

// Event listener for login button
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

// Event listener for loading data
document.getElementById("load-data-btn").addEventListener("click", async () => {
  showSpinner();
  const data = await window.api.loadData(loggedInUser); // Pass the logged-in username
  const dropdownOptions = await window.api.loadDropdownOptions();
  createTable(data, dropdownOptions);
  hideSpinner();
});

document.getElementById("save-data-btn").addEventListener("click", async () => {
  showSpinner();

  const dataWithIndex = extractTableDataWithIndex();
  try {
    const response = await window.api.saveData(dataWithIndex);
    if (response.success) {
      hideSpinner();
      alert("Data saved successfully!");

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
    } else {
      throw new Error("Data save failed!");
    }
  } catch (error) {
    hideSpinner();
    alert("Error saving data: " + error.message);
  }
});

// Event listener for logout button
document.getElementById("logout-btn").addEventListener("click", () => {
  showSpinner();
  document.getElementById("main-page").style.display = "none";
  document.getElementById("login-page").classList.remove("hidden");
  loggedInUser = ""; // Clear the logged-in username on logout
  hideSpinner();

  // Clear the table data
  document.getElementById("table-container").innerHTML = "";
});

// Event listener for adding a new row
document.getElementById("add-row-btn").addEventListener("click", () => {
  const tbody = document.querySelector("#table-container table tbody");
  addEmptyRow(tbody, dropdownOptions, data[0], data.length);
});

// Event listener for the search box
document.getElementById("search-box").addEventListener("input", function () {
  const searchValue = this.value.toLowerCase();
  const table = document.querySelector("#table-container table");
  const rows = Array.from(table.querySelectorAll("tbody tr"));

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"));
    const rowText = cells
      .map((cell) => {
        const inputElement = cell.querySelector("input, select");
        return inputElement
          ? inputElement.value.toLowerCase()
          : cell.innerText.toLowerCase();
      })
      .join(" ");

    if (rowText.includes(searchValue)) {
      row.style.display = ""; // Show row
    } else {
      row.style.display = "none"; // Hide row
    }
  });
});
//Fucntions

function createTable(dataWithIndex, dropdownOptions) {
  const tableContainer = document.getElementById("table-container");
  tableContainer.innerHTML = "";

  const table = document.createElement("table");
  table.className = "min-w-full divide-y divide-gray-200";
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  // Create table header
  const headerRow = document.createElement("tr");
  const filterRow = document.createElement("tr");
  const headers = dataWithIndex[0].row;

  headers.forEach((headerCell, colIndex) => {
    // Header cell
    const th = document.createElement("th");
    th.className =
      "px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
    th.innerText = headerCell;
    headerRow.appendChild(th);

    // Filter cell
    const filterTh = document.createElement("th");
    filterTh.className =
      "px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";

    const filterSelect = document.createElement("select");
    filterSelect.className = "w-full px-2 py-1 border border-gray-300 rounded";
    filterSelect.innerHTML = `<option value="">Filter ${headerCell}</option>`;

    // Generate unique options for the dropdown filter
    const uniqueValues = new Set(
      dataWithIndex.slice(1).map(({ row }) => row[colIndex])
    );

    uniqueValues.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.text = value;
      filterSelect.appendChild(option);
    });

    filterSelect.addEventListener("change", () => {
      filterTable(colIndex, filterSelect.value.toLowerCase());
    });

    filterTh.appendChild(filterSelect);
    filterRow.appendChild(filterTh);
  });

  thead.appendChild(headerRow);
  thead.appendChild(filterRow);

  // Create table body with input fields or dropdowns
  dataWithIndex.slice(1).forEach(({ row, originalIndex }) => {
    const tr = document.createElement("tr");
    tr.dataset.originalIndex = originalIndex; // Store original index

    row.forEach((cell, colIndex) => {
      const td = document.createElement("td");
      td.className = "px-6 py-4 whitespace-nowrap";
      const header = headers[colIndex]; // Get the header name for the column

      if (
        header === "Ref No" ||
        header === "Counsellor" ||
        header === "Name" ||
        header === "Contact Number" ||
        header === "Email Id"
      ) {
        td.innerText = cell;
      } else if (header === "Follow-up Date") {
        const input = document.createElement("input");
        input.type = "date";
        input.value = cell || new Date().toISOString().split("T")[0];
        input.className = "w-full px-2 py-1 border border-gray-300 rounded";
        td.appendChild(input);
        input.addEventListener("input", () => {
          td.style.border = "2px solid red"; // Highlight the cell while editing
        });
      } else if (dropdownOptions[header]) {
        const select = document.createElement("select");
        select.className =
          "w-full h-8 px-2 py-1 border border-gray-300 rounded";
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
        input.className = "w-full px-2 py-1 rounded";
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
      // Keep Counsellor cell empty or pre-filled with logged-in user
      td.innerText = LoggedInUser;
    } else if (header === "Follow-up Date") {
      // Create a date input with the current date
      const input = document.createElement("input");
      input.type = "date";
      input.value = new Date().toISOString().split("T")[0];
      td.appendChild(input);
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
    } else {
      // Otherwise, create a text input
      const input = document.createElement("input");
      input.type = "text";
      td.appendChild(input);
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

function extractTableDataWithIndex() {
  const table = document.querySelector("#table-container table");
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const extractedData = [];

  rows.forEach((row) => {
    const originalIndex = row.dataset.originalIndex;
    const rowData = [];
    const cells = Array.from(row.querySelectorAll("td"));

    cells.forEach((cell) => {
      const inputElement = cell.querySelector("input, select");

      if (inputElement) {
        rowData.push(inputElement.value); // Get value from input or select
      } else {
        rowData.push(cell.innerText); // Get inner text for non-editable cells
      }
    });

    extractedData.push({ originalIndex, rowData });
  });

  return extractedData;
}

function filterTable(colIndex, filterValue) {
  const table = document.querySelector("#table-container table");
  const rows = Array.from(table.querySelectorAll("tbody tr"));

  rows.forEach((row) => {
    const cells = Array.from(row.querySelectorAll("td"));
    let cellValue = cells[colIndex].innerText.toLowerCase();

    // If there's an input or select element, get its value
    const inputElement = cells[colIndex].querySelector("input, select");
    if (inputElement) {
      cellValue = inputElement.value.toLowerCase();
    }

    if (!filterValue || cellValue.includes(filterValue)) {
      row.style.display = ""; // Show row
    } else {
      row.style.display = "none"; // Hide row
    }
  });
}
