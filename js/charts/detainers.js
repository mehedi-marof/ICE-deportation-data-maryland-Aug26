// Monthly detainers ICE lodged at Maryland facilities, by facility type, January 2024-July 2026, with the Feb. 17, 2026 ban marked.
// Facility types are CNS classifications of ICE's facility names. Data: detainers.csv
import { COLORS, fmt, monthLabel, makeSvg, tooltip, row, yGrid, marker } from '../lib/util.js';

const n = v => +v || 0;
const LINES = [
  ['County jails', COLORS.blue, d => n(d['County jail'])],
  ['State prisons and state-run jails', COLORS.purple, d => n(d['State prison or state-run jail'])],
  ['Police, courts and federal', COLORS.gray, d => n(d['Police or court']) + n(d['Federal custody'])],
];

export function drawDetainers(host, rows) {
  const data = rows.filter(d => d.month >= '2024-01' && d.month <= '2026-07'), h = 240, m = { t: 26, r: 8, b: 24, l: 32 };
  const { svg, W } = makeSvg(host, h), tip = tooltip(host);
  const x = d3.scalePoint().domain(data.map(d => d.month)).range([m.l, W - m.r]);
  const y = d3.scaleLinear().domain([0, 250]).range([h - m.b, m.t]);
  yGrid(svg, y, [0, 100, 200], m.l, W - m.r);
  data.forEach(d => { if (d.month.endsWith('-01')) svg.append('text').attr('x', x(d.month)).attr('y', h - 6).attr('text-anchor', 'middle').text(d.month.slice(0, 4)); });
  LINES.slice().reverse().forEach(([, c, f]) => svg.append('path').attr('d', d3.line().x(d => x(d.month)).y(d => y(f(d))).curve(d3.curveMonotoneX)(data))
    .attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2.2));
  marker(svg, x('2026-02') + x.step() * 16 / 28, 2, h - m.b, 'Ban, Feb. 17', null, 'left');
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', h - m.t - m.b).attr('fill', 'transparent')
    .on('mousemove', ev => { const [px] = d3.pointer(ev); const i = Math.max(0, Math.min(data.length - 1, Math.round((px - m.l) / x.step()))); const d = data[i];
      tip.show(x(d.month) / W * host.clientWidth, y(LINES[0][2](d)) / h * host.clientHeight, `<b>${monthLabel(d.month)}</b>${LINES.map(([name, , f]) => row(name, fmt(f(d)))).join('')}`); })
    .on('mouseleave', tip.hide);
}
