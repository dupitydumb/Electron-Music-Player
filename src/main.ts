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
      let tags;
      let pictureData = null;
      let flacData = null;
      if (file.endsWith(".mp3")) {
        tags = NodeID3.read(filePath);
        const picture = tags.image;
        if (picture && typeof picture !== "string") {
          const base64 = Buffer.from(picture.imageBuffer).toString("base64");
          pictureData = `data:${picture.mime};base64,${base64}`;
        }
        return {
          name: file,
          path: filePath,
          title: tags?.title || "Unknown Title",
          album: tags?.album || "Unknown Album",
          artist: tags?.artist || "Unknown Artist",
          picture: pictureData,
          year: tags?.year || "Unknown Year",
        };
      } else if (file.endsWith(".flac")) {
        flacData = readFlac(filePath);
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
      }
    })
  );

  async function readFlac(filePath: string) {
    // Get metadata from the file with fs.readFile
    const fileData = fs.readFileSync(filePath);
    const musicMetadata = await mm.loadMusicMetadata();
    const metadata = await musicMetadata.parseBuffer(fileData, "audio/flac");
    console.log("metadata", metadata);
    //return metadata;
    return metadata;
  }

  return fileData;
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
