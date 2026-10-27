// Shared helpers for every chart: colors, number formats, tooltips and SVG setup.
// d3 is loaded globally from the CDN in index.html.

export const COLORS = {
  red: '#c71e1d', orange: '#faa916', blue: '#1979b9', purple: '#80217f', rust: '#de5826',
  teal: '#2ec4b6', gray: '#b5b5b5', lightgray: '#d6d6d6', ink: '#0a0a0a', muted: '#666666',
  noRecord: '#c71e1d', pending: '#faa916', convicted: '#1979b9',
};

export const fmt = d3.format(',');
export const pct = v => Math.round(v * 100) + '%';
export const MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
export const monthLabel = m => MONTHS[+m.slice(5, 7) - 1] + ' ' + m.slice(0, 4);
export const titleCase = s => String(s).toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
export const shortCounty = n => n.replace(' County', '').replace('Baltimore city', 'Baltimore City');
export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const DUR = reducedMotion ? 0 : 750;

// Create (or replace) a responsive SVG inside a container; returns {host, svg, W}.
export function makeSvg(host, height) {
  host.querySelectorAll('svg').forEach(s => s.remove());
  const W = Math.max(300, host.clientWidth);
  const svg = d3.select(host).insert('svg', ':first-child').attr('viewBox', `0 0 ${W} ${height}`);
  return { host, svg, W };
}

// One tooltip per chart container.
export function tooltip(host) {
  let t = host.querySelector('.tip');
  if (!t) { t = document.createElement('div'); t.className = 'tip'; t.setAttribute('role', 'status'); host.appendChild(t); }
  return {
    show(x, y, html) {
      t.innerHTML = html;
      const w = host.clientWidth;
      t.style.left = Math.max(90, Math.min(w - 90, x)) + 'px';
      t.style.top = y + 'px';
      t.classList.add('on');
    },
    hide() { t.classList.remove('on'); },
  };
}
export const row = (label, value) => `<div class="row"><span>${label}</span><b>${value}</b></div>`;

// Horizontal gridlines with left labels.
export function yGrid(svg, y, values, x0, x1, format = fmt) {
  values.forEach(v => {
    svg.append('line').attr('class', v ? 'gridline' : 'baseline').attr('x1', x0).attr('x2', x1).attr('y1', y(v)).attr('y2', y(v));
    if (v) svg.append('text').attr('x', x0 - 6).attr('y', y(v) + 4).attr('text-anchor', 'end').text(format(v));
  });
}

// Vertical event marker with a two-line label.
export function marker(svg, x, top, bottom, title, sub, side = 'right') {
  svg.append('line').attr('x1', x).attr('x2', x).attr('y1', top).attr('y2', bottom).attr('stroke', COLORS.ink).attr('stroke-width', 1);
  const dx = side === 'right' ? 5 : -5, anchor = side === 'right' ? 'start' : 'end';
  svg.append('text').attr('class', 'anno').attr('x', x + dx).attr('y', top + 9).attr('text-anchor', anchor).text(title);
  if (sub) svg.append('text').attr('class', 'anno-sub').attr('x', x + dx).attr('y', top + 22).attr('text-anchor', anchor).text(sub);
}

// Wire a group of toggle buttons; calls onChange(value) when a new one is pressed.
export function toggles(container, onChange) {
  const buttons = [...container.querySelectorAll('button')];
  buttons.forEach(b => b.addEventListener('click', () => {
    if (b.getAttribute('aria-pressed') === 'true') return;
    buttons.forEach(x => x.setAttribute('aria-pressed', x === b));
    onChange(b.dataset.value);
  }));
}
