const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (username, password) =>
    ipcRenderer.invoke("login", username, password),
  loadData: (loggedInUser) => ipcRenderer.invoke("load-data", loggedInUser),
  loadDropdownOptions: () => ipcRenderer.invoke("load-dropdown-options"),
  saveData: (dataWithIndex) => ipcRenderer.invoke("save-data", dataWithIndex),

  // New function to save a single row
  saveRow: (rowData, originalIndex) =>
    ipcRenderer.invoke("save-data", [{ rowData, originalIndex }]),
});
