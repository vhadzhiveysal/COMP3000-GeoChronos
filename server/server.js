import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 3000;

/**
 * Extract the first valid coordinate from Wikimedia event pages
 */
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

/**
 * Fetch events for a single day
 */
async function fetchDay(month, day) {
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "GeoChronos/1.0 (student project)",
      "Accept": "application/json"
    }
  });

  if (!res.ok) throw new Error("Wikimedia API error");

  const data = await res.json();
  const results = [];

  for (const event of data.events) {
    const coords = extractBestCoordinates(event);
    if (!coords) continue;

    results.push({
      year: event.year,
      title: event.text,
      lat: coords.lat,
      lon: coords.lon
    });
  }

  return results;
}

// home
app.get("/", (req, res) => {
  res.send("GeoChronos API running");
});

// events endpoint (single day OR full year)
app.get("/api/events-with-location", async (req, res) => {
  let { month, day } = req.query;

  try {
    console.time("events");

    // CASE 1: specific day requested
    if (month && day) {
      month = String(month).padStart(2, "0");
      day = String(day).padStart(2, "0");

      const results = await fetchDay(month, day);
      console.timeEnd("events");
      return res.json(results);
    }

    // CASE 2: no date → fetch entire year
    const allResults = [];

    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, "0");

      for (let d = 1; d <= 31; d++) {
        const dd = String(d).padStart(2, "0");

        try {
          const dayResults = await fetchDay(mm, dd);
          allResults.push(...dayResults);
        } catch {
          // invalid dates (e.g. Feb 30) safely ignored
          continue;
        }
      }
    }

    console.timeEnd("events");
    res.json(allResults);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});