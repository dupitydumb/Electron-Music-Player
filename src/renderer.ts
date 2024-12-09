console.log("renderer.ts");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  const selectFolderButton = document.getElementById("selectFolderButton");
  const musicList = document.getElementById("musicList");
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

  let currentIndex = 0;
  let files: any[] = [];

  if (
    selectFolderButton &&
    musicList &&
    audioPlayer &&
    playPauseButton &&
    prevButton &&
    nextButton &&
    seekBar &&
    currentTimeDisplay &&
    durationDisplay
  ) {
    selectFolderButton.addEventListener("click", async () => {
      const result = await window.ipcRenderer.invoke("select-folder");
      if (result) {
        files = result;
        musicList.innerHTML = "";
        result.forEach((file: any, index: number) => {
          const listItem = document.createElement("li");
          listItem.textContent = `${file.title || file.name} - ${
            file.artist || "Unknown Artist"
          }`;
          listItem.classList.add(
            "mb-2",
            "cursor-pointer",
            "hover:text-gray-400"
          );
          listItem.addEventListener("click", () => {
            currentIndex = index;
            playCurrentFile();
          });
          musicList.appendChild(listItem);
        });
      }
    });

    playPauseButton.addEventListener("click", () => {
      if (audioPlayer.paused) {
        audioPlayer.play();
        if (playIcon && pauseIcon) {
          playIcon.classList.add("hidden");
          pauseIcon.classList.remove("hidden");
        }
      } else {
        audioPlayer.pause();
        if (playIcon && pauseIcon) {
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
