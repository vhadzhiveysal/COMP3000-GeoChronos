// initialise the map
const map = L.map("map").setView([20, 0], 2);

// add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);


// create cluster group
const markerCluster = L.markerClusterGroup();

// store all events
let allEvents = [];

// timeline events
const slider = document.getElementById("slider");
const rangeDisplay = document.getElementById("rangeDisplay");

// load event data
fetch("data/sample-events.json")
  .then(response => response.json())
  .then(events => {
    allEvents = events;

    setupTimeline(allEvents);
    renderEvents(allEvents);
  })
  .catch(error => {
    console.error("Error loading events:", error);
  });

// setup timeline
function setupTimeline(events) {

  const years = events.map(e => e.year);

  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

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
}


// render markers
function renderEvents(events) {

  markerCluster.clearLayers();

  events.forEach(event => {

    const marker = L.marker([event.lat, event.lon]);

    marker.bindPopup(`
      <strong>${event.title}</strong><br>
      ${event.year}<br>
      ${event.summary}
    `);

    markerCluster.addLayer(marker);
  });

  map.addLayer(markerCluster);
}


// timeline handler
function handleTimelineChange(values) {
  const start = Number(values[0]);
  const end = Number(values[1]);

  rangeDisplay.textContent =
   `Showing: ${start} - ${end}`;

  const filtered = allEvents.filter(e =>
    e.year >= start && e.year <= end
  );

  renderEvents(filtered);
}