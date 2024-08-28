let loggedInUser = "";

let filterFields = [
  "Call Remarks",
  "Follow-up Date",
  "Vendor / Partner",
  "Country code",
];
let NonEditable = [
  "Ref No",
  "Counsellor",
  "Name",
  "Country code",
  "Contact Number",
  "Email Id",
];
const headerFields = [
  "Ref No",
  "Name",
  "Contact Number",
  "Country code",
  "Email Id",
  "Call Remarks",
  "Follow-up Date",
  "Vendor / Partner",
  "Intake & Education Details",
  "Remark",
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
    console.log({ data, dropdownOptions });
    createAccordion(data, dropdownOptions);
  } catch (error) {
    console.error(`Error loading data:, ${error}`);
  } finally {
    hideSpinner();
  }
});

// Global save button
document
  .getElementById("global-save-btn")
  .addEventListener("click", async () => {
    showSpinner();
    try {
      const allData = getAllDataFromAccordion(); // Collect all data from the accordion
      await window.api.saveData(allData); // Save all data using the API
      // Remove the red highlight and reset the accordion header color
      const accordionContainer = document.getElementById("accordion-container");
      accordionContainer
        .querySelectorAll(".accordion-header")
        .forEach((header) => {
          const editableFields = header.querySelectorAll(".editable-field");
          const contentFields =
            header.nextElementSibling.querySelectorAll(".editable-field");

          // Remove red border from editable fields in the header
          editableFields.forEach((field) => {
            field.classList.remove("border-red-500");
          });

          // Remove red border from editable fields in the content
          contentFields.forEach((field) => {
            field.classList.remove("border-red-500");
          });

          // Reset header background color
          header.classList.remove("bg-red-100"); // Remove light red background color
        });
    } catch (error) {
      console.error("Error saving data:", error);
      alert(`Failed to save data: ${error.message}`);
    } finally {
      hideSpinner();
    }
  });

// Event listener for logout button
document.getElementById("logout-btn").addEventListener("click", () => {
  showSpinner();
  document.getElementById("main-page").style.display = "none";
  document.getElementById("login-page").classList.remove("hidden");
  hideSpinner();
  loggedInUser = ""; // Clear the logged-in username on logout
  // Clear the table data
  document.getElementById("table-container").innerHTML = "";
});

document.getElementById("search-box").addEventListener("input", function () {
  const searchTerm = this.value;
  const accordions = document.querySelectorAll(".accordion-header");

  accordions.forEach((header) => {
    const content = header.nextElementSibling;
    let headerMatch = false;
    let contentMatch = false;

    // Search in header fields (span, input, select)
    const headerFields = header.querySelectorAll("span, input, select");
    headerFields.forEach((field) => {
      if (
        field.textContent.includes(searchTerm) ||
        (field.value && field.value.includes(searchTerm))
      ) {
        headerMatch = true;
      }
    });

    // Search in content fields (span, input, select)
    const contentFields = content.querySelectorAll("span, input, select");
    contentFields.forEach((field) => {
      if (
        field.textContent.includes(searchTerm) ||
        (field.value && field.value.includes(searchTerm))
      ) {
        contentMatch = true;
      }
    });

    // Show header and content if either matches
    if (headerMatch || contentMatch) {
      header.style.display = "";
      content.style.display = "";
    } else {
      header.style.display = "none";
      content.style.display = "none";
    }
  });
});

