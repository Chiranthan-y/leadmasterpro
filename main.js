const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { google } = require("googleapis");

const credentials = require("./credentials.json");
const master = require("./master.json");

const SCOPES = master.SCOPES;
const sheetId = master.SHEET_ID;
const mainRange = master.MAIN_RANGE;
const userRange = master.USER_RANGE;
const dropDownRange = master.DROP_DOWN_RANGE;

const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: SCOPES,
});
const sheets = google.sheets({ version: "v4", auth });

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1200,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile("index.html");
}

app.on("ready", createWindow);

// Handle user login
ipcMain.handle("login", async (event, username, password) => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: userRange,
    });
    const users = res.data.values || [];
    const userMap = users.reduce((acc, [user, pass]) => {
      acc[user] = pass;
      return acc;
    }, {});
    return { success: userMap[username] === password };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return { success: false, error: "Failed to authenticate" };
  }
});

// Handle loading data for the accordion
ipcMain.handle("load-data", async (event, loggedInUser) => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: mainRange,
    });
    const data = res.data.values || [];

    if (data.length <= 1) {
      return []; // No data found or only header row exists
    }

    const headerRow = data[0]; // The first row is the header
    const dataRows = data.slice(1); // All other rows are data

    const counsellorIndex = headerRow.indexOf("Counsellor");

    if (counsellorIndex === -1) {
      console.error("Counsellor column not found");
      return [];
    }

    // Filter rows where "Counsellor" matches the logged-in user
    const filteredRowsWithIndex = dataRows
      .map((row, index) => ({ row, originalIndex: index + 1 })) // Adjust index to match the original data
      .filter(({ row }) => row[counsellorIndex] === loggedInUser);

    // Convert filtered rows to objects with headers as keys
    const rowsWithHeaders = filteredRowsWithIndex.map(
      ({ row, originalIndex }) => {
        const rowData = headerRow.reduce((acc, key, idx) => {
          acc[key] = row[idx] || ""; // Ensure no undefined values
          return acc;
        }, {});
        return { rowData, originalIndex };
      }
    );

    return rowsWithHeaders;
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
});

// Handle loading dropdown options
ipcMain.handle("load-dropdown-options", async () => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: dropDownRange,
    });
    const dropdownOptions = res.data.values || [];
    const headers = dropdownOptions[0];
    const optionsByHeader = headers.reduce((acc, header, index) => {
      acc[header] = dropdownOptions
        .slice(1)
        .map((row) => row[index])
        .filter((option) => option);
      return acc;
    }, {});

    return optionsByHeader;
  } catch (error) {
    console.error("Error loading dropdown options:", error);
    return {};
  }
});

ipcMain.handle("save-data", async (event, dataWithIndex) => {
  try {
    // Fetch the existing data including headers
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: mainRange,
    });
    const existingData = res.data.values || [];

    // Get the headers from the first row of the existing data
    const headers = existingData[0];

    dataWithIndex.forEach(({ originalIndex, rowData }) => {
      const rowArray = new Array(headers.length).fill(""); // Create an array to store the row data

      headers.forEach((header, index) => {
        if (rowData[header] !== undefined) {
          rowArray[index] = rowData[header]; // Match header with rowData
        }
      });

      if (originalIndex !== undefined && originalIndex < existingData.length) {
        // Update existing rows
        existingData[originalIndex] = rowArray;
      } else {
        // Append new rows
        existingData.push(rowArray);
      }
    });

    // Write back all data
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: mainRange,
      valueInputOption: "RAW",
      resource: { values: existingData },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving data:", error);
    return { success: false, error: "Failed to save data." };
  }
});
