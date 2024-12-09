import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipcRenderer", {
  invoke: (channel: string, ...args: any[]) =>
    ipcRenderer.invoke(channel, ...args),
});
