import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 3000;

async function getCoordinatesFromPages(pages) {

    for (const page of pages.slice(0, 5)) {
        const title = page.title || page;
        const url =
            "https://en.wikipedia.org/w/api.php" +
            "?action=query" +
            "&prop=coordinates" +
            "&titles=" + encodeURIComponent(title) +
            "&format=json" +
            "&origin=*";

        try {

            const response = await fetch(url);
            const data = await response.json();

            const resultPages = data.query.pages;
            const result = Object.values(resultPages)[0];

            if (result.coordinates) {

                return {
                    lat: result.coordinates[0].lat,
                    lon: result.coordinates[0].lon
                };
            }
        } catch (err) {
            continue;
        }
    }
    return null;
}

// home
app.get("/", (req, res) => {
  res.send("GeoChronos API running");
});

// get events by date
app.get("/api/events", async (req, res) => {

    let {month, day} = req.query;

    if(!month || !day) {
        return res.status(400).json({
            error: "Month and day required"
        });
    }

    // pad to 2 digits (i.e: 2 → 02)
    month = String(month).padStart(2, "0");
    day = String(day).padStart(2, "0");

    try {

        const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": "GeoChronos/1.0 (student project)",
                "Api-User-Agent": "GeoChronos/1.0 (student project)",
                "Accept": "application/json"
            }
        });

        if(!response.ok) {
            const text = await response.text();
            console.error("wikipedia response:", text);
            throw new Error("wikipedia api error");
        }
        
        const data = await response.json();

        const events = data.events.map(e => ({
            year: e.year,
            title: e.text,
            pages: e.pages.map(p => p.title)
        }));

        res.json(events);
    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed to fetch events"
        });
    }
});

app.get("/api/events-with-location", async (req, res) => {

    let { month, day } = req.query;

    if (!month || !day) {
    return res.status(400).json({
        error: "Month and day required"
    });
    }

    month = String(month).padStart(2, "0");
    day = String(day).padStart(2, "0");

    try {
        // fetch events first
        const eventsUrl = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`;
        const eventsRes = await fetch(eventsUrl);
        const eventsData = await eventsRes.json();

        const results = [];

        // limit for now (api safety)
        const limitedEvents = eventsData.events.slice(0, 15);

        for (const e of limitedEvents) {

            if (!e.pages.length) continue;

            const coords = await getCoordinatesFromPages(e.pages);

            if (!coords) continue;

            results.push({
                year: e.year,
                title: e.text,
                lat: coords.lat,
                lon: coords.lon
            });
        }

        res.json(results);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: "Failed to fetch events"
        });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
