// Maryland arrest map, Jan. 20, 2025-Aug. 6, 2026: circles by recorded city, counties shaded by arrests per 10,000 residents.
// Used twice: as the sticky graphic in the scrollytelling section (setMode per step)
// and as the interactive county explorer (filters + county select).
// Data: cities.csv (lat/lon, arrests, no_record, community, custody, office), counties.csv, geo/maryland.json
import { COLORS, fmt, pct, shortCounty, tooltip, row, DUR } from '../lib/util.js';

export const MODES = {
  all:       { key: 'arrests',   color: '#3a3a3a',     label: 'All arrests' },
  norecord:  { key: 'no_record', color: COLORS.red,    label: 'No prior conviction or charge' },
  community: { key: 'community', color: COLORS.orange, label: 'In the community' },
  custody:   { key: 'custody',   color: COLORS.purple, label: 'From jails and prisons' },
  office:    { key: 'office',    color: COLORS.rust,   label: "At ICE's offices" },
};
const W = 900, H = 470, BINS = [10, 20, 40, 80];
// light theme for the explorer, dark theme for the scrollytelling section
const THEMES = {
  light: { ramp: ['#eef4f9', '#c6dbee', '#8fb9df', '#4d8fc7', '#1979b9'], base: '#f7f7f5', neighbor: '#f1f1ee', line: '#fff', shore: COLORS.ink, all: '#3a3a3a', ring: '#fff', key: '#888' },
  dark:  { ramp: ['#1f2a33', '#1e4a6e', '#2268a3', '#3f8fd0', '#86c5f5'], base: '#262626', neighbor: '#1a1a1a', line: '#3d3d3d', shore: '#fbd603', all: '#d9d9d9', ring: '#111', key: '#aaa' },
};
const LABELS = [['Baltimore', 10, -8, 'start'], ['Salisbury', 9, -7, 'start'], ['Ocean City', -6, 20, 'end'], ['Silver Spring', -10, 2, 'end'],
                ['Hyattsville', 9, 12, 'start'], ['Easton', 8, -6, 'start'], ['Frederick', 8, -6, 'start']];

