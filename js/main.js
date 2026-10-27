// main.js — loads the CSVs and draws every chart.
// Each chart lives in its own file in js/charts/; this file only connects them to the page.
import { loadData } from './lib/data.js';
import { setupScrolly } from './lib/scrolly.js';
import { drawHeroDots } from './charts/heroDots.js';
import { drawGrowth } from './charts/growth.js';
import { drawG287 } from './charts/g287.js';
import { drawDetainers } from './charts/detainers.js';
import { createArrestMap } from './charts/arrestMap.js';
import { drawHoldroom } from './charts/holdroom.js';
import { createDetentionMap } from './charts/detentionMap.js';
import { drawCustody } from './charts/custody.js';
import { createGlobe, GLOBE_LEGEND } from './charts/globe.js';

const $ = id => document.getElementById(id);

// Reading progress bar under the masthead
function progress() {
  const bar = document.querySelector('.progress'), h = document.documentElement;
  const update = () => { bar.style.width = (100 * h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) + '%'; };
  addEventListener('scroll', update, { passive: true }); update();
}

async function init() {
  const D = await loadData('data/');
  progress();

  // Charts whose layout depends on width are redrawn when the width changes.
  const statics = [
    () => drawHeroDots($('herodots'), D.growth),
    () => drawGrowth($('c-growth'), D.growth),
    () => drawG287($('c-287g'), D.g287),
    () => drawDetainers($('c-det'), D.detainers),
    () => drawHoldroom($('c-hold'), D.holdroom),
    () => drawCustody($('c-custody'), D.custody),
  ];
  statics.forEach(f => f());


  // Scrollytelling 1: the Maryland arrest map changes with each step.
  const STEP_MODES = ['all', 'norecord', 'office', 'community', 'norecord'];
  const scMap = createArrestMap($('m-arrests'), D);
  $('sc-scale').innerHTML = scMap.legendHTML();
  setupScrolly($('sc-arrests'), s => {
    scMap.setMode(STEP_MODES[s], s === 4);
    $('sc-scale').style.opacity = s === 4 ? 1 : 0;
  });


  // Scrollytelling 2: where people were held.
  const det = createDetentionMap($('m-detention'), D);
  setupScrolly($('sc-detention'), s => det.setStep(s));

  // Scrollytelling 3: the deportation globe.
  const globe = createGlobe($('m-globe'), D);
  document.querySelectorAll('.globe-legend').forEach(el => { el.innerHTML = GLOBE_LEGEND; });
  setupScrolly($('sc-globe'), s => globe.setStep(s));

  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;          // ignore mobile address-bar height changes
    lastW = innerWidth;
    clearTimeout(init.t);
    init.t = setTimeout(() => { statics.forEach(f => f()); }, 150);
  });
}

init().catch(err => {
  console.error(err);
  document.querySelectorAll('.viz').forEach(v => { v.innerHTML = '<p class="noscript">This chart could not load its data. The page must be served over HTTP (see README).</p>'; });
});
