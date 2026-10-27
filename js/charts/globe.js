// Deportation globe (scrollytelling): where people arrested in Maryland were sent, all records.
// Step 0: every destination, sized by departures. Step 1: only the 308 sent to a country other than their own,
// as pies by citizenship. Step 2: the globe turns to West Africa.
// Circles sit at the center of each country, not the arrival point.
// Data: destinations.csv, routes.csv, countries.csv, geo/world.json
import { fmt, titleCase, tooltip, row, DUR, reducedMotion } from '../lib/util.js';

const S = 800, R = 370;
const GROUPS = [['Central America', '#faa916', ['EL SALVADOR', 'GUATEMALA', 'HONDURAS', 'NICARAGUA']],
  ['Venezuela', '#2ec4b6', ['VENEZUELA']], ['Cuba', '#80217f', ['CUBA']], ['Other', '#9a9a9a', null]];
const groupOf = c => GROUPS.find(g => g[2] && g[2].includes(c)) || GROUPS[3];
const STEPS = [
  { rotate: [86, -14], mode: 'all', labels: ['MEXICO', 'GUATEMALA', 'ECUADOR'] },
  { rotate: [92, -18], mode: 'other', labels: ['MEXICO'] },
  { rotate: [20, -8], mode: 'other', labels: ['GHANA'] },
];
export const GLOBE_LEGEND = GROUPS.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('');

export function createGlobe(host, D) {
  const pos = Object.fromEntries(D.countries.map(c => [c.ice_name, [c.lon, c.lat]]));
  const dest = D.destinations.filter(d => pos[d.departure_country]).map(d => ({ ...d, ll: pos[d.departure_country] }));
  const otherBy = d3.rollup(D.routes, v => d3.sum(v, d => d.people), d => d.departure_country, d => groupOf(d.citizenship_country)[0]);
  const other = [...otherBy].filter(([c]) => pos[c]).map(([c, m]) => ({ country: c, ll: pos[c], total: d3.sum([...m.values()]),
    parts: GROUPS.map(([g, col]) => ({ g, col, n: m.get(g) || 0 })).filter(p => p.n) }));
  const proj = d3.geoOrthographic().scale(R).translate([S / 2, S / 2]).clipAngle(90).rotate(STEPS[0].rotate), path = d3.geoPath(proj);
  const rAll = d3.scaleSqrt().domain([0, 2200]).range([0, 44]), rOther = d3.scaleSqrt().domain([0, 210]).range([0, 34]);
  const tip = tooltip(host);
  host.querySelectorAll('svg').forEach(s => s.remove());
  const svg = d3.select(host).insert('svg', ':first-child').attr('viewBox', `0 0 ${S} ${S}`).attr('role', 'img')
    .attr('aria-label', 'Globe showing the countries people arrested in Maryland were deported to');
  const defs = svg.append('defs'), gr = defs.append('radialGradient').attr('id', 'globe-shade').attr('cx', '38%').attr('cy', '32%');
  gr.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff'); gr.append('stop').attr('offset', '100%').attr('stop-color', '#e4ebf1');
  const sphere = svg.append('path').datum({ type: 'Sphere' }).attr('fill', 'url(#globe-shade)').attr('stroke', '#c9d3db');
  const land = svg.append('g').selectAll('path').data(D.geo.world.features).join('path').attr('fill', '#d6d6d1').attr('stroke', '#fff').attr('stroke-width', 0.6);
  const dots = svg.append('g').selectAll('circle').data(dest).join('circle').attr('r', 0)
    .attr('fill', '#1979b9').attr('fill-opacity', 0.7).attr('stroke', '#fff').attr('stroke-width', 0.8)
    .on('mouseenter', (ev, d) => { const [x, y] = proj(d.ll); tip.show(x / S * host.clientWidth, (y - 10) / S * host.clientHeight,
      `<b>${titleCase(d.departure_country)}</b>${row('Departures', fmt(d.departures))}${row('Citizens of another country', fmt(d.citizens_of_other_country))}`); })
    .on('mouseleave', tip.hide);
  const pies = svg.append('g').selectAll('g').data(other).join('g').attr('opacity', 0)
    .on('mouseenter', (ev, d) => { const [x, y] = proj(d.ll); tip.show(x / S * host.clientWidth, (y - 10) / S * host.clientHeight,
      `<b>Sent to ${titleCase(d.country)}</b>${d.parts.map(p => row(p.g, p.n)).join('')}`); })
    .on('mouseleave', tip.hide);
  const arc = d3.arc().innerRadius(0);
  pies.each(function (d) {
    const r = Math.max(4, rOther(d.total)), g = d3.select(this);
    g.selectAll('path').data(d3.pie().sort(null).value(p => p.n)(d.parts)).join('path')
      .attr('d', a => arc.outerRadius(r)(a)).attr('fill', a => a.data.col).attr('stroke', '#fff').attr('stroke-width', 0.8);
  });
  const labels = svg.append('g').attr('pointer-events', 'none');

  const visible = ll => d3.geoDistance(ll, proj.invert([S / 2, S / 2])) < Math.PI / 2 - 0.05;
  let step = 0;
  function place() {
    sphere.attr('d', path); land.attr('d', path);
    dots.attr('cx', d => proj(d.ll)[0]).attr('cy', d => proj(d.ll)[1]).attr('display', d => visible(d.ll) ? null : 'none');
    pies.attr('transform', d => `translate(${proj(d.ll)})`).attr('display', d => visible(d.ll) ? null : 'none');
    labels.selectAll('text').attr('x', d => proj(d.ll)[0] + d.dx).attr('y', d => proj(d.ll)[1] + 4).attr('display', d => visible(d.ll) ? null : 'none');
  }
  function setLabels(st) {
    const list = st.labels.map(c => { const d = st.mode === 'all' ? dest.find(x => x.departure_country === c) : other.find(x => x.country === c);
      if (!d) return null; const r = st.mode === 'all' ? rAll(d.departures) : rOther(d.total);
      return { ll: d.ll, dx: r + 5, text: `${titleCase(c)} ${fmt(st.mode === 'all' ? d.departures : d.total)}` }; }).filter(Boolean);
    labels.selectAll('text').data(list, d => d.text).join(e => e.append('text').attr('class', 'label halo').style('font-size', '15px').attr('opacity', 0)
      .call(t => t.transition().delay(DUR * 0.6).duration(300).attr('opacity', 1)), u => u, x => x.remove()).text(d => d.text);
  }
  function setStep(s, animate = true) {
    step = s; const st = STEPS[s], t = d3.transition().duration(animate && !reducedMotion ? DUR * 1.6 : 0).ease(d3.easeCubicInOut);
    const from = proj.rotate(), interp = d3.interpolate(from, st.rotate);
    svg.transition(t).tween('spin', () => k => { proj.rotate(interp(k)); place(); });
    dots.transition(t).attr('r', d => st.mode === 'all' ? Math.max(2.5, rAll(d.departures)) : 0);
    pies.transition(t).attr('opacity', st.mode === 'other' ? 1 : 0);
    setLabels(st); place();
  }
  setStep(0, false);
  return { setStep, redraw: () => setStep(step, false) };
}
