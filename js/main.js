// initialise the map
const map = L.map("map").setView([20, 0], 2);

// add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);


// load event data
fetch("data/sample-events.json")
  .then(response => response.json())
  .then(events => {
    console.log("Events loaded:", events);
    displayEvents(events);
  })
  .catch(error => {
    console.error("Error loading events:", error);
  });


// display markers on the map
function displayEvents(events) {
  events.forEach(event => {

    const marker = L.marker([event.lat, event.lon]).addTo(map);

    const popupContent = `
      <strong>${event.title}</strong><br>
      Year: ${event.year}<br>
      ${event.summary}
    `;

    marker.bindPopup(popupContent);

  });
}
