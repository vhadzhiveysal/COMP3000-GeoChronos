# COMP3000-GeoChronos

GeoChronos is an interactive web application for exploring historical events through both **time** and **geography**.  
It plots historical events on a world map and allows users to filter visible events using a **year-range timeline slider**.

The project uses live data from Wikimedia's **"On This Day"** feed, processes it through a Node.js backend, and displays mappable events in a browser-based interface.

## Features

- Interactive world map built with **Leaflet**
- Historical event markers plotted using live Wikimedia data
- **Marker clustering** to reduce clutter in dense regions
- **Timeline slider** for filtering visible events by year range
- Progressive day-by-day loading across the year
- Backend day-level caching to reduce repeated API calls
- BC year formatting for dates before year 0
- Simple legend explaining marker and cluster types

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript
- [Leaflet.js](https://leafletjs.com/)
- [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- [noUiSlider](https://refreshless.com/nouislider/)

### Backend
- Node.js
- Express
- node-fetch
- CORS

### Data Source
- Wikimedia **On This Day** API

## Project Goal

The aim of GeoChronos is to make history easier to explore visually.

Traditional history resources are often text heavy or presented as simple timelines. GeoChronos addresses this by combining:
- a **map**, to show where events happened
- a **timeline**, to show when they happened

This helps users understand the spatial spread of historical events and explore different periods more interactively.

## Current Functionality

The current version focuses on the strongest and most reliable working feature set:

- plotting standard historical **events**
- extracting usable coordinates already present in Wikimedia-linked event pages
- progressively loading events across all days of the year
- caching daily results in the backend for faster repeat loads

## Known Limitations

- The application currently works best with the main **historical events** feed.
- Events are only plotted when usable coordinates are available.
- Some historical entries are not mappable because they do not include clear geographic information.
- Additional categories such as births, deaths, or holidays were explored, but are not currently included in the main interface because they require more reliable geographic inference.

## Project Structure

```
GeoChronos/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
│
└── server/
    ├── server.js
    └── cache/
        └── day-cache.json
```

## How it works

1. The frontend requests event data day by day from the backend.
2. The backend checks whether that day already exists in the local cache.
3. If cached, the server returns the saved result.
4. If not cached, the server requests the data from Wikimedia.
5. Events with valid coordinates are returned to the frontend.
6. The frontend progressively adds markers to the map and updates the timeline range.

## Setup Instructions

### 1. Clone the repository

```
git clone <https://github.com/vhadzhiveysal/COMP3000-GeoChronos>
cd GeoChronos
```

### 2. Install backend dependencies

Open a terminal inside the `server` folder:

```
cd server
npm install
```

### 3. Start the backend

```
node server.js
```
You should see something like:
`Server running on port 3000`

### 4. Run the frontend
You can run the frontend with `Live Server` in VS Code, or use a simple local server from the project root:

```
python -m http.server 8000
```

Then open:
`http://localhost:8000`

## Usage 
- Wait for events to load progressively on the map
- Zoom in and out to explore different regions
- Click markers to view event details
- Use the timeline slider to filter events by year range

## Example Interface Features
- Single plotted event = one mapped historical event
- Clustered markers = multiple nearby events grouped together
- Timeline slider = controls which years are visible on the map

## Design Decisions
A few important design decisions shaped the current version of the project:
- Direct coordinate extraction was prioritised over aggressive inference to keep results more reliable
- Marker clustering was added to improve readability
- Progressive loading was used to avoid long blocking waits
- Backend caching was introduced to reduce repeated calls to the same API endpoints

## Author
Veysel Hadzhiveysal
