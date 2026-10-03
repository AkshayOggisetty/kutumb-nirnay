# Kutumb Nirnay — prototype

**Career counselling and decision support for the household — not just the student.**

> Kutumb Nirnay counsels the whole family, turning a career argument into a shared,
> evidence-backed decision.

Vocational education in India does not fail for lack of information. It fails because
the parent holds the veto and has never been given anything to change their mind with.
Every career tool on the market speaks to the student. This one speaks to the household.

---

## Run it

```bash
node server.mjs          # then open http://localhost:8081
node server.mjs 3000     # or pick a port
```

Node 18+. No build step, no `npm install`, no dependencies, no network calls.
Everything on screen is computed in the browser.

**Live:** https://akshayoggisetty.github.io/kutumb-nirnay/

---

## The seven screens

| # | Screen | What it does |
|---|--------|--------------|
| 1 | **Home** | The argument: the decision is made at home, so that is where counselling belongs |
| 2 | **The household** · परिवार | District, income, student stage, and the objection actually being raised |
| 3 | **Two views** · दो नज़र | One decision rendered twice — what the student wants to know, what the parent wants to know |
| 4 | **The numbers** · हिसाब | Household cash flow month by month, placement rates, and the gap this project targets |
| 5 | **Nearby** · नज़दीक | Radial plan of every institute in range with distance, travel mode, journey time and monthly fare |
| 6 | **Answers** · सवाल | The objection-handling engine, plus verified local alumni |
| 7 | **The plan** · फ़ैसला | A printable family decision record with concerns named and a review date |

Any screen is directly linkable: `#/numbers`, `#/nearby`, `#/plan`.

---

## What is genuinely implemented

| Real | Seeded for demonstration |
|------|--------------------------|
| Haversine distance with a 1.3 road-detour factor | Centre names, seat counts and fees |
| Travel-mode, journey-time and fare inference across seven bands | Wage bands and placement rates |
| Household cash-flow model — fees out, stipend and wages in, discounted by placement probability | Alumni outcome records |
| Break-even and crossover detection between two paths | District demand labels |
| Browser geolocation with graceful fallback | — |
| All SVG charts, drawn from the computed series | — |
| Radial map projection from real coordinates | — |

Every seeded figure is labelled as such on screen. Nothing is presented as measured fact.

**Centre coordinates are real**, so distance and travel arithmetic behave correctly
during a demo even though the records themselves are illustrative.

---

## Design decisions

**The map is drawn, not tiled.** Bearing gives direction, radius gives distance on a
square-root scale. No tile server, no API key, no network dependency — it works on a
weak connection and a cheap phone, and it reads clearly on a projector.

**Charts use a validated palette.** The two-series pair `#c2701c` / `#3f62c4` was run
through a six-check accessibility validator against the parchment surface: lightness
band, chroma floor, colourblind separation (ΔE 26.8 protan / 26.2 tritan), normal-vision
separation (ΔE 30.4) and contrast ≥ 3:1 — all pass. Magnitude charts use a single hue
because they encode amount, not identity.

**The household is the unit, not the student.** Wages are discounted by each path's
placement rate, because the figure a family should plan against is the expected one,
not the best case.

**Paper is an output, not a fallback.** The plan screen prints. Parents trust paper,
and paper travels to the relatives who also get a say.

---

## Built against real rails

Recommendations resolve to NSQF levels, NCO occupation codes and NAPS apprenticeships,
and every path terminates in a real government destination — Skill India Digital Hub,
Apprenticeship India, the National Career Service, the National Qualifications Register,
MyScheme and DigiLocker.

Adapter interfaces sit behind every external surface, so moving from seeded data to live
integration is a configuration change rather than a rewrite. Production data sources:
PLFS microdata (MoSPI) for earnings by education level, the NCVET Qualification-Pack-to-NCO
mapping as the join key between courses and occupations, NSDC district skill-gap studies
for local demand, and the DGT ITI directory for centres.

---

## Layout

```
prototype/
  index.html              entry point
  server.mjs              dependency-free static server
  css/
    theme.css             design tokens — type, surface, ink, accents
    app.css               shell and screens
  js/
    core/engine.js        haversine, travel inference, household cash-flow model
    data/paths.js         career paths with NSQF levels and NCO codes
    data/centres.js       institutes at real coordinates
    data/voices.js        objection-handling content and alumni records
    ui/charts.js          inline SVG charts with hover layer
    ui/map.js             the radial "nearby" plate
    app.js               shell, routing, the seven screens
```

---

## Credits

Prototype, design and content by **Ishita Choudhary**.
