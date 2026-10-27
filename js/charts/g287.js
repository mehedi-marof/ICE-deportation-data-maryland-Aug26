// Monthly arrests ICE coded as 287(g), by county, January 2024-July 2026, with the Feb. 17, 2026 ban marked.
// Data: g287.csv (columns: month, Frederick County, Harford County, Cecil County, Elsewhere or unknown)
import { COLORS, monthLabel, makeSvg, tooltip, row, yGrid, marker } from '../lib/util.js';

const SERIES = [['Frederick County', COLORS.orange], ['Harford County', COLORS.blue], ['Cecil County', COLORS.teal], ['Elsewhere or unknown', COLORS.gray]];

export function drawG287(host, rows) {
  const data = rows.filter(d => d.month >= '2024-01' && d.month <= '2026-07'), h = 240, m = { t: 26, r: 6, b: 24, l: 28 };
  const { svg, W } = makeSvg(host, h), tip = tooltip(host);
  const x = d3.scaleBand().domain(data.map(d => d.month)).range([m.l, W - m.r]).paddingInner(0.22), y = d3.scaleLinear().domain([0, 30]).range([h - m.b, m.t]);
  yGrid(svg, y, [0, 10, 20, 30], m.l, W - m.r);
  data.forEach(d => {
    let acc = 0;
    SERIES.forEach(([k, c]) => { const v = +d[k] || 0; if (v) svg.append('rect').attr('x', x(d.month)).attr('width', x.bandwidth()).attr('y', y(acc + v)).attr('height', y(acc) - y(acc + v)).attr('fill', c); acc += v; });
    if (d.month.endsWith('-01')) svg.append('text').attr('x', x(d.month) + x.bandwidth() / 2).attr('y', h - 6).attr('text-anchor', 'middle').text(d.month.slice(0, 4));
    svg.append('rect').attr('x', x(d.month)).attr('width', x.bandwidth()).attr('y', m.t).attr('height', h - m.t - m.b).attr('fill', 'transparent')
      .on('mouseenter', () => tip.show((x(d.month) + x.bandwidth() / 2) / W * host.clientWidth, y(acc) / h * host.clientHeight,
        `<b>${monthLabel(d.month)}</b>${SERIES.map(([k]) => row(k.replace(' County', ''), +d[k] || 0)).join('')}`))
      .on('mouseleave', tip.hide);
  });
  marker(svg, x('2026-02') + x.bandwidth() * 16 / 28, 2, h - m.b, 'Ban, Feb. 17', null, 'left');
}
