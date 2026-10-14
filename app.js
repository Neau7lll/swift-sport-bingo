const challenges = [
  { title: "ZC31S First Gen", caption: "The original hot hatch" },
  { title: "ZC32S Second Gen", caption: "Generation two" },
  { title: "ZC33S Third Gen", caption: "The turbo era" },
  { title: "The Bone Stock Sport", caption: "Factory fresh" },
  { title: "The Champion Yellow", caption: "Yellow fever" },
  { title: "No More Room for Mods", caption: "Modded to the max" },
  { title: "2 Swifts 1 Pic", caption: "Double trouble" },
  { title: "The Rolling Shot", caption: "Motion captured" },
  { title: "The Drive Through", caption: "Pit stop!" },
  { title: "Skittles", caption: "A colourful lineup" },
  { title: "Any Colour but White", caption: "White doesn't count" },
  { title: "Swiftie Sighting", caption: "Find another owner" },
  { title: "Wheel Goals", caption: "Show-stopping wheels" }
];

// The card uses the first 12 challenges.
const cardChallenges = challenges.slice(0, 12);

const STORAGE_KEY = "swiftSportBingo.v1";

const grid = document.getElementById("bingoGrid");
const photoInput = document.getElementById("photoInput");
const nameInput = document.getElementById("playerName");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const progressMessage = document.getElementById("progressMessage");
const downloadButton = document.getElementById("downloadPdf");
const finishTitle = document.getElementById("finishTitle");
const finishMessage = document.getElementById("finishMessage");

let activeSquare = null;
let game = { name: "", photos: Array(12).fill(null) };

function saveGame() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    return true;
  } catch (error) {
    alert(
      "Your browser could not save the game. Try a smaller photo or remove a photo and try again."
    );
    return false;
  }
}

function loadGame() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      game.name = typeof parsed.name === "string" ? parsed.name : "";
      if (Array.isArray(parsed.photos)) {
        game.photos = Array.from(
          { length: 12 },
          (_, i) => typeof parsed.photos[i] === "string"
            ? parsed.photos[i]
            : null
        );
      }
    }
  } catch (error) {
    console.warn("Saved game could not be loaded.", error);
  }
}

function renderGrid() {
  grid.innerHTML = "";

  cardChallenges.forEach((challenge, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bingo-cell";
    button.setAttribute(
      "aria-label",
      `${challenge.title}: ${game.photos[index] ? "photo added, tap to replace" : "add photo"}`
    );

    const photoArea = document.createElement("div");
    photoArea.className = "cell-photo";

    if (game.photos[index]) {
      const image = document.createElement("img");
      image.src = game.photos[index];
      image.alt = challenge.title;
      photoArea.appendChild(image);
      button.classList.add("completed");
    } else {
      const hint = document.createElement("div");
      hint.className = "upload-hint";
      hint.innerHTML = '<span class="camera">＋</span>ADD PHOTO';
      photoArea.appendChild(hint);
    }

    const check = document.createElement("span");
    check.className = "cell-check";
    check.textContent = "✓";
    check.setAttribute("aria-hidden", "true");
    photoArea.appendChild(check);

    const info = document.createElement("div");
    info.className = "cell-info";

    const number = document.createElement("span");
    number.className = "cell-number";
    number.textContent = `CHALLENGE ${String(index + 1).padStart(2, "0")}`;

    const title = document.createElement("span");
    title.className = "cell-title";
    title.textContent = challenge.title;

    const caption = document.createElement("span");
    caption.className = "cell-caption";
    caption.textContent = game.photos[index]
      ? "PHOTO CAPTURED · TAP TO REPLACE"
      : challenge.caption;

    info.append(number, title, caption);
    button.append(photoArea, info);

    button.addEventListener("click", () => {
      activeSquare = index;
      photoInput.value = "";
      photoInput.click();
    });

    grid.appendChild(button);
  });

  updateProgress();
}

function updateProgress() {
  const count = game.photos.filter(Boolean).length;
  const complete = count === 12;

  progressText.textContent = `${count} / 12 FOUND`;
  progressBar.style.width = `${(count / 12) * 100}%`;
  downloadButton.disabled = !complete;

  if (complete) {
    progressMessage.textContent = "All 12 found. You're a Swift Sport legend!";
    finishTitle.textContent = "MISSION COMPLETE!";
    finishMessage.textContent =
      "You've spotted all 12. Your finisher's card is ready to download.";
  } else {
    progressMessage.textContent =
      `${12 - count} more ${12 - count === 1 ? "challenge" : "challenges"} to go. Keep hunting!`;
    finishTitle.textContent = "THE FINISH LINE";
    finishMessage.textContent =
      "Find all 12 challenges to unlock your finisher's PDF.";
  }
}

