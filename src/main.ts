import { app, BrowserWindow, ipcMain, dialog, ipcRenderer } from "electron";
import * as fs from "fs";
import * as path from "path";
import { Howl, Howler } from "howler";
import { spawn } from "child_process";
import { electron, title } from "process";
import * as mm from "music-metadata";
import axios from "axios";
import { get } from "http";

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

ipcMain.handle("get-lyrics", async (event, data) => {
  const [title, artist, album] = data.split("|");
  try {
    const response = await axios.get(`https://lrclib.net/api/search?`, {
      params: {
        track_name: title,
        artist_name: artist,
        album_name: album,
      },
    });
    console.log("response", response.data[0].syncedLyrics);
    if (response.data && response.data.length > 0) {
      return response.data[0].syncedLyrics;
    } else {
      return "Lyrics not foundxx";
    }
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return "Error fetching lyrics";
  }
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
  const files = await scanFolder(folderPath);
  if (files.length === 0) {
    mainWindow?.webContents.send(
      "show-dialog",
      "No files found in the folder",
      true,
      false
    );
    return;
  }

  //get the folder name
  const folderName = path.basename(folderPath);
  const fileData = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(folderPath, file);
      mainWindow?.webContents.send(
        "show-dialog",
        `Reading file ${file}`,
        false,
        true
      );
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

async function scanFolder(folderPath: string): Promise<string[]> {
  let audioFiles: string[] = [];
  const files = await fs.promises.readdir(folderPath);

  // if files format is mp3 or flac return the file
  audioFiles = files
    .filter((file) => file.endsWith(".mp3") || file.endsWith(".flac"))
    .map((file) => file);

  // search audio files in subfolders of any until no more subfolders
  let subfolders = files.filter((file) =>
    fs.lstatSync(path.join(folderPath, file)).isDirectory()
  );
  while (subfolders.length > 0) {
    for (let folder of subfolders) {
      const subfolderPath = path.join(folderPath, folder);
      const subfolderFiles = await scanFolder(subfolderPath);
      audioFiles = audioFiles.concat(
        subfolderFiles.map((file) => path.join(folder, file))
      );
    }
    subfolders = [];
    subfolders = audioFiles
      .filter((file) => fs.lstatSync(path.join(folderPath, file)).isDirectory())
      .map((file) => file);
  }

  return audioFiles;
}

async function GetLyrics(artist: string, title: string) {
  try {
    console.log("Getting lyrics for", artist, title);
    const response = await axios.get(
      "https://lrclib.net/api/search?q=" + artist + " " + title
    );
    console.log("https://lrclib.net/api/search?q=" + artist + " " + title);
    if (response.data.length === 0) {
      return "No lyrics found";
    }
    console.log("Lyrics", response);
    const lyrics = response.data[0].lyric;

    return lyrics;
  } catch (error) {
    console.error("Error getting lyrics", error);
  }
}
