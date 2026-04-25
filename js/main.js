// initialise the map
const map = L.map("map").setView([20, 0], 2);

// use CARTO tiles
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 20
}).addTo(map);

// create cluster group
const markerCluster = L.markerClusterGroup();
map.addLayer(markerCluster);

// store all events
let allEvents = [];
const seenEvents = new Set();

// timeline elements
const slider = document.getElementById("slider");
const rangeDisplay = document.getElementById("rangeDisplay");

let sliderInitialised = false;
let totalDays = 0;
let loadedDays = 0;

function formatYear(year) {
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  }

  return `${year}`;
}

function generateAllDates() {
  const dates = [];

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(2024, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      dates.push({
        month: String(month).padStart(2, "0"),
        day: String(day).padStart(2, "0")
      });
    }
  }

  return dates;
}

async function fetchDay(month, day) {
  const response = await fetch(
    `http://localhost:3000/api/events-with-location?month=${month}&day=${day}`
  );

  const data = await response.json();

  if (!Array.isArray(data)) {
    console.error(`API did not return an array for ${month}/${day}:`, data);
    return [];
  }

  return data
    .filter(event =>
      typeof event.year === "number" &&
      typeof event.lat === "number" &&
      typeof event.lon === "number"
    )
    .map(event => ({
      ...event,
      month,
      day
    }));
}

function addEvents(newEvents) {
  let added = false;

  for (const event of newEvents) {
    const key = `${event.year}|${event.month}|${event.day}|${event.title}`;

    if (seenEvents.has(key)) continue;

    seenEvents.add(key);
    allEvents.push(event);
    added = true;
  }

  if (added) {
    updateTimeline();
    renderCurrentRange();
  }
}

function updateTimeline() {
  if (!allEvents.length) {
    rangeDisplay.textContent = `Loading events... ${loadedDays}/${totalDays} days`;
    return;
  }

  const years = allEvents.map(e => e.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  if (!sliderInitialised) {
    noUiSlider.create(slider, {
      start: [minYear, maxYear],
      connect: true,
      step: 1,
      range: {
        min: minYear,
        max: maxYear
      },
      format: {
        to: value => Math.round(value),
        from: value => Number(value)
      }
    });

    slider.noUiSlider.on("update", handleTimelineChange);
    sliderInitialised = true;
  } else {
    const currentValues = slider.noUiSlider.get().map(Number);

    slider.noUiSlider.updateOptions({
      range: {
        min: minYear,
        max: maxYear
      },
      start: currentValues
    }, false);
  }
}

function renderEvents(events) {
  markerCluster.clearLayers();

  events.forEach(event => {
    const marker = L.marker([event.lat, event.lon]);

    marker.bindPopup(`
      <strong>${event.title}</strong><br>
      ${formatYear(event.year)}<br>
      ${event.day}/${event.month}
    `);

    markerCluster.addLayer(marker);
  });
}

function renderCurrentRange() {
  if (!sliderInitialised) return;

  const [start, end] = slider.noUiSlider.get().map(Number);

  const filtered = allEvents.filter(e =>
    e.year >= start && e.year <= end
  );

  renderEvents(filtered);

  rangeDisplay.textContent =
    `Showing: ${formatYear(start)} - ${formatYear(end)} • ${filtered.length} plotted • ${loadedDays}/${totalDays} days loaded`;
}

function handleTimelineChange() {
  renderCurrentRange();
}

async function loadAllDaysProgressively() {
  allEvents = [];
  seenEvents.clear();
  loadedDays = 0;

  markerCluster.clearLayers();

  if (slider.noUiSlider) {
    slider.noUiSlider.destroy();
  }

  sliderInitialised = false;

  const dates = generateAllDates();
  totalDays = dates.length;

  rangeDisplay.textContent = `Loading events... 0/${totalDays} days`;

  const queue = [...dates];
  const CONCURRENCY = 3;

  async function worker() {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) return;

      try {
        const events = await fetchDay(next.month, next.day);
        addEvents(events);
      } catch (error) {
        console.error(`Failed to load ${next.month}/${next.day}:`, error);
      }

      loadedDays++;

      if (!sliderInitialised) {
        rangeDisplay.textContent = `Loading events... ${loadedDays}/${totalDays} days`;
      } else {
        renderCurrentRange();
      }

      await new Promise(resolve => setTimeout(resolve, 120));
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker())
  );

  if (!allEvents.length) {
    rangeDisplay.textContent = "No plottable events found";
    return;
  }

  renderCurrentRange();
}

// initial load
loadAllDaysProgressively();