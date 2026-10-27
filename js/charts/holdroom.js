// Median hours spent in ICE's Baltimore hold room, by month people were booked in, January 2024-July 2026.
// Dashed line = 12-hour standard; marker = March 6, 2026 court ruling. Data: holdroom.csv
import { COLORS, fmt, pct, monthLabel, makeSvg, tooltip, row, yGrid, marker } from '../lib/util.js';

export function drawHoldroom(host, rows) {
  const data = rows.filter(d => d.month >= '2024-01'), h = 250, m = { t: 22, r: 48, b: 24, l: 38 };
  const { svg, W } = makeSvg(host, h), tip = tooltip(host);
  const x = d3.scalePoint().domain(data.map(d => d.month)).range([m.l, W - m.r]), y = d3.scaleLinear().domain([0, 120]).range([h - m.b, m.t]);
  yGrid(svg, y, [0, 24, 48, 72, 96, 120], m.l, W - m.r, v => v + 'h');
  svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(12)).attr('y2', y(12)).attr('stroke', COLORS.ink).attr('stroke-dasharray', '4 3');
  svg.append('text').attr('class', 'anno-sub').attr('x', W - m.r + 5).attr('y', y(12) + 4).text('12 hrs');
  data.forEach(d => { if (d.month.endsWith('-01')) svg.append('text').attr('x', x(d.month)).attr('y', h - 6).attr('text-anchor', 'middle').text(d.month.slice(0, 4)); });
  svg.append('path').attr('d', d3.area().x(d => x(d.month)).y0(y(0)).y1(d => y(d.median_hours)).curve(d3.curveMonotoneX)(data)).attr('fill', COLORS.red).attr('fill-opacity', 0.1);
  svg.append('path').attr('d', d3.line().x(d => x(d.month)).y(d => y(d.median_hours)).curve(d3.curveMonotoneX)(data)).attr('fill', 'none').attr('stroke', COLORS.red).attr('stroke-width', 2.5);
  const pk = data.reduce((a, b) => (b.median_hours > a.median_hours ? b : a));
  svg.append('circle').attr('cx', x(pk.month)).attr('cy', y(pk.median_hours)).attr('r', 4).attr('fill', COLORS.red);
  svg.append('text').attr('class', 'label halo').attr('x', x(pk.month) - 8).attr('y', y(pk.median_hours) + 4).attr('text-anchor', 'end').text(`${Math.round(pk.median_hours)} hours, ${monthLabel(pk.month)}`);
  marker(svg, x('2026-03'), m.t - 4, h - m.b, 'March 6', 'court ruling', 'right');
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', h - m.t - m.b).attr('fill', 'transparent')
    .on('mousemove', ev => { const [px] = d3.pointer(ev); const i = Math.max(0, Math.min(data.length - 1, Math.round((px - m.l) / x.step()))); const d = data[i];
      tip.show(x(d.month) / W * host.clientWidth, y(d.median_hours) / h * host.clientHeight,
        `<b>${monthLabel(d.month)}</b>${row('Median stay', Math.round(d.median_hours) + ' hrs')}${row('Held over 12 hours', pct(d.share_over_12h))}${row('People booked in', fmt(d.people))}`); })
    .on('mouseleave', tip.hide);
}
