let loggedInUser = "";

document.getElementById("login-btn").addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await window.api.login(username, password);
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
  const data = await window.api.loadData(loggedInUser); // Pass the logged-in username
  const dropdownOptions = await window.api.loadDropdownOptions();
  createTable(data, dropdownOptions);
});

document.getElementById("save-data-btn").addEventListener("click", async () => {
  const data = extractTableData();
  await window.api.saveData(data);
  alert("Data saved!");
});

document.getElementById("logout-btn").addEventListener("click", () => {
  document.getElementById("main-page").style.display = "none";
  document.getElementById("login-page").classList.remove("hidden");
  loggedInUser = ""; // Clear the logged-in username on logout
});

function createTable(data, dropdownOptions) {
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

  // Create table body with input fields or dropdowns
  data.slice(1).forEach((row, rowIndex) => {
    const tr = document.createElement("tr");

    row.forEach((cell, colIndex) => {
      const td = document.createElement("td");
      const header = data[0][colIndex]; // Get the header name for the column

      if (header === "Ref No" || header === "Counsellor") {
        // Make Ref No and Counsellor cells non-editable
        td.innerText = cell;
      } else if (header === "Follow-up Date") {
        // Create a date input for Follow-up Date
        const input = document.createElement("input");
        input.type = "date";
        input.value = cell || new Date().toISOString().split("T")[0];
        td.appendChild(input);
      } else if (dropdownOptions[header]) {
        // Create a select element if dropdown options exist for this column
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
      } else {
        // Otherwise, create a text input
        const input = document.createElement("input");
        input.type = "text";
        input.value = cell;
        td.appendChild(input);
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  // Add an empty row for new data with auto-generated Ref No
  // addEmptyRow(tbody, dropdownOptions, data[0], data.length);

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
