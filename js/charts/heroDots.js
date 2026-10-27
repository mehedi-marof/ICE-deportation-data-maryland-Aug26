// Title screen: one dot per Maryland arrest, January-July 2026.
// Red = no prior conviction or pending charge. Drawn on a canvas because there are 4,000+ marks.
// Data: growth.csv (Maryland, Jan.-July 2026 column)

export function drawHeroDots(canvas, growth) {
  const nr = growth.find(d => d.category === 'No prior conviction or pending charge').md_2026;
  const other = d3.sum(growth.filter(d => d.category !== 'No prior conviction or pending charge'), d => d.md_2026), total = nr + other;
  const box = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  canvas.width = box.width * dpr; canvas.height = box.height * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const W = box.width, H = box.height, step = Math.sqrt(W * H / total);
  const cols = Math.ceil(W / step), rows = Math.ceil(total / cols), gx = W / cols, gy = H / rows;
  const red = new Set(d3.shuffler(d3.randomLcg(0.42))(d3.range(total)).slice(0, nr));   // fixed random order
  const r = Math.max(1.4, Math.min(gx, gy) * 0.28);
  for (let k = 0; k < total; k++) {
    ctx.beginPath();
    ctx.arc((k % cols) * gx + gx / 2, Math.floor(k / cols) * gy + gy / 2, r, 0, Math.PI * 2);
    ctx.fillStyle = red.has(k) ? 'rgba(199,30,29,.8)' : 'rgba(170,170,170,.55)';
    ctx.fill();
  }
}