export function createArrestMap(host, D, { choropleth = false, onSelect = null, theme = 'light' } = {}) {
  const T = THEMES[theme], RAMP = T.ramp, shade = v => { let k = 0; while (k < BINS.length && v >= BINS[k]) k++; return RAMP[k]; };
  const counties = D.geo.md.features.filter(f => f.properties.kind === 'county');
  const neighbors = D.geo.md.features.filter(f => f.properties.kind === 'neighbor');
  const proj = d3.geoConicConformal().parallels([38.3, 39.45]).rotate([77, 0]).fitExtent([[10, 10], [W - 10, H - 10]], { type: 'FeatureCollection', features: counties });
  const path = d3.geoPath(proj), byFips = Object.fromEntries(D.counties.map(c => [c.fips, c]));
  const cities = D.cities.filter(c => c.lat != null).map(c => { const [x, y] = proj([c.lon, c.lat]); return { ...c, x: c.city_clean === 'ICE BALTIMORE OFFICES' ? x + 12 : x, y: c.city_clean === 'ICE BALTIMORE OFFICES' ? y + 12 : y }; })
    .sort((a, b) => b.arrests - a.arrests);
  const r = d3.scaleSqrt().domain([0, 1600]).range([0, 30]);
  const tip = tooltip(host), k = Math.min(2.3, Math.max(1, 700 / Math.max(1, host.clientWidth)));   // bigger text on small screens
  host.querySelectorAll('svg').forEach(s => s.remove());
  const svg = d3.select(host).insert('svg', ':first-child').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Map of ICE arrests in Maryland since Jan. 20, 2025');
  svg.append('clipPath').attr('id', 'clip-' + host.id).append('rect').attr('width', W).attr('height', H);
  svg.append('g').attr('clip-path', `url(#clip-${host.id})`).selectAll('path').data(neighbors).join('path').attr('d', path).attr('fill', T.neighbor).attr('stroke', T.line);
  const cg = svg.append('g').attr('class', 'county');
  const cpaths = cg.selectAll('path').data(counties).join('path').attr('d', path).attr('fill', T.base).style('stroke', T.line).attr('tabindex', onSelect ? 0 : null)
    .style('cursor', onSelect ? 'pointer' : null)
    .on('mouseenter', (ev, f) => { const c = byFips[f.properties.fips], [cx, cy] = path.centroid(f);
      tip.show(cx / W * host.clientWidth, cy / H * host.clientHeight, `<b>${shortCounty(c.county)}</b>${row('Arrests since Jan. 20, 2025', fmt(c.arrests))}${row('Per 10,000 residents', c.per_10k)}`); })
    .on('mouseleave', tip.hide)
    .on('click keydown', (ev, f) => { if (!onSelect || (ev.type === 'keydown' && ev.key !== 'Enter')) return; onSelect(f.properties.fips); });
  const shore = svg.append('g').attr('pointer-events', 'none');
  shore.selectAll('path').data(counties.filter(f => byFips[f.properties.fips].eastern_shore)).join('path').attr('d', path).attr('fill', 'none').attr('stroke', T.shore).attr('stroke-width', 1.8).attr('opacity', 0);
  const dots = svg.append('g').selectAll('circle').data(cities).join('circle').attr('cx', d => d.x).attr('cy', d => d.y).attr('r', 0)
    .attr('stroke', T.ring).attr('stroke-width', 0.7).attr('fill-opacity', 0.6)
    .on('mouseenter', (ev, d) => tip.show(d.x / W * host.clientWidth, (d.y - 8) / H * host.clientHeight,
      `<b>${d.name}</b>${row('Arrests since Jan. 20, 2025', fmt(d.arrests))}${row('No prior conviction or charge', fmt(d.no_record))}${row('In the community', fmt(d.community))}${row('From jails and prisons', fmt(d.custody))}${row("At ICE's offices", fmt(d.office))}`))
    .on('mouseleave', tip.hide);
  const labels = svg.append('g').attr('pointer-events', 'none');
  LABELS.forEach(([n, dx, dy, a]) => { const c = cities.find(c => c.name === n); if (c) labels.append('text').attr('class', 'label halo').attr('x', c.x + dx).attr('y', c.y + dy).attr('text-anchor', a).style('font-size', 13 * k + 'px').text(n); });
  const key = svg.append('g').attr('transform', `translate(24,${H - 76})`);
  [100, 500, 1500].forEach(v => { key.append('circle').attr('cx', 32).attr('cy', 56 - r(v)).attr('r', r(v)).attr('fill', 'none').attr('stroke', T.key);
    key.append('text').attr('x', 32).attr('y', 56 - 2 * r(v) - 4).attr('text-anchor', 'middle').style('font-size', 11 * k + 'px').text(fmt(v)); });
  key.append('text').attr('x', 70).attr('y', 54).style('font-size', 11 * k + 'px').text('arrests');

  let mode = 'all', choro = choropleth, selected = null;
  function render(animate) {
    const m = MODES[mode], t = d3.transition().duration(animate ? DUR : 0).ease(d3.easeCubicInOut);
    dots.transition(t).attr('r', d => d[m.key] > 0 ? Math.max(1.8, r(d[m.key])) : 0).attr('fill', mode === 'all' ? T.all : m.color).attr('fill-opacity', choro && !choropleth ? 0.45 : 0.7);
    cpaths.transition(t).attr('fill', f => choro ? shade(byFips[f.properties.fips].per_10k) : T.base);
    shore.selectAll('path').transition(t).attr('opacity', choro && !choropleth ? 1 : 0);
    cpaths.classed('sel', f => f.properties.fips === selected);
    if (selected) cg.select('.sel').raise();
  }
  render(false);
  return {
    setMode(m, showChoro = choro, animate = true) { mode = m; choro = showChoro; render(animate); },
    select(fips) { selected = fips; render(false); },
    legendHTML: () => `<span>Arrests per 10,000 residents</span><span class="sw">${RAMP.map(c => `<i style="background:${c}"></i>`).join('')}</span><span>&lt;10 · 10–20 · 20–40 · 40–80 · 80+</span>`,
  };
}

// County panel for the explorer.
export function countyPanel(D, fips, els) {
  const c = D.counties.find(x => x.fips === fips), rank = D.counties.slice().sort((a, b) => b.per_10k - a.per_10k).findIndex(x => x.fips === fips) + 1;
  els.big.textContent = c.per_10k;
  els.cap.textContent = `arrests per 10,000 residents since Jan. 20, 2025, No. ${rank} of 24 Maryland jurisdictions`;
  els.dl.innerHTML = `<dt>Arrests since Jan. 20, 2025</dt><dd>${fmt(c.arrests)}</dd><dt>No prior conviction or charge</dt><dd>${fmt(c.no_record)}${c.arrests ? ` (${pct(c.no_record / c.arrests)})` : ''}</dd>` +
    `<dt>No-record arrests, all of 2024</dt><dd>${fmt(c.no_record_2024)}</dd><dt>Population (2020)</dt><dd>${fmt(c.pop_2020)}</dd>`;
}
