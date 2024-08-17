const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { google } = require("googleapis");

const credentials = require("./credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

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
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = "1eqkXPTHTHi-C4w_GFS8iQUU83BoYpcAai4QnxYNuxC8";
  const range = "User!A2:B";

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
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
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = "1eqkXPTHTHi-C4w_GFS8iQUU83BoYpcAai4QnxYNuxC8";
  const range = "Sheet1";

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    const data = res.data.values || [];
    if (data.length === 0) {
      return []; // No data found
    }

    const normalizedData = data.map((row) => {
      const filledRow = row.map((cell) => cell ?? "");
      while (filledRow.length < Math.max(...data.map((row) => row.length))) {
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

    // Filter rows where "Counsellor" matches the logged-in user
    const filteredRows = normalizedData.filter((row, index) => {
      if (index === 0) return true; // Include header row
      return row[counsellorIndex] == loggedInUser;
    });

    return filteredRows;
  } catch (error) {
    console.error("Error loading data:", error);
    return [];
  }
});

ipcMain.handle("load-dropdown-options", async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = "1eqkXPTHTHi-C4w_GFS8iQUU83BoYpcAai4QnxYNuxC8";
  const dropdownRange = "DropdownOptions!A1:C"; // Adjust range as needed

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: dropdownRange,
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

ipcMain.handle("save-data", async (event, data) => {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = "1eqkXPTHTHi-C4w_GFS8iQUU83BoYpcAai4QnxYNuxC8";

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Sheet1",
      valueInputOption: "RAW",
      resource: { values: data },
    });
  } catch (error) {
    console.error("Error saving data:", error);
    throw new Error("Failed to save data");
  }
});
