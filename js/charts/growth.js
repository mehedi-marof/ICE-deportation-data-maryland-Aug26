// "Maryland's increase came entirely from people with no record"
// Paired bars, Jan.-July 2025 vs. 2026, by criminal history. Data: growth.csv
import { COLORS, fmt, makeSvg } from '../lib/util.js';

export function drawGrowth(host, rows) {
  const narrow = host.clientWidth < 540, rh = 62, h = rows.length * rh + 20;
  const { svg, W } = makeSvg(host, h);
  const left = narrow ? 112 : 268, right = narrow ? 112 : 140;
  const x = d3.scaleLinear().domain([0, d3.max(rows, d => Math.max(d.md_2025, d.md_2026)) * 1.02]).range([left, W - right]);
  const names = narrow ? ['No record', 'Pending charge', 'Prior conviction'] : rows.map(d => d.category);
  svg.append('text').attr('x', W).attr('y', 9).attr('text-anchor', 'end').style('font-size', '10.5px').style('letter-spacing', '.08em').text('CHANGE');
  svg.append('line').attr('x1', W - 66).attr('x2', W - 66).attr('y1', 16).attr('y2', h - 4).attr('stroke', '#e4e4e0');
  rows.forEach((d, i) => {
    const y = 18 + i * rh, focus = i === 0;
    svg.append('text').attr('class', 'label').attr('x', left - 12).attr('y', y + 21).attr('text-anchor', 'end').text(names[i]);
    svg.append('rect').attr('x', left).attr('y', y).attr('height', 15).attr('width', x(d.md_2025) - left).attr('fill', COLORS.lightgray);
    svg.append('rect').attr('x', left).attr('y', y + 18).attr('height', 15).attr('width', x(d.md_2026) - left).attr('fill', focus ? COLORS.red : COLORS.ink);
    svg.append('text').attr('x', x(d.md_2025) + 6).attr('y', y + 12).text(fmt(d.md_2025) + '');
    svg.append('text').attr('class', 'label').attr('x', x(d.md_2026) + 6).attr('y', y + 30).text(fmt(d.md_2026) + '');
    svg.append('text').attr('class', 'label').attr('x', W).attr('y', y + 24).attr('text-anchor', 'end')
      .style('font-size', '16px').style('fill', d.md_change > 0 ? COLORS.red : COLORS.ink)
      .text((d.md_change > 0 ? '+' : '−') + fmt(Math.abs(d.md_change)));
  });
}
