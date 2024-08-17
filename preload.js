const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (username, password) =>
    ipcRenderer.invoke("login", username, password),
  loadData: () => ipcRenderer.invoke("load-data"),
  loadDropdownOptions: () => ipcRenderer.invoke("load-dropdown-options"),
  saveData: (data) => ipcRenderer.invoke("save-data", data),
});