// Resize and compress images before saving to reduce phone storage use.
function processPhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose an image."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read this photo."));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("Could not open this photo."));
      image.onload = () => {
        const maxSide = 1000;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");

        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

photoInput.addEventListener("change", async () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file || activeSquare === null) return;

  const index = activeSquare;

  try {
    const photo = await processPhoto(file);
    const previous = game.photos[index];

    game.photos[index] = photo;

    if (!saveGame()) {
      game.photos[index] = previous;
      return;
    }

    renderGrid();
  } catch (error) {
    alert(error.message || "Something went wrong with that photo.");
  } finally {
    activeSquare = null;
  }
});

nameInput.addEventListener("input", () => {
  game.name = nameInput.value.slice(0, 40);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch (error) {
    // The name can still be used for the current session.
  }
});

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load a bingo photo."));
    image.src = dataUrl;
  });
}

// Crop a photo to fill its PDF box without stretching it.
async function addCroppedPhoto(pdf, dataUrl, x, y, w, h) {
  const image = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const ratio = w / h;

  canvas.width = 600;
  canvas.height = Math.round(600 / ratio);

  const ctx = canvas.getContext("2d");
  const sourceRatio = image.width / image.height;
  let sx = 0, sy = 0, sw = image.width, sh = image.height;

  if (sourceRatio > ratio) {
    sw = image.height * ratio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / ratio;
    sy = (image.height - sh) / 2;
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  pdf.addImage(canvas.toDataURL("image/jpeg", 0.8), "JPEG", x, y, w, h);
}

async function downloadPDF() {
  if (game.photos.some(photo => !photo)) return;

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF generation could not load. Check your internet connection and try again.");
    return;
  }

  downloadButton.disabled = true;
  downloadButton.textContent = "BUILDING YOUR BINGO CARD...";

  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const pageWidth = 210;
    const margin = 10;
    const gap = 3;
    const cellWidth = (pageWidth - margin * 2 - gap * 2) / 3;
    const cellHeight = 57;
    const photoHeight = 35;
    const startY = 44;

    pdf.setFillColor(23, 23, 23);
    pdf.rect(0, 0, pageWidth, 36, "F");

    pdf.setTextColor(246, 213, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(19);
    pdf.text("CAR SPOT BINGO", margin, 13);

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text("SUZUKI SWIFT SPORT EDITION", margin, 21);

    pdf.setFontSize(8);
    const player = game.name.trim() || "Swift Sport Player";
    pdf.text(`PLAYER: ${player}`.slice(0, 65), margin, 29);
    pdf.text(`COMPLETED: ${new Date().toLocaleDateString()}`, pageWidth - margin, 29, {
      align: "right"
    });

    pdf.setTextColor(23, 23, 23);

    for (let index = 0; index < 12; index++) {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = margin + col * (cellWidth + gap);
      const y = startY + row * (cellHeight + gap);

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(205, 205, 195);
      pdf.roundedRect(x, y, cellWidth, cellHeight, 1.5, 1.5, "FD");

      pdf.setFillColor(246, 213, 0);
      pdf.rect(x, y, cellWidth, 5, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text(
        `CHALLENGE ${String(index + 1).padStart(2, "0")}`,
        x + 2,
        y + 3.6
      );

      await addCroppedPhoto(
        pdf,
        game.photos[index],
        x + 2,
        y + 7,
        cellWidth - 4,
        photoHeight
      );

      pdf.setFontSize(8);
      pdf.setTextColor(23, 23, 23);

      const lines = pdf.splitTextToSize(
        cardChallenges[index].title,
        cellWidth - 4
      );

      pdf.text(lines.slice(0, 2), x + 2, y + 46);
      pdf.setFontSize(6);
      pdf.setTextColor(100, 100, 100);
      pdf.text("PHOTO VERIFIED BY PLAYER", x + 2, y + 53);
      pdf.setTextColor(23, 23, 23);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(23, 23, 23);
    pdf.text("12 / 12 — MISSION COMPLETE", pageWidth / 2, 286, {
      align: "center"
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text("BUILT FOR SWIFT SPORT PEOPLE. DRIVE SAFE.", pageWidth / 2, 292, {
      align: "center"
    });

    const safeName = (game.name.trim() || "player")
      .replace(/[^a-z0-9_-]/gi, "-")
      .slice(0, 30);

    pdf.save(`swift-sport-bingo-${safeName}.pdf`);
  } catch (error) {
    console.error(error);
    alert("The PDF could not be generated. Please try again.");
  } finally {
    downloadButton.disabled = game.photos.filter(Boolean).length !== 12;
    downloadButton.textContent = "↓ DOWNLOAD MY BINGO PDF";
  }
}

downloadButton.addEventListener("click", downloadPDF);

document.getElementById("resetGame").addEventListener("click", () => {
  const confirmed = confirm(
    "Start a new hunt? This removes all 12 photos and resets your saved progress."
  );

  if (!confirmed) return;

  game = { name: "", photos: Array(12).fill(null) };

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Reset the in-memory game even if storage is unavailable.
  }

  nameInput.value = "";
  renderGrid();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

loadGame();
nameInput.value = game.name;
renderGrid();
