import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());

const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, "cache");
const CACHE_FILE = path.join(CACHE_DIR, "day-cache.json");

let dayCache = {};
let saveTimer = null;

async function loadCache() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    dayCache = JSON.parse(raw);
    console.log(`Loaded cache with ${Object.keys(dayCache).length} entries`);
  } catch {
    dayCache = {};
    console.log("No existing cache found, starting fresh");
  }
}

function scheduleCacheSave() {
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(async () => {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      await fs.writeFile(CACHE_FILE, JSON.stringify(dayCache, null, 2), "utf-8");
      console.log("Cache saved");
    } catch (err) {
      console.error("Failed to save cache:", err);
    }
  }, 500);
}

// extract the first valid coordinate from Wikimedia event pages
function extractBestCoordinates(event) {
  if (!event.pages) return null;

  for (const page of event.pages) {
    if (
      page.coordinates &&
      typeof page.coordinates.lat === "number" &&
      typeof page.coordinates.lon === "number"
    ) {
      return {
        lat: page.coordinates.lat,
        lon: page.coordinates.lon
      };
    }
  }

  return null;
}

function getCacheKey(month, day) {
  return `${month}-${day}`;
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
  const key = getCacheKey(month, day);

  if (dayCache[key]) {
    return dayCache[key];
  }

  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${month}/${day}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "GeoChronos/1.0 (student project)",
      "Accept": "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`Wikimedia API error ${res.status} for ${month}/${day}`);
  }

  const data = await res.json();
  const feedItems = Array.isArray(data.events) ? data.events : [];
  const results = [];

  for (const event of feedItems) {
    const coords = extractBestCoordinates(event);
    if (!coords) continue;

    results.push({
      year: event.year,
      title: event.text,
      lat: coords.lat,
      lon: coords.lon
    });
  }

  dayCache[key] = results;
  scheduleCacheSave();

  return results;
}

// home
app.get("/", (req, res) => {
  res.send("GeoChronos API running");
});

app.get("/api/cache-status", (req, res) => {
  res.json({
    cachedDays: Object.keys(dayCache).length
  });
});

// return everything already cached
app.get("/api/cached-events", (req, res) => {
  const dates = generateAllDates();
  const events = [];
  const cachedDays = [];

  for (const date of dates) {
    const key = getCacheKey(date.month, date.day);

    if (Array.isArray(dayCache[key])) {
      cachedDays.push(`${date.month}-${date.day}`);

      for (const event of dayCache[key]) {
        events.push({
          ...event,
          month: date.month,
          day: date.day
        });
      }
    }
  }

  res.json({
    events,
    cachedDays
  });
});

// single day endpoint only
app.get("/api/events-with-location", async (req, res) => {
  let { month, day } = req.query;

  if (!month || !day) {
    return res.status(400).json({
      error: "month and day are required"
    });
  }

  month = String(month).padStart(2, "0");
  day = String(day).padStart(2, "0");

  try {
    const results = await fetchDay(month, day);
    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      error: "Failed to fetch events"
    });
  }
});

await loadCache();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});