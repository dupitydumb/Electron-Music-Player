import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as fs from "fs";
import * as path from "path";
import NodeID3 from "node-id3";
import { Howl, Howler } from "howler";
import { spawn } from "child_process";
import { electron } from "process";
import * as mm from "music-metadata";

let mainWindow: BrowserWindow | null;
let downloadWindow: BrowserWindow | null;
app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("select-folder", async () => {
  console.log("Selecting folder");
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const folderPath = result.filePaths[0];
  return openFolder(folderPath);
});

ipcMain.handle("open-folder", async (event, folderPath: string) => {
  return openFolder(folderPath);
});

// ipcMain.on("run-cmd", (event, command: string) => {
//   const child = spawn(command, { shell: true });

//   child.stdout.on("data", (data) => {
//     event.sender.send("cmd-output", data.toString());
//   });

//   child.stderr.on("data", (data) => {
//     event.sender.send("cmd-output", data.toString());
//   });

//   child.on("close", (code) => {
//     event.sender.send("cmd-output", `Process exited with code ${code}`);
//   });
// });

async function openFolder(folderPath: string) {
  const files = fs.readdirSync(folderPath).filter((file) => {
    return file.endsWith(".mp3") || file.endsWith(".flac");
  });
  //get the folder name
  const folderName = path.basename(folderPath);
  const fileData = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(folderPath, file);
      mainWindow?.webContents.send("show-dialog", "Reading file data", file);
      let tags;
      let pictureData = null;
      let flacData = null;
      flacData = readFlac(filePath, file.endsWith(".flac") ? "flac" : "mpeg");
      console.log("filePath", filePath);
      return {
        name: file,
        path: filePath,
        title: (await flacData)?.common.title || "Unknown Title",
        album: (await flacData)?.common.album || "Unknown Album",
        artist: (await flacData)?.common.artist || "Unknown Artist",
        picture: (await flacData)?.common.picture || "Unknown Picture",
        year: (await flacData)?.common.year || "Unknown Year",
        duration: (await flacData)?.format.duration || "Unknown Duration",
      };
    })
  );
  mainWindow?.webContents.send("hide-dialog");
  async function readFlac(filePath: string, filetype: string) {
    // Get metadata from the file with fs.readFile
    const fileData = fs.readFileSync(filePath);
    const musicMetadata = await mm.loadMusicMetadata();
    const metadata = await musicMetadata.parseBuffer(fileData, filetype);
    //return metadata;
    return metadata;
  }
  mainWindow?.webContents.send("show-folder-name", folderName, fileData);
  return fileData;
}

function createWindow() {
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

  ipcMain.on("open-download-page", () => {
    if (downloadWindow) {
      downloadWindow.focus();
      return;
    }
    downloadWindow = new BrowserWindow({
      width: 640,
      height: 640,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    downloadWindow.loadFile("songfinder.html");

    downloadWindow.on("closed", () => {
      downloadWindow = null;
    });
  });
}

ipcMain.on("create-audio-player", (event, file: string) => {
  const audioPlayer = new Howl({
    src: [file],
    html5: true,
  });
  console.log("Audio player playing", audioPlayer);
  event.reply("audio-player-created", audioPlayer);
});
