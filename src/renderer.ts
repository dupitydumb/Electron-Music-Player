let selectFolderButton: any;
let songList: any;
let playPauseButton: any;
let prevButton: any;
let nextButton: any;
let seekBar: any;
let currentTimeDisplay: any;
let durationDisplay: any;
let volumeBar: any;
let folderNameDisplay: any;
let playIcon: any;
let pauseIcon: any;
let currentIndex: number;
let files: any[] = [];
let sound: Howl | null = null;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  selectFolderButton = document.getElementById("selectFolderButton");
  songList = document.getElementById("songList");
  playPauseButton = document.getElementById("playPauseButton");
  prevButton = document.getElementById("prevButton");
  nextButton = document.getElementById("nextButton");
  seekBar = document.getElementById("seekBar") as HTMLInputElement;
  currentTimeDisplay = document.getElementById("currentTime");
  durationDisplay = document.getElementById("duration");
  playIcon = document.getElementById("playIcon");
  pauseIcon = document.getElementById("pauseIcon");
  volumeBar = document.getElementById("volumeinput") as HTMLInputElement;
  folderNameDisplay = document.getElementById("folderListContainer");
  currentIndex = 0;

  document
    .getElementById("openDownloadPageButton")
    ?.addEventListener("click", () => {
      window.ipcRenderer.send("open-download-page", {});
    });

  selectFolderButton.addEventListener("click", async () => {
    DisplaySong("", true);
  });

  const output = document.getElementById("cmdOutputText");
  window.electronAPI.onCmdOutput((data: any) => {
    if (output) {
      output.textContent += data;
    }
    console.log(data);
  });

  window.electronAPI.on("show-dialog", (event: any, message: string) => {
    showDialog(message);
  });

  window.electronAPI.on("hide-dialog", () => {
    hideDialog();
  });

  window.electronAPI.on(
    "show-folder-name",
    (folderName: string, folderPath: string) => {
      console.log("folderName", folderName, "folderPath", folderPath);
      generateFolderList(folderName, folderPath);
    }
  );

  playPauseButton.addEventListener("click", () => {
    if (playIcon && pauseIcon) {
      if (sound) {
        if (sound.playing()) {
          sound.pause();
          playIcon.classList.remove("hidden");
          pauseIcon.classList.add("hidden");
        } else {
          sound.play();
          playIcon.classList.add("hidden");
          pauseIcon.classList.remove("hidden");
        }
      }
    }
  });

  prevButton.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      playCurrentFile();
    }
  });

  nextButton.addEventListener("click", () => {
    if (currentIndex < files.length - 1) {
      currentIndex++;
      playCurrentFile();
    }
  });

  seekBar.addEventListener("input", () => {
    if (sound) {
      sound.seek((parseFloat(seekBar.value) / 100) * sound.duration());
    }
  });

  volumeBar.addEventListener("input", () => {
    if (sound) {
      sound.volume(parseFloat(volumeBar.value) / 100);
    }
  });
});

function playCurrentFile() {
  const file = files[currentIndex];
  const howlertag = document.getElementById("howler-tag") as HTMLScriptElement;
  const nowPlayingTitle = document.getElementById("nowPlayingTitle");
  const nowPlayingArtist = document.getElementById("nowPlayingArtist");
  const nowPlayingCover = document.getElementById(
    "nowPlayingCover"
  ) as HTMLImageElement | null;

  if (howlertag) {
    //if there is already Howl variable, destroy it
    Howler.unload();
    if (sound) {
      sound.stop();
    }
    sound = new Howl({
      src: [file.path],
      format: ["flac"],
      html5: true,
      volume: parseFloat(volumeBar.value) / 100,
      onend: () => {
        if (currentIndex < files.length - 1) {
          currentIndex++;
          playCurrentFile();
        }
      },
    });
    sound.play();
    if (playIcon && pauseIcon) {
      playIcon.classList.add("hidden");
      pauseIcon.classList.remove("hidden");
    }
    if (nowPlayingTitle) {
      nowPlayingTitle.textContent = file.title || file.name;
    }
    if (nowPlayingArtist) {
      nowPlayingArtist.textContent = file.artist || "Unknown Artist";
    }
    if (nowPlayingCover && file.picture) {
      console.log("file.picture", file.picture[0]);
      //convert Uint8Array to base64
      nowPlayingCover.src = `data:${
        file.picture[0].format
      };base64,${_arrayBufferToBase64(file.picture[0].data)}`;
    }

    if (durationDisplay && currentTimeDisplay) {
      sound.on("play", () => {
        if (sound) {
          durationDisplay.textContent = formatTime(sound.duration());
        }
        setInterval(() => {
          if (sound) {
            seekBar.value = (
              (sound.seek() / sound.duration()) *
              100
            ).toString();
            currentTimeDisplay.textContent = formatTime(sound.seek());
          }
        }, 1000);
      });
    }

    if (seekBar) {
      seekBar.addEventListener("input", () => {
        sound?.seek((parseFloat(seekBar.value) / 100) * sound.duration());
      });
    }
  }
}

let foldersaved: any[] = [];
function generateFolderList(folderName: string, fileData: any) {
  if (foldersaved.includes(fileData)) {
    return;
  }
  const folderListContainer = document.getElementById("folderListContainer");
  if (folderListContainer) {
    const folderElement = document.createElement("div");
    folderElement.id = "folderNameDisplay";
    folderElement.className = "text-gray-400 flex items-center space-x-2 mb-4";
    folderElement.innerHTML = `
    <svg
      fill="#000000"
      width="32px"
      height="32px"
      viewBox="0 0 0.96 0.96"
      id="folder"
      data-name="Flat Color"
      xmlns="http://www.w3.org/2000/svg"
      class="icon flat-color"
    >
      <path
        id="primary"
        d="M0.8 0.24h-0.264L0.44 0.144A0.08 0.08 0 0 0 0.384 0.12H0.16a0.08 0.08 0 0 0 -0.08 0.08v0.56a0.08 0.08 0 0 0 0.08 0.08h0.64a0.08 0.08 0 0 0 0.08 -0.08V0.32a0.08 0.08 0 0 0 -0.08 -0.08"
        style="fill: rgb(223, 223, 223)"
      />
    </svg>
    <p>${folderName}</p>
  `;

    foldersaved.push(fileData);
    folderElement.addEventListener("click", () => {
      DisplaySong(fileData, false);
    });

    folderListContainer.appendChild(folderElement);
  }
}

async function DisplaySong(folderPath: string, isFolder: boolean) {
  let result;
  if (isFolder) {
    result = await window.ipcRenderer.invoke("select-folder");
    console.log("result", result);
  } else {
    result = folderPath;
    console.log("result", result);
  }
  if (result) {
    files = result;
    songList.innerHTML = "";
    result.forEach((file: any, index: number) => {
      const songItem = document.createElement("tr");
      songItem.classList.add(
        "text-gray-400",
        "cursor-pointer",
        "hover:text-gray-200"
      );
      songItem.innerHTML = `
    <td class="px-4 py-2">${index + 1}</td>
    <td class="px-4 py-2">
        <div class="flex items-center">
            <img src="data:${
              file.picture[0].format
            };base64,${_arrayBufferToBase64(
        file.picture[0].data
      )}" class="w-10 h-10" />
            <div class="ml-4">
                <div class="font-semibold">${file.title || file.name}</div>
                <div class="text-sm">${file.artist || "Unknown Artist"}</div>
            </div>
        </div>
    </td>
    <td class="px-4 py-2 truncate">${file.album || "Unknown Album"}</td>
    <td class="px-4 py-2 truncate">${file.year || "Unknown Year"}</td>
    <td class="px-4 py-2 truncate">${formatTime(file.duration)}</td>
  `;

      songItem.addEventListener("click", () => {
        currentIndex = index;
        playCurrentFile();
      });

      songList.appendChild(songItem);
    });
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

function _arrayBufferToBase64(buffer: any) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function showDialog(message: string) {
  const dialogBox = document.getElementById("dialogBox");
  const dialogText = document.getElementById("dialogText");
  if (dialogBox && dialogText) {
    dialogText.textContent = message;
    if (dialogBox.classList.contains("hidden")) {
      dialogBox.classList.remove("hidden");
    }
  }
}

function hideDialog() {
  const dialogBox = document.getElementById("dialogBox");
  if (dialogBox) {
    dialogBox.classList.add("hidden");
  }
}
