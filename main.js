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

ipcMain.handle("load-data", async (event, loggedInUser) => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: mainRange,
    });
    const data = res.data.values || [];

    if (data.length === 0) {
      return []; // No data found
    }

    // Normalize the data by ensuring each row has the same number of columns
    const maxColumns = Math.max(...data.map((row) => row.length));
    const normalizedData = data.map((row) => {
      const filledRow = row.map((cell) =>
        cell !== null ? String(cell).replace(/\\n/g, "\n") : ""
      );
      while (filledRow.length < maxColumns) {
        filledRow.push("");
      }
      return filledRow;
    });

    const headerRow = normalizedData[0];
    const counsellorIndex = headerRow.indexOf("Counsellor");

    if (counsellorIndex === -1) {
      console.error("Counsellor column not found");
      return [];
    }

    // Filter rows where "Counsellor" matches the logged-in user and keep original indices
    const filteredRowsWithIndex = normalizedData
      .map((row, index) => ({ row, originalIndex: index }))
      .filter(({ row, originalIndex }) => {
        if (originalIndex === 0) return true; // Include header row
        return row[counsellorIndex] === loggedInUser;
      });

    return filteredRowsWithIndex;
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
});

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
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: mainRange,
    });
    const existingData = res.data.values || [];

    dataWithIndex.forEach(({ originalIndex, rowData }) => {
      if (originalIndex !== undefined) {
        // Update existing rows
        existingData[originalIndex] = rowData;
      } else {
        // Append new rows
        existingData.push(rowData);
      }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: mainRange,
      valueInputOption: "RAW",
      resource: { values: existingData },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving data:", error);
    throw new Error("Failed to save data");
  }
});
