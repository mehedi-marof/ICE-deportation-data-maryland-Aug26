// The data pipeline for the page: every chart reads a CSV from data/.
// These files are written by the analysis notebook (maryland_ice_notebook.qmd), Part 5.

const FILES = {
  growth: 'growth.csv', custody: 'custody.csv', g287: 'g287.csv', detainers: 'detainers.csv',
  counties: 'counties.csv', cities: 'cities.csv', holdroom: 'holdroom.csv', facilities: 'facilities.csv', route: 'route.csv',
  destinations: 'destinations.csv', routes: 'routes.csv', countries: 'countries.csv',
};

export async function loadData(base = 'data/') {
  const entries = await Promise.all(Object.entries(FILES).map(async ([key, file]) => {
    // autoType turns "2024-01" into a Date; months and quarters stay text so charts can compare them
    const parse = r => { const keep = { month: r.month, quarter: r.quarter }; const o = d3.autoType(r);
      for (const k in keep) if (keep[k] !== undefined) o[k] = keep[k]; return o; };
    const rows = await d3.csv(base + file, key === 'counties' ? null : parse);
    return [key, rows];
  }));
  const D = Object.fromEntries(entries);
  // pandas writes True/False and R writes TRUE/FALSE; d3.autoType only converts lowercase
  for (const [key, rows] of Object.entries(D)) if (key !== 'counties')
    rows.forEach(r => { for (const k in r) if (/^(true|false)$/i.test(r[k])) r[k] = /^true$/i.test(r[k]); });
  D.counties = D.counties.map(r => ({ ...r, pop_2020: +r.pop_2020, arrests: +r.arrests, no_record: +r.no_record,
    no_record_2024: +r.no_record_2024, per_10k: +r.per_10k, eastern_shore: /^true$/i.test(r.eastern_shore) }));
  const [md, us, world] = await Promise.all(['maryland', 'us-states', 'world'].map(f => d3.json(base + `geo/${f}.json`)));
  D.geo = { md, us, world };
  return D;
}

