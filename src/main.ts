import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as fs from "fs";
import * as path from "path";
import NodeID3 from "node-id3";

let mainWindow: BrowserWindow | null;

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const folderPath = result.filePaths[0];
  const files = fs.readdirSync(folderPath).filter((file) => {
    return file.endsWith(".mp3") || file.endsWith(".flac");
  });

  const fileData = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(folderPath, file);
      const tags = NodeID3.read(filePath);
      const picture = tags.image;
      let pictureData = null;
      if (picture && typeof picture !== "string") {
        const base64 = Buffer.from(picture.imageBuffer).toString("base64");
        pictureData = `data:${picture.mime};base64,${base64}`;
      }
      return {
        name: file,
        path: filePath,
        title: tags.title,
        album: tags.album,
        artist: tags.artist,
        picture: pictureData,
      };
    })
  );

  return fileData;
});
