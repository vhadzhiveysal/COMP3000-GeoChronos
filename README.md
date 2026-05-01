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

```text
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
