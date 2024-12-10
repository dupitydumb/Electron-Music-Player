console.log("renderer.ts");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  const selectFolderButton = document.getElementById("selectFolderButton");
  const musicList = document.getElementById("musicList");
  const songList = document.getElementById("songList");
  const audioPlayer = document.getElementById(
    "audioPlayer"
  ) as HTMLAudioElement | null;
  const playPauseButton = document.getElementById("playPauseButton");
  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");
  const seekBar = document.getElementById("seekBar") as HTMLInputElement;
  const currentTimeDisplay = document.getElementById("currentTime");
  const durationDisplay = document.getElementById("duration");
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  const volumeBar = document.getElementById("volumeinput") as HTMLInputElement;

  let currentIndex = 0;
  let files: any[] = [];

  if (
    selectFolderButton &&
    musicList &&
    songList &&
    audioPlayer &&
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
              <img src="${
                file.picture || "https://via.placeholder.com/64"
              }" alt="Album Cover" class="w-12 h-12">
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
        if (audioPlayer.paused) {
          audioPlayer.play();
          playIcon.classList.add("hidden");
          pauseIcon.classList.remove("hidden");
        } else {
          audioPlayer.pause();
          playIcon.classList.remove("hidden");
          pauseIcon.classList.add("hidden");
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

    audioPlayer.addEventListener("timeupdate", () => {
      seekBar.value = (
        (audioPlayer.currentTime / audioPlayer.duration) *
        100
      ).toString();
      currentTimeDisplay.textContent = formatTime(audioPlayer.currentTime);
    });

    audioPlayer.addEventListener("loadedmetadata", () => {
      durationDisplay.textContent = formatTime(audioPlayer.duration);
    });

    seekBar.addEventListener("input", () => {
      audioPlayer.currentTime =
        (parseFloat(seekBar.value) / 100) * audioPlayer.duration;
    });

    audioPlayer.addEventListener("ended", () => {
      if (currentIndex < files.length - 1) {
        currentIndex++;
        playCurrentFile();
      }
    });

    volumeBar.addEventListener("input", () => {
      if (audioPlayer) {
        audioPlayer.volume = parseFloat(volumeBar.value) / 100;
        console.log(audioPlayer.volume);
      }
    });

    function playCurrentFile() {
      const file = files[currentIndex];
      if (audioPlayer && playIcon && pauseIcon) {
        audioPlayer.src = file.path;
        audioPlayer.play();
        playIcon.classList.add("hidden");
        pauseIcon.classList.remove("hidden");
        const nowPlayingTitle = document.getElementById("nowPlayingTitle");
        const nowPlayingAlbum = document.getElementById("nowPlayingAlbum");
        const nowPlayingArtist = document.getElementById("nowPlayingArtist");
        const nowPlayingCover = document.getElementById(
          "nowPlayingCover"
        ) as HTMLImageElement | null;

        if (nowPlayingTitle) {
          nowPlayingTitle.textContent = file.title || file.name;
        }
        if (nowPlayingAlbum) {
          nowPlayingAlbum.textContent = file.album || "Unknown Album";
        }
        if (nowPlayingArtist) {
          nowPlayingArtist.textContent = file.artist || "Unknown Artist";
        }
        if (nowPlayingCover) {
          if (file.picture) {
            nowPlayingCover.src = file.picture;
          } else {
            nowPlayingCover.src = "";
          }
        }
      }
    }
  }
});

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}
