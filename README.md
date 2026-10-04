# Kutumb Nirnay

**Career guidance for the whole family, not just the student.**

Most career advice speaks only to the student. Kutumb Nirnay is built for the household, so
the person who actually decides can see what a course costs, when the earning starts, how
often it leads to a job, and which training centres the student can realistically reach.

**Live:** https://akshayoggisetty.github.io/kutumb-nirnay/

---

## Run it locally

```bash
node server.mjs          # then open http://localhost:8081
node server.mjs 3000     # or pick a port
```

Node 18 or later. No build step, no install, no dependencies, no network calls. Everything
is computed in the browser and nothing is uploaded.

## Test it

```bash
npm install                            # puppeteer-core, for the test driver only
node test/run.mjs http://localhost:8081
```

60 interaction checks covering every route, every form control, the map, the charts, the
plan, persistence and the reset path. The run fails if the browser logs any console error.

---

## The seven screens

| Screen | What it does |
|---|---|
| **Start** | What the product is for, and a single way in |
| **Your details** | District, household income, how soon an earner is needed, what the student enjoys |
| **Explore options** | Eight courses scored out of 100 for this household and sorted by fit |
| **Compare two** | One decision in a student view and a parent view, plus the household balance over four years |
| **Find centres** | Every institute in range with distance, travel mode, journey time and monthly fare |
| **Family concerns** | The questions raised at home, each with an evidence based answer |
| **Your plan** | A printable decision record with signature lines and a review date |

Any screen is directly linkable: `#/explore`, `#/centres`, `#/plan`.

---

## What is computed, and what is illustrative

| Computed in the browser | Illustrative content |
|---|---|
| Haversine distance with a 1.3 road factor | Wage bands and placement rates |
| Travel mode, journey time and fare across seven bands | Institute records, seats and fees |
| Household cash flow, fees out against placement weighted wages in | Local outcome records |
| Break even month and crossover between two routes | |
| Course match scoring against interests, budget and urgency | |
| Every chart, drawn from the computed series | |

Institute coordinates are real, so distance and travel arithmetic behave correctly. The
course, wage and centre data is representative while data partnerships are established. The
production data path is set out in [REPORT.md](REPORT.md), section 4.

---

## Design decisions

**The map is drawn, not tiled.** Direction comes from the angle, distance from the radius
on a square root scale. No tile server, no API key, no network dependency, so it opens on a
weak connection and stays legible on a projector.

**Wages are weighted by placement rate.** A family should plan against the expected case,
not the best case. A course that places 31 per cent of the time contributes 31 per cent of
its wage to the projection. This is what keeps the comparison honest in both directions.

**The chart palette is validated.** The two series pair was checked against the page surface
for lightness band, chroma floor, colourblind separation, normal vision separation and
contrast. It scores 26.8 Delta E under protanopia and 30.4 under normal vision.

**Nothing leaves the device.** No account, no server, no analytics. The profile lives in
browser storage and the family can clear it at any time.

**Paper is an output.** The plan screen prints, because paper travels to the relatives who
also have a say.

---

## Layout

```
index.html              entry point
server.mjs              dependency free static server
css/
  theme.css             design tokens
  app.css               screens and components
js/
  core/engine.js        distance, travel inference, household cash flow model
  data/paths.js         courses with NSQF levels, NCO codes and match scoring
  data/centres.js       institutes at real coordinates
  data/voices.js        family concerns and local outcome records
  ui/charts.js          inline SVG charts
  ui/map.js             the centre finder
  app.js                screens, routing and all interaction
test/run.mjs            60 interaction checks
```

---

## Credits

Prototype, design and content by **Ishita Choudhary**.
