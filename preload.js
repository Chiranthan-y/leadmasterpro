const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (username, password) =>
    ipcRenderer.invoke("login", username, password),
  loadData: (loggedInUser) => ipcRenderer.invoke("load-data", loggedInUser),
  loadDropdownOptions: () => ipcRenderer.invoke("load-dropdown-options"),
  saveData: (data) => ipcRenderer.invoke("save-data", data),
});
