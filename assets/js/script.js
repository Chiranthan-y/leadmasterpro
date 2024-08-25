let loggedInUser = "Counsellor2";
const NonEditable = ["Ref No", "Counsellor", "Contact Number"];

// Header fields to be displayed in the accordion header
const headerFields = [
  "Ref No",
  "Counsellor",
  "Name",
  "Contact Number",
  "Email Id",
  "Call Remarks",
  "Follow-up Date",
];

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
  try {
    const data = await window.api.loadData(loggedInUser); // Pass the logged-in username
    const dropdownOptions = await window.api.loadDropdownOptions();
    createAccordion(data, dropdownOptions);
  } catch (error) {
    console.error("Error loading data:", error);
  } finally {
    hideSpinner();
  }
});

// Create accordion structure
function createAccordion(data, dropdownOptions) {
  const accordionContainer = document.getElementById("accordion-container");
  accordionContainer.innerHTML = ""; // Clear previous content

  data.forEach(({ rowData, originalIndex }, index) => {
    // Create accordion header (non-editable and editable fields)
    const header = document.createElement("div");
    header.className =
      "accordion-header bg-gray-200 px-4 py-2 cursor-pointer rounded flex justify-between items-center";
    header.setAttribute("data-original-index", originalIndex);

    let headerHtml = "";
    headerFields.forEach((field) => {
      if (field === "Follow-up Date") {
        // Editable date input field
        headerHtml += `
          <div class="col-span-1">
            <label class="block text-gray-700">${field}</label>
            <input type="date" value="${
              rowData[field] || ""
            }" class="w-full px-3 py-2 border border-gray-300 rounded editable-field" />
          </div>
        `;
      } else if (NonEditable.includes(field)) {
        // Non-editable fields displayed as labels
        headerHtml += `
          <div class="col-span-1">
            <label class="block text-gray-700">${field}</label>
            <span class="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded">${
              rowData[field] || ""
            }</span>
          </div>
        `;
      } else if (dropdownOptions[field]) {
        // Editable dropdown fields
        headerHtml += `
          <div class="col-span-1">
            <label class="block text-gray-700">${field}</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded editable-field">
              ${dropdownOptions[field]
                .map(
                  (option) =>
                    `<option value="${option}" ${
                      option === rowData[field] ? "selected" : ""
                    }>${option}</option>`
                )
                .join("")}
            </select>
          </div>
        `;
      } else {
        // Editable text input fields
        headerHtml += `
          <div class="col-span-1">
            <label class="block text-gray-700">${field}</label>
            <input type="text" value="${
              rowData[field] || ""
            }" class="w-full px-3 py-2 border border-gray-300 rounded editable-field" />
          </div>
        `;
      }
    });

    headerHtml += `<div class="col-span-1 flex items-center justify-end">
                    <button type="button" class="save-row bg-blue-500 text-white px-4 py-2 rounded mr-2" data-index="${originalIndex}">Save</button>
                  </div>`;

    header.innerHTML = `
      <div class="grid grid-cols-4 gap-4 w-full">${headerHtml}</div>
      <div class="flex items-center">
        <button class="accordion-toggle">▼</button>
      </div>
    `;

    // Create accordion content (editable form for remaining fields)
    const content = document.createElement("div");
    content.className = "accordion-content bg-white px-4 py-2 hidden";
    content.innerHTML = generateForm(
      rowData,
      dropdownOptions,
      headerFields,
      originalIndex
    );

    // Toggle accordion content visibility when clicking the accordion-toggle button
    header.querySelector(".accordion-toggle").addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent other event handlers on the header from firing
      content.classList.toggle("hidden");
    });

    // Add event listener to each editable field for highlighting
    header.querySelectorAll(".editable-field").forEach((input) => {
      input.addEventListener("input", () => {
        header.classList.add("bg-yellow-100"); // Highlight the row when editing
      });
    });

    // Append header and content to accordion container
    accordionContainer.appendChild(header);
    accordionContainer.appendChild(content);
  });
}

function generateForm(row, dropdownOptions, headerFields, originalIndex) {
  const fields = Object.keys(row).filter(
    (field) => !headerFields.includes(field)
  );

  // Determine the number of columns in the grid based on the number of fields
  const columns = fields.length > 3 ? 3 : fields.length;
  let formHtml = `<form class="grid grid-cols-${columns} gap-4">`;

  fields.forEach((field) => {
    if (field === "Follow-up Date") {
      formHtml += `
        <div class="col-span-1">
          <label class="block text-gray-700">${field}</label>
          <input type="date" value="${
            row[field] || ""
          }" class="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>
      `;
    } else if (dropdownOptions[field]) {
      formHtml += `
        <div class="col-span-1">
          <label class="block text-gray-700">${field}</label>
          <select class="w-full px-3 py-2 border border-gray-300 rounded">
            ${dropdownOptions[field]
              .map(
                (option) =>
                  `<option value="${option}" ${
                    option === row[field] ? "selected" : ""
                  }>${option}</option>`
              )
              .join("")}
          </select>
        </div>
      `;
    } else {
      formHtml += `
        <div class="col-span-1">
          <label class="block text-gray-700">${field}</label>
          <input type="text" value="${
            row[field] || ""
          }" class="w-full px-3 py-2 border border-gray-300 rounded" />
        </div>
      `;
    }
  });

  formHtml += `</form>`;
  return formHtml;
}

// Event listener for saving individual rows
document
  .getElementById("accordion-container")
  .addEventListener("click", async (e) => {
    if (e.target.classList.contains("save-row")) {
      const header = e.target.closest(".accordion-header");
      const form = header.nextElementSibling.querySelector("form");
      const originalIndex = e.target.dataset.index;
      const updatedRow = {};

      // Collect all input values from both the header and the form
      header.querySelectorAll("input, select").forEach((input) => {
        updatedRow[input.previousElementSibling.innerText] = input.value;
      });
      form.querySelectorAll("input, select").forEach((input) => {
        updatedRow[input.previousElementSibling.innerText] = input.value;
      });

      // Send the updated row data to the backend for saving
      showSpinner();
      try {
        await window.api.saveRow(originalIndex, updatedRow);
      } catch (error) {
        console.error("Error saving row:", error);
      } finally {
        hideSpinner();
      }
    }
  });

// Show the spinner
function showSpinner() {
  document.getElementById("spinner").classList.remove("hidden");
}

// Hide the spinner
function hideSpinner() {
  document.getElementById("spinner").classList.add("hidden");
}

// Event listener for global save button
document
  .getElementById("global-save-btn")
  .addEventListener("click", async () => {
    showSpinner();
    try {
      const allData = getAllDataFromAccordion(); // Function to collect all data from the accordion
      console.log({ allData });
      await window.api.saveData(allData); // Save data using the API
      alert("Data saved successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save data.");
    } finally {
      hideSpinner();
    }
  });

// Event listener for logout button
document.getElementById("logout-btn").addEventListener("click", () => {
  document.getElementById("main-page").style.display = "none";
  document.getElementById("login-page").classList.remove("hidden");
});
