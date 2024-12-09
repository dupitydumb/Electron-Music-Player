console.log("renderer.ts");

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  const selectFolderButton = document.getElementById("selectFolderButton");
  const musicList = document.getElementById("musicList");
  const audioPlayer = document.getElementById(
    "audioPlayer"
  ) as HTMLAudioElement | null;

  if (selectFolderButton && musicList && audioPlayer) {
    selectFolderButton.addEventListener("click", async () => {
      const result = await window.ipcRenderer.invoke("select-folder");
      if (result) {
        musicList.innerHTML = "";
        result.forEach(
          (file: {
            name: string;
            path: string;
            title: string;
            album: string;
            artist: string;
            picture: string;
          }) => {
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
              audioPlayer.src = file.path;
              audioPlayer.play();
              const nowPlayingTitle =
                document.getElementById("nowPlayingTitle");
              const nowPlayingAlbum =
                document.getElementById("nowPlayingAlbum");
              const nowPlayingArtist =
                document.getElementById("nowPlayingArtist");
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
                console.log(file.picture);
                if (file.picture) {
                  nowPlayingCover.src = file.picture;
                } else {
                  nowPlayingCover.src = "";
                }
              }
            });
            musicList.appendChild(listItem);
          }
        );
      }
    });
  }
});
