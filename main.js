const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { google } = require("googleapis");
const jsonfile = require("jsonfile");

// Load credentials
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
  const range = "User!A2:B"; // Assuming the "User" sheet has usernames in column A and passwords in column B

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });

  const users = res.data.values || [];
  const userMap = users.reduce((acc, [user, pass]) => {
    acc[user] = pass;
    return acc;
  }, {});

  if (userMap[username] && userMap[username] === password) {
    return { success: true };
  } else {
    return { success: false };
  }
});

ipcMain.handle("load-data", async () => {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = "1eqkXPTHTHi-C4w_GFS8iQUU83BoYpcAai4QnxYNuxC8";
  const range = "Sheet1";

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });

  // Ensure rows and columns with undefined or null values are replaced with an empty string
  const data = res.data.values.map(
    (row) => row.map((cell) => cell ?? "") // Replace undefined or null with an empty string
  );

  // Handle case where some rows might be shorter (missing columns)
  const maxColumns = Math.max(...data.map((row) => row.length));
  const normalizedData = data.map((row) => {
    while (row.length < maxColumns) {
      row.push(""); // Fill missing columns with empty strings
    }
    return row;
  });

  return normalizedData;
});

ipcMain.handle("save-data", async (event, data) => {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: "v4", auth });
  const sheetId = "1eqkXPTHTHi-C4w_GFS8iQUU83BoYpcAai4QnxYNuxC8";

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "Sheet1",
    valueInputOption: "RAW",
    resource: {
      values: data,
    },
  });
});
