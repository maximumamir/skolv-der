const lat = 59.3293;
const lon = 18.0686;

const updateIntervalMs = 10 * 60 * 1000;


/* =========================
   HÄMTA ELEMENT
========================= */

const weekContainer = document.getElementById("week-forecast");
const updatedEl = document.getElementById("updated");
const rainWarningEl = document.getElementById("rain-warning");
const snowLayer = document.getElementById("snow-layer");

const mikuLeft = document.querySelector(".miku-left");
const mikuRight = document.querySelector(".miku-right");

const leftSpeech = mikuLeft.querySelector(".speech");
const rightSpeech = mikuRight.querySelector(".speech");


/* =========================
   SMHI API
========================= */

async function fetchSMHI() {
  const url =
    `https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/${lon}/lat/${lat}/data.json`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("SMHI API-fel");
  }

  return await res.json();
}


/* =========================
   VÄDERKODER
========================= */

function isSnow(code) {
  return code >= 21 && code <= 27;
}

function isRain(code) {
  return code >= 8 && code <= 14;
}

function isSleet(code) {
  return code >= 15 && code <= 20;
}


/* =========================
   VÄDERTEXT
========================= */

function weatherText(code) {
  if (code === 1) {
    return "Soligt";
  }

  if (code >= 2 && code <= 6) {
    return "Molnigt";
  }

  if (code === 7) {
    return "Dimmigt";
  }

  if (isRain(code)) {
    return "Regn";
  }

  if (isSleet(code)) {
    return "Snöblandat";
  }

  if (isSnow(code)) {
    return "Snö";
  }

  return "Okänt";
}


/* =========================
   VÄDERIKONER
========================= */

function weatherIcon(code) {
  if (isSnow(code) || isSleet(code)) {
    return "Väderläget/Snöar.png";
  }

  if (isRain(code)) {
    return "Väderläget/regnar.gif";
  }

  if (code === 7) {
    return "Väderläget/Dimmigt.png";
  }

  if (code === 1) {
    return "Väderläget/Soligt.png";
  }

  return "Väderläget/Molnigt.png";
}


/* =========================
   DATUM
========================= */

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================
   KLOCKA
========================= */

function startClock() {
  function updateClock() {
    const now = new Date();

    const dateText = now.toLocaleDateString("sv-SE", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });

    const timeText = now.toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit"
    });

    updatedEl.textContent = `${dateText} • ${timeText}`;
  }

  updateClock();
  setInterval(updateClock, 60000);
}


/* =========================
   SNÖEFFEKT
========================= */

function createSnow() {
  snowLayer.innerHTML = "";

  for (let i = 0; i < 30; i++) {
    const flake = document.createElement("span");

    flake.className = "snowflake";
    flake.textContent = "❄";

    flake.style.left = Math.random() * 100 + "%";

    flake.style.animationDuration =
      (7 + Math.random() * 8) + "s";

    flake.style.animationDelay =
      (-Math.random() * 12) + "s";

    flake.style.fontSize =
      (12 + Math.random() * 15) + "px";

    flake.style.opacity =
      (0.4 + Math.random() * 0.6);

    snowLayer.appendChild(flake);
  }
}


function setSnowEffect(enabled) {
  snowLayer.style.display = enabled ? "block" : "none";

  if (enabled && snowLayer.children.length === 0) {
    createSnow();
  }
}


/* =========================
   VINTERLÄGE OCH MIKU
========================= */

function updateWinterMode(todayItems) {
  const now = new Date();

  const futureItems = todayItems.filter(item => {
    return new Date(item.time) >= now;
  });

  const itemsToCheck =
    futureItems.length > 0 ? futureItems : todayItems;

  const snowing = itemsToCheck.some(item =>
    isSnow(Number(item.data.symbol_code))
  );

  const raining = itemsToCheck.some(item =>
    isRain(Number(item.data.symbol_code))
  );

  setSnowEffect(snowing);

  const showRainWarning = raining && !snowing;

  rainWarningEl.style.display =
    showRainWarning ? "flex" : "none";

  mikuLeft.style.display =
    showRainWarning ? "none" : "flex";

  mikuRight.style.display =
    showRainWarning ? "none" : "flex";

  const isDecember = now.getMonth() === 11;

  if (snowing) {
    leftSpeech.textContent = isDecember
      ? "JULSNÖ! 🎄❄"
      : "Det snöar idag! ❄";

  } else if (isDecember) {
    leftSpeech.textContent = "God jul! 🎄";

  } else if (raining) {
    leftSpeech.textContent = "Oj, det regnar!";

  } else {
    leftSpeech.textContent = "Kolla vädret!";
  }

  rightSpeech.textContent = "Its tiiimeeeee! 🎅";
}


/* =========================
   VECKOPROGNOS
========================= */

function renderWeek(timeSeries) {
  weekContainer.innerHTML = "";

  const days = {};
  const todayKey = getDateKey(new Date());

  timeSeries.forEach(item => {
    const date = new Date(item.time);

    if (isNaN(date.getTime())) {
      return;
    }

    const weekday = date.getDay();

    if (weekday === 0 || weekday === 6) {
      return;
    }

    const key = getDateKey(date);

    if (!days[key]) {
      days[key] = [];
    }

    days[key].push(item);
  });

  const todayItems = days[todayKey] || [];

  updateWinterMode(todayItems);

  Object.entries(days)
    .slice(0, 5)
    .forEach(([key, items]) => {
      const day = items[0];
      const date = new Date(day.time);

      const isToday = key === todayKey;

      const tempValue = Number(day.data.air_temperature);

      const temp =
        Number.isFinite(tempValue) && tempValue !== 9999
          ? Math.round(tempValue)
          : "--";

      const code = Number(day.data.symbol_code);

      const dayText = isToday
        ? `Idag ${date.getDate()}/${date.getMonth() + 1}`
        : `${date.toLocaleDateString("sv-SE", {
            weekday: "long"
          })} ${date.getDate()}/${date.getMonth() + 1}`;

      const card = document.createElement("div");

      card.className = "card";

      card.innerHTML = `
        <div class="day ${isToday ? "today" : ""}">
          ${dayText}
        </div>

        <img
          class="icon"
          src="${weatherIcon(code)}"
          alt="väderikon"
        >

        <div class="temp">
          ${temp}°C
        </div>

        <div class="desc">
          ${weatherText(code)}
        </div>
      `;

      weekContainer.appendChild(card);
    });
}


/* =========================
   MIKU-ANIMATION (HÖGER FÖRST, SEDAN VÄNSTER)
========================= */

function startMiku() {
  function showRight() {
    mikuRight.classList.add("show");

    setTimeout(() => {
      mikuRight.classList.remove("show");
    }, 5000);
  }

  function showLeft() {
    mikuLeft.classList.add("show");

    setTimeout(() => {
      mikuLeft.classList.remove("show");
    }, 4000);
  }

  function cycle() {
    // Högra Miku (julmiku) visas först
    showRight();

    // Vänstra Miku visas efter 5 sekunder
    setTimeout(showLeft, 5000);
  }

  cycle();

  // Upprepar hela loopen var 11:e sekund
  setInterval(cycle, 11000);
}


/* =========================
   UPPDATERA VÄDER
========================= */

async function updateWeather() {
  try {
    const data = await fetchSMHI();

    renderWeek(data.timeSeries);

  } catch (err) {
    console.error(err);

    updatedEl.textContent =
      "Kunde inte hämta väderdata";
  }
}


/* =========================
   STARTA SIDAN
========================= */

async function init() {
  startClock();
  startMiku();

  await updateWeather();

  setInterval(updateWeather, updateIntervalMs);
}

init();