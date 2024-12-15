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
  let currentIndex = 0;
  let files: any[] = [];

  document
    .getElementById("openDownloadPageButton")
    ?.addEventListener("click", () => {
      window.ipcRenderer.send("open-download-page", {});
    });

  if (
    selectFolderButton &&
    musicList &&
    songList &&
    playPauseButton &&
    prevButton &&
    nextButton &&
    seekBar &&
    currentTimeDisplay &&
    durationDisplay &&
    volumeBar
  ) {
    selectFolderButton.addEventListener("click", async () => {
      const result = await window.ipcRenderer.invoke("select-folder");
      if (result) {
        files = result;
        musicList.innerHTML = "";
        songList.innerHTML = "";
        result.forEach((file: any, index: number) => {
          // const listItem = document.createElement("li");
          // listItem.textContent = `${file.title || file.name} - ${
          //   file.artist || "Unknown Artist"
          // }`;
          // listItem.classList.add(
          //   "mb-2",
          //   "cursor-pointer",
          //   "hover:text-gray-400"
          // );
          // listItem.addEventListener("click", () => {
          //   currentIndex = index;
          //   playCurrentFile();
          // });
          // musicList.appendChild(listItem);

          const songItem = document.createElement("li");
          songItem.classList.add(
            "flex",
            "justify-between",
            "items-left",
            "text-gray-400",
            "m-6",
            "cursor-pointer",
            "hover:text-gray-200"
          );
          songItem.innerHTML = `
              <div class="flex items-center space-x-4">
                <p class="text-gray-400">${index + 1}</p>
                <img src="data:${
                  file.picture[0].format
                };base64,${_arrayBufferToBase64(
            file.picture[0].data
          )}" alt="Album Cover" class="w-12 h-12">
                <div>
                  <h3 class="text-lg font-bold">${file.title || file.name}</h3>
                  <p class="truncate">${file.album || "Unknown Album"}</p>
                  <p class="truncate">${file.artist || "Unknown Artist"}</p>
                </div>
              </div>
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
      const nowPlayingAlbum = document.getElementById("nowPlayingAlbum");
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
        if (nowPlayingAlbum) {
          nowPlayingAlbum.textContent = file.album || "Unknown Album";
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
});

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