function createAccordion(data, dropdownOptions) {
  const accordionContainer = document.getElementById("accordion-container");
  accordionContainer.innerHTML = ""; // Clear previous content

  const filterContainer = document.getElementById("filter-container");
  filterContainer.innerHTML = ""; // Clear previous filters

  // Create dropdown filters for each field with unique values
  let filterHtml = filterFields
    .map((field) => {
      if (field === "Follow-up Date") {
        // Render a date input for "Follow-up Date"
        return `
        <div class="col-span-1">
          <label class="block text-gray-700 font-bold uppercase">${field}</label>
          <input type="date" class="filter-select w-full px-3 py-2 border border-gray-300 rounded" data-field-name="${field}" />
        </div>
      `;
      } else {
        // Render a dropdown for other fields
        const uniqueValues = [
          ...new Set(data.map((item) => item.rowData[field] || "")),
        ].filter(Boolean);
        return `
        <div class="col-span-1">
          <label class="block text-gray-700 font-bold uppercase">${field}</label>
          <select class="filter-select w-full px-3 py-2 border border-gray-300 rounded" data-field-name="${field}">
            <option value="">All</option>
            ${uniqueValues
              .map((value) => `<option value="${value}">${value}</option>`)
              .join("")}
          </select>
        </div>
      `;
      }
    })
    .join("");

  // Append a filter button to apply the filters
  filterHtml += `
  <div class="col-span-1 flex items-end">
    <button id="apply-filter" class="bg-green-500 text-white p-2 rounded">Apply Filter</button>
  </div>
`;

  filterContainer.innerHTML = `<div class="grid grid-cols-5 gap-2 w-full">${filterHtml}</div>`;

  document.getElementById("apply-filter").addEventListener("click", () => {
    const filters = {};

    // Gather the selected filters
    document.querySelectorAll(".filter-select").forEach((select) => {
      const field = select.getAttribute("data-field-name");
      const value = select.value;
      if (value && value !== "All") {
        filters[field] = value;
      }
    });

    const accordionContainer = document.getElementById("accordion-container");
    const accordions = accordionContainer.querySelectorAll(".accordion-header");

    accordions.forEach((header) => {
      let matchesFilter = true;
      const content = header.nextElementSibling; // Get the associated content

      // Loop through each filter and check if it matches any corresponding field in the header or content
      for (const field in filters) {
        const filterValue = filters[field];

        // Check if the field exists in the header
        const headerField = header.querySelector(
          `[data-field-name="${field}"]`
        );
        let headerValue = headerField
          ? headerField.tagName === "SPAN"
            ? headerField.innerText
            : headerField.value
          : "";

        // Check if the field exists in the content
        const contentField = content.querySelector(
          `[data-field-name="${field}"]`
        );
        let contentValue = contentField
          ? contentField.tagName === "SPAN"
            ? contentField.innerText
            : contentField.value
          : "";

        // If neither header nor content match the filter, set matchesFilter to false
        if (headerValue !== filterValue && contentValue !== filterValue) {
          matchesFilter = false;
          break;
        }
      }

      // Show header if it matches the filter criteria, otherwise hide it
      if (matchesFilter) {
        header.classList.remove("hidden");
      } else {
        header.classList.add("hidden");
      }
    });
  });

  // Render the accordion with the data
  data.forEach(({ rowData, originalIndex }, index) => {
    // Create accordion header (non-editable and editable fields)
    const header = document.createElement("div");
    header.className =
      "accordion-header bg-gray-200 px-2 py-1 cursor-pointer rounded flex justify-between items-center";
    header.setAttribute("data-original-index", originalIndex);

    let headerHtml = "";
    headerFields.forEach((field) => {
      if (field === "Follow-up Date") {
        // Editable date input field
        headerHtml += `
          <div class="col-span-1">
            <label class="block text-gray-700 font-bold uppercase">${field}</label>
            <input type="date" value="${
              rowData[field] || ""
            }" class="w-full px-3 py-2 border border-gray-300 rounded editable-field" data-field-name="${field}" />
          </div>
        `;
      } else if (NonEditable.includes(field)) {
        // Non-editable fields displayed as labels
        headerHtml += `
          <div class="col-span-1">
            <label class="block text-gray-700 font-bold uppercase">${field}</label>
            <span class="block w-full py-2 font-semibold text-black" data-field-name="${field}">${
          rowData[field] || ""
        }</span>
          </div>
        `;
      } else if (dropdownOptions[field]) {
        // Editable dropdown fields
        headerHtml += `
          <div class="col-span-1">
            <label class="block text-gray-700 font-bold uppercase">${field}</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded editable-field" data-field-name="${field}">
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
            <label class="block text-gray-700 font-bold uppercase">${field}</label>
            <input type="text" value="${
              rowData[field] || ""
            }" class="w-full px-3 py-2 border border-gray-300 rounded editable-field" data-field-name="${field}" />
          </div>
        `;
      }
    });

    header.innerHTML = `
      <div class="grid grid-cols-5 gap-2 w-full">${headerHtml}</div>
      <div class="flex items-center px-1">
        <button class="accordion-toggle bg-green-400 py-1 px-2 rounded text-center font-bold uppercase">More details</button>
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

    // Append header and content to accordion container
    accordionContainer.appendChild(header);
    accordionContainer.appendChild(content);

    // Function to highlight the accordion header if any field is edited
    function highlightHeader() {
      header.classList.add("bg-red-100");
    }

    // Add event listener to editable fields in the header
    const editableFields = header.querySelectorAll(".editable-field");
    editableFields.forEach((field) => {
      field.addEventListener("input", () => {
        field.classList.add("border-red-500");
        highlightHeader(); // Highlight the header when any field is edited
      });
    });

    // Add event listener to editable fields in the content
    const contentEditableFields = content.querySelectorAll(".editable-field");
    contentEditableFields.forEach((field) => {
      field.addEventListener("input", () => {
        field.classList.add("border-red-500");
        highlightHeader(); // Highlight the header when any field in content is edited
      });
    });
  });
}
// Function to generate the form in the accordion content
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
          <label class="block text-gray-700 font-bold uppercase">${field}</label>
          <input type="date" value="${
            row[field] || ""
          }" class="w-full px-3 py-2 border border-gray-300 rounded editable-field" data-field-name="${field}" />
        </div>
      `;
    } else if (dropdownOptions[field]) {
      formHtml += `
        <div class="col-span-1">
          <label class="block text-gray-700 font-bold uppercase">${field}</label>
          <select class="w-full px-3 py-2 border border-gray-300 rounded editable-field" data-field-name="${field}">
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
    } else if (NonEditable.includes(field)) {
      // Non-editable fields displayed as labels
      formHtml += `
        <div class="col-span-1">
          <label class="block text-gray-700 font-bold uppercase">${field}</label>
          <span class="block w-full py-2 font-semibold text-black" data-field-name="${field}">${
        row[field] || ""
      }</span>
        </div>
      `;
    } else {
      formHtml += `
        <div class="col-span-1">
          <label class="block text-gray-700 font-bold uppercase">${field}</label>
          <input type="text" value="${
            row[field] || ""
          }" class="w-full px-3 py-2 border border-gray-300 rounded editable-field" data-field-name="${field}" />
        </div>
      `;
    }
  });

  formHtml += `</form>`;
  return formHtml;
}

// Function to collect all data from the accordion
function getAllDataFromAccordion() {
  const accordionContainer = document.getElementById("accordion-container");
  const allData = [];

  accordionContainer.querySelectorAll(".accordion-header").forEach((header) => {
    const rowData = {};
    const originalIndex = header.dataset.originalIndex;

    // Collect data from header fields
    header.querySelectorAll("input, select, span").forEach((element) => {
      const fieldName = element.dataset.fieldName;
      if (fieldName) {
        // For spans, use innerText instead of value
        if (element.tagName === "SPAN") {
          rowData[fieldName] = element.innerText;
        } else {
          rowData[fieldName] = element.value || element.innerText;
        }
      }
    });

    const content = header.nextElementSibling; // The accordion content is the next sibling

    // Collect data from content fields
    content.querySelectorAll("input, select, span").forEach((element) => {
      const fieldName = element.dataset.fieldName;
      if (fieldName) {
        // For spans, use innerText instead of value
        if (element.tagName === "SPAN") {
          rowData[fieldName] = element.innerText;
        } else {
          rowData[fieldName] = element.value || element.innerText;
        }
      }
    });

    // Include the original index for correct updating
    allData.push({ rowData, originalIndex });
  });

  return allData;
}

// Show the spinner
function showSpinner() {
  document.getElementById("spinner").classList.remove("hidden");
}

// Hide the spinner
function hideSpinner() {
  document.getElementById("spinner").classList.add("hidden");
}
