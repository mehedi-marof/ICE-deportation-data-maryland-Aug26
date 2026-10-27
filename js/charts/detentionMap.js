// Where people arrested in Maryland were held (since Jan. 20, 2025). Sticky graphic for the detention scrollytelling.
// Steps 0-1: every ICE facility that held someone arrested in Maryland, sized by people held.
// Step 2: the single most common path (Baltimore hold room straight to a Louisiana jail).
// Steps 3-6: the most common of the longer, five-stop paths (25 people), drawn stop by stop, with the map zooming in.
// Data: facilities.csv, route.csv, geo/us-states.json
import { COLORS, fmt, titleCase, tooltip, row, DUR } from '../lib/util.js';

const W = 960, H = 580, EAST = ['MD', 'VA', 'PA', 'DE', 'NJ', 'NY', 'WV', 'DC'];
const STEPS = [
  { show: f => f.state === 'MD' },
  { show: f => EAST.includes(f.state) || f.state === 'LA', focus: 'LA' },
  { short: true, zoom: [1, 5] },
  { stop: 1, zoom: [1, 3] }, { stop: 3, zoom: [1, 3], label: 'Two stops in Virginia' }, { stop: 4, zoom: [1, 5] }, { stop: 5, zoom: [1, 5] },
];
const LABELS = [['BALTIMORE HOLD ROOM', 'Baltimore', 12, 4, 'start'], ['SALISBURY HOLD ROOM', 'Salisbury', 10, 12, 'start'], ['FARMVILLE DETENTION CENTER', 'Farmville, Va.', -10, 4, 'end'],
  ['MOSHANNON VALLEY PROCESSING CENTER', 'Philipsburg, Pa.', -10, 0, 'end'], ['ALEXANDRIA STAGING FACILITY', 'Alexandria, La.', -12, 4, 'end'],
  ['PORT ISABEL SPC', 'Los Fresnos, Texas', -12, 4, 'end'], ['AZ REM OP COORD CENTER (AROCC)', 'Mesa, Ariz.', 10, 4, 'start']];
const STOP_NAMES = { 'BALTIMORE HOLD ROOM': 'Baltimore hold room', 'CAROLINE DETENTION FACILITY': 'Caroline Detention Facility',
  'RICHMOND SUB-OFFICE HOLD': 'Richmond hold room', 'WINN CORRECTIONAL CENTER': 'Winn Correctional Center', 'ALEXANDRIA STAGING FACILITY': 'Alexandria Staging Facility' };
const ROUTE_COLOR = '#1979b9';   // CNS blue, distinct from the red facility circles
// the single most common path overall ends here (360 people; see the notebook, section 4.2)
const SHORT_FACILITY = 'RICHWOOD COR CENTER', SHORT_LABEL = 'Richwood Correctional Center, La.';

