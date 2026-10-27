# ICE arrests in Maryland

Interactive data story by Mehedi Marof, Capital News Service.

Data: ICE arrest, detainer and detention records obtained by the [Deportation Data Project](https://deportationdata.org/data/processed/ice.html) through a public records lawsuit. Release of Aug. 24, 2026, covering Oct. 1, 2022, through Aug. 6, 2026.

## What's in this folder

```
index.html          the story
css/page.css        page design: type, columns, title screen, scroll sections
css/charts.css      chart frames, legends, tooltips, map layouts
js/main.js          loads the data and draws each chart
js/lib/             data loading, scrollytelling (Scrollama) and shared chart helpers
js/charts/          one file per chart
data/               the tables the charts read (CSV)
data/geo/           map shapes for Maryland, the U.S. and the world
assets/             CNS logo
```

| Chart | File | Data |
|---|---|---|
| Title dots | js/charts/heroDots.js | growth.csv |
| Arrests by criminal history, Jan.–July | js/charts/growth.js | growth.csv |
| Custodial vs. non-custodial arrests | js/charts/custody.js | custody.csv |
| 287(g) arrests and detainers | js/charts/g287.js, detainers.js | g287.csv, detainers.csv |
| Maryland arrest map (scroll) | js/charts/arrestMap.js | cities.csv, counties.csv, geo/maryland.json |
| Baltimore hold room | js/charts/holdroom.js | holdroom.csv |
| Detention map and route (scroll) | js/charts/detentionMap.js | facilities.csv, route.csv, geo/us-states.json |
| Where people were sent (globe, scroll) | js/charts/globe.js | destinations.csv, routes.csv, countries.csv, geo/world.json |

## Libraries

D3 7.8.5 (cdnjs) and Scrollama 3.2.0 (jsDelivr), loaded from the web. Fonts: Source Serif 4 and Poppins (Google Fonts).
