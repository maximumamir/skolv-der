const lat = 59.3293;
const lon = 18.0686;
const updateIntervalMs = 10 * 60 * 1000; // 10 min

const weekContainer = document.getElementById("week-forecast");
const updatedEl = document.getElementById("updated");
const rainWarningEl = document.getElementById("rain-warning");
const mikuLeft = document.querySelector(".miku-left");
const mikuRight = document.querySelector(".miku-right");

/* =========================
   SMHI - NYA API
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
   VÄDERTEXT
========================= */
function weatherText(code) {

  if (code === 1) return "Soligt";

  if (code >= 2 && code <= 6) {
    return "Molnigt";
  }

  if (code === 7) {
    return "Dimmigt";
  }

  if (code >= 8 && code <= 10) {
    return "Regn";
  }

  if (code >= 13) {
    return "Snö";
  }

  return "";
}

/* =========================
   IKONER
========================= */
function weatherIcon(code) {

  if (code >= 13) {
    return "Väderläget/Snöar.png";
  }

  if (code >= 8) {
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
   VECKOPROGNOS
========================= */
function renderWeek(timeSeries) {

  weekContainer.innerHTML = "";

  const days = {};
  const today = new Date();

  timeSeries.forEach(item => {

    const d = new Date(item.time);

    const weekday = d.getDay();

    // Hoppa över helg
    if (weekday === 0 || weekday === 6) {
      return;
    }

    const key = d.toISOString().split("T")[0];

    // Bara första prognosen för varje dag
    if (!days[key]) {
      days[key] = item;
    }
  });

  Object.values(days)
    .slice(0, 5)
    .forEach((day, index) => {

      const date = new Date(day.time);

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      // NYA SMHI FORMATET
      const temp = Math.round(day.data.air_temperature);
      const code = day.data.symbol_code;

      /* REGN */
      if (index === 0) {

        const raining = code >= 8 && code <= 10;

        rainWarningEl.style.display =
          raining ? "flex" : "none";

        mikuLeft.style.display =
          raining ? "none" : "flex";

        mikuRight.style.display =
          raining ? "none" : "flex";
      }

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

        <img class="icon"
             src="${weatherIcon(code)}"
             alt="väderikon">

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
   MIKU
========================= */
function startMiku() {

  const showLeft = () => {

    mikuLeft.classList.add("show");

    setTimeout(() => {
      mikuLeft.classList.remove("show");
    }, 4000);
  };

  const showRight = () => {

    mikuRight.classList.add("show");

    setTimeout(() => {
      mikuRight.classList.remove("show");
    }, 5000);
  };

  function cycle() {

    showLeft();

    setTimeout(showRight, 5000);
  }

  cycle();

  setInterval(cycle, 11000);
}

/* =========================
   UPDATE
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
   INIT
========================= */
async function init() {

  startClock();

  startMiku();

  await updateWeather();

  setInterval(updateWeather, updateIntervalMs);
}

init();