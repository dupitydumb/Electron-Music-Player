document.addEventListener("DOMContentLoaded", () => {
  let sound: Howl | null = null;

  console.log("DOMContentLoaded");
  const selectFolderButton = document.getElementById("selectFolderButton");
  const musicList = document.getElementById("musicList");
  const songList = document.getElementById("songList");
  const playPauseButton = document.getElementById("playPauseButton");
  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");
  const seekBar = document.getElementById("seekBar") as HTMLInputElement;
  const currentTimeDisplay = document.getElementById("currentTime");
  const durationDisplay = document.getElementById("duration");
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  const volumeBar = document.getElementById("volumeinput") as HTMLInputElement;
  const runCommandButton = document.getElementById("runCommandButton");
  const folderNameDisplay = document.getElementById("folderListContainer");
  let currentIndex = 0;
  let files: any[] = [];

  document
    .getElementById("openDownloadPageButton")
    ?.addEventListener("click", () => {
      window.ipcRenderer.send("open-download-page", {});
    });

  if (
    selectFolderButton &&
    songList &&
    playPauseButton &&
    prevButton &&
    nextButton &&
    seekBar &&
    currentTimeDisplay &&
    durationDisplay &&
    volumeBar &&
    folderNameDisplay
  ) {
    selectFolderButton.addEventListener("click", async () => {
      const result = await window.ipcRenderer.invoke("select-folder");
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
    });

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

    function playCurrentFile() {
      const file = files[currentIndex];
      const howlertag = document.getElementById(
        "howler-tag"
      ) as HTMLScriptElement;
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
  } else {
    //in show dialog, log all required elements to know which one is missing
    console.log(
      selectFolderButton,
      songList,
      playPauseButton,
      prevButton,
      nextButton,
      seekBar,
      currentTimeDisplay,
      durationDisplay,
      volumeBar,
      folderNameDisplay
    );
    showDialog("Some elements are missing please check the console");
  }

  if (runCommandButton) {
    runCommandButton.addEventListener("click", () => {
      window.electronAPI.runCmd(
        "spotdl https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC"
      );
    });
  }
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
});

let foldersaved: string[] = [];
function generateFolderList(folderName: string, folderPath: string) {
  if (foldersaved.includes(folderPath)) {
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

    foldersaved.push(folderPath);
    folderElement.addEventListener("click", () => {
      window.ipcRenderer.invoke("open-folder", folderPath);
    });

    folderListContainer.appendChild(folderElement);
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