export function createDetentionMap(host, D) {
  const proj = d3.geoAlbersUsa().fitExtent([[10, 10], [W - 10, H - 10]], D.geo.us), path = d3.geoPath(proj);
  const fac = D.facilities.filter(f => f.lat != null).map(f => { const p = proj([f.lon, f.lat]); return p ? { ...f, x: p[0], y: p[1] } : null; }).filter(Boolean)
    .sort((a, b) => b.people - a.people);
  const stops = D.route.map(s => { const [x, y] = proj([s.lon, s.lat]); return { ...s, x, y }; });
  const r = d3.scaleSqrt().domain([0, 7300]).range([0, 36]);
  const tip = tooltip(host), k = Math.min(2.3, Math.max(1, 760 / Math.max(1, host.clientWidth)));   // bigger text on small screens
  host.querySelectorAll('svg').forEach(s => s.remove());
  const svg = d3.select(host).insert('svg', ':first-child').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Map of ICE detention facilities that held people arrested in Maryland');
  const g = svg.append('g');   // everything zooms together
  const states = g.append('g').selectAll('path').data(D.geo.us.features).join('path').attr('d', path).attr('fill', '#e9e9e5').attr('stroke', '#fff').attr('stroke-width', 0.7);
  const dots = g.append('g').selectAll('circle').data(fac).join('circle').attr('cx', d => d.x).attr('cy', d => d.y).attr('r', 0)
    .attr('fill', d => d.state === 'MD' ? COLORS.ink : COLORS.red).attr('fill-opacity', 0.62).attr('stroke', '#fff').attr('stroke-width', 0.7)
    .on('mouseenter', (ev, d) => tip.show(d.x / W * host.clientWidth, (d.y - 10) / H * host.clientHeight,
      `<b>${titleCase(d.detention_facility)}</b>${row(`${d.city}, ${d.state}`, '')}${row('People held', fmt(d.people))}${row('No prior conviction or charge', fmt(d.people_no_record))}`))
    .on('mouseleave', tip.hide);
  const narrow = k > 1.3, list = narrow
    ? LABELS.filter(l => !['SALISBURY HOLD ROOM', 'MOSHANNON VALLEY PROCESSING CENTER'].includes(l[0])).map(l => l[0] === 'BALTIMORE HOLD ROOM' ? [l[0], l[1], -8, -14, 'end'] : l)
    : LABELS;
  const labels = g.append('g').attr('pointer-events', 'none').selectAll('text').data(list.map(([f, t, dx, dy, a]) => ({ f: fac.find(z => z.detention_facility === f), t, dx, dy, a })).filter(d => d.f))
    .join('text').attr('class', 'label halo').attr('x', d => d.f.x + d.dx).attr('y', d => d.f.y + d.dy).attr('text-anchor', d => d.a).style('font-size', 14 * k + 'px').attr('opacity', 0).text(d => d.t);

  // the route: curved legs between stops, numbered markers, and a label for the current stop
  const legs = g.append('g').selectAll('path').data(stops.slice(1)).join('path')
    .attr('d', (s, i) => { const a = stops[i], mx = (a.x + s.x) / 2, my = (a.y + s.y) / 2 - Math.hypot(s.x - a.x, s.y - a.y) * 0.22; return `M${a.x},${a.y} Q${mx},${my} ${s.x},${s.y}`; })
    .attr('fill', 'none').attr('stroke', ROUTE_COLOR).attr('stroke-linecap', 'round');
  legs.each(function () { const L = this.getTotalLength(); d3.select(this).attr('stroke-dasharray', `${L} ${L}`).attr('stroke-dashoffset', L).datum(Object.assign(d3.select(this).datum(), { L })); });
  const marks = g.append('g').selectAll('g').data(stops).join('g').attr('transform', s => `translate(${s.x},${s.y})`).attr('opacity', 0);
  marks.append('circle').attr('fill', ROUTE_COLOR).attr('stroke', '#fff');
  marks.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em').style('font-weight', 700).style('fill', '#fff').text(s => s.stop);
  const shortEnd = fac.find(f => f.detention_facility === SHORT_FACILITY), start = stops[0];
  const shortLeg = g.append('path').attr('fill', 'none').attr('stroke', ROUTE_COLOR).attr('stroke-linecap', 'round')
    .attr('d', shortEnd ? (() => { const mx = (start.x + shortEnd.x) / 2, my = (start.y + shortEnd.y) / 2 - Math.hypot(shortEnd.x - start.x, shortEnd.y - start.y) * 0.22; return `M${start.x},${start.y} Q${mx},${my} ${shortEnd.x},${shortEnd.y}`; })() : '');
  const shortL = shortEnd ? shortLeg.node().getTotalLength() : 0;
  shortLeg.attr('stroke-dasharray', `${shortL} ${shortL}`).attr('stroke-dashoffset', shortL);
  const shortDot = g.append('circle').attr('fill', ROUTE_COLOR).attr('stroke', '#fff').attr('opacity', 0).attr('cx', shortEnd ? shortEnd.x : 0).attr('cy', shortEnd ? shortEnd.y : 0);
  const stopLabel = g.append('text').attr('class', 'label halo').attr('opacity', 0);

  const zoomFor = (a, b) => {   // fit stops a..b (1-based) with padding; identity when not zoomed
    const pts = stops.slice(a - 1, b), x0 = d3.min(pts, p => p.x), x1 = d3.max(pts, p => p.x), y0 = d3.min(pts, p => p.y), y1 = d3.max(pts, p => p.y);
    const s = Math.min(6, 0.6 * Math.min(W / Math.max(40, x1 - x0), H / Math.max(40, y1 - y0)));
    return { s, tx: W / 2 - s * (x0 + x1) / 2, ty: H / 2 - s * (y0 + y1) / 2 };
  };

  let step = -1;
  function setStep(n, animate = true) {
    step = n; const S = STEPS[n], t = d3.transition().duration(animate ? DUR * 1.3 : 0).ease(d3.easeCubicInOut);
    const z = S.zoom ? zoomFor(...S.zoom) : { s: 1, tx: 0, ty: 0 };
    g.transition(t).attr('transform', `translate(${z.tx},${z.ty}) scale(${z.s})`);
    states.transition(t).attr('stroke-width', 0.7 / z.s)
      .attr('fill', f => S.focus && f.properties.name === 'Louisiana' ? '#f6dcdc' : f.properties.name === 'Maryland' ? '#dcdcd7' : '#e9e9e5');
    shortLeg.transition(t).attr('stroke-width', 3.2 / z.s).attr('stroke-dashoffset', S.short ? 0 : shortL);
    shortDot.transition(t).attr('r', 8 / z.s).attr('stroke-width', 1.5 / z.s).attr('opacity', S.short ? 1 : 0);
    if (S.short) {   // the most common path overall: straight from Baltimore to Louisiana
      dots.transition(t).attr('r', d => Math.max(1.5, r(d.people)) / z.s).attr('fill-opacity', 0.12).attr('stroke-width', 0.7 / z.s);
      labels.transition(t).attr('opacity', 0); legs.transition(t).attr('stroke-dashoffset', s => s.L);
      marks.transition(t).attr('opacity', s => s.stop === 1 ? 1 : 0);
      marks.select('circle').transition(t).attr('r', 8 / z.s).attr('stroke-width', 1.5 / z.s);
      marks.select('text').transition(t).style('font-size', 11 / z.s + 'px');
      stopLabel.text(SHORT_LABEL)
        .attr('x', shortEnd.x + 14 / z.s).attr('y', shortEnd.y - 10 / z.s).style('font-size', 16 * k / z.s + 'px')
        .style('stroke-width', 3.5 / z.s + 'px').attr('opacity', 0).transition(t).attr('opacity', 1);
    } else if (S.stop) {   // route mode: facilities fade back, the path draws in
      dots.transition(t).attr('r', d => Math.max(1.5, r(d.people)) / z.s).attr('fill-opacity', 0.12).attr('stroke-width', 0.7 / z.s);
      labels.transition(t).attr('opacity', 0);
      legs.transition(t).attr('stroke-width', 3.2 / z.s).attr('stroke-dashoffset', (s, i) => i + 2 <= S.stop ? 0 : s.L);
      marks.transition(t).attr('opacity', s => s.stop <= S.stop ? 1 : 0);
      marks.select('circle').transition(t).attr('r', s => (s.stop === S.stop ? 11 : 8) / z.s).attr('stroke-width', 1.5 / z.s);
      marks.select('text').transition(t).style('font-size', 11 / z.s + 'px');
      const cur = stops[S.stop - 1];
      stopLabel.text(S.label || `${STOP_NAMES[cur.facility] || titleCase(cur.facility)}, ${cur.state === 'LA' ? 'La.' : cur.state === 'VA' ? 'Va.' : 'Md.'}`)
        .attr('x', cur.x + 16 / z.s).attr('y', cur.y + (S.stop === 3 ? 22 : -10) / z.s).style('font-size', 16 * k / z.s + 'px')
        .style('stroke-width', 3.5 / z.s + 'px').attr('opacity', 0).transition(t).attr('opacity', 1);
    } else {
      dots.transition(t).attr('r', d => S.show(d) && d.people > 0 ? Math.max(2, r(d.people)) : 0)
        .attr('fill-opacity', d => S.focus && d.state !== S.focus && d.state !== 'MD' ? 0.3 : 0.7).attr('stroke-width', 0.7);
      labels.transition(t).attr('opacity', d => S.show(d.f) ? 1 : 0);
      legs.transition(t).attr('stroke-dashoffset', s => s.L); marks.transition(t).attr('opacity', 0); stopLabel.transition(t).attr('opacity', 0);
    }
  }
  setStep(0, false);
  return { setStep, redraw: () => setStep(step, false) };
}
