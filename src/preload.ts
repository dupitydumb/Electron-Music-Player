import { create } from "domain";
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel: string, data: any) => ipcRenderer.send(channel, data),
  invoke: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
  on: (channel: string, func: (...args: any[]) => void) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

contextBridge.exposeInMainWorld("electronAPI", {
  convertbase64: (file: string) =>
    ipcRenderer.send("covert-buffer-to-base64", file),
  createHowlerPlayer: (file: string) =>
    ipcRenderer.send("create-audio-player", file),
  runCmd: (command: any) => ipcRenderer.send("run-cmd", command),
  onCmdOutput: (callback: any) =>
    ipcRenderer.on("cmd-output", (event, data) => callback(data)),
  send: (channel: any, data: any) => ipcRenderer.send(channel, data),
  invoke: (channel: any, data: any) => ipcRenderer.invoke(channel, data),
  on: (channel: any, func: any) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
  getLyrics: (title: string, artist: string) => {
    ipcRenderer.send("get-lyrics", title, artist);
  },
});
