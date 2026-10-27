// Scrollama setup for a scrollytelling section.
// Each .step has data-step="n"; onStep(n, direction) runs when that step reaches the middle of the screen.

export function setupScrolly(sectionEl, onStep) {
  const steps = [...sectionEl.querySelectorAll('.step')];
  const activate = el => { steps.forEach(s => s.classList.toggle('is-active', s === el)); };
  if (!window.scrollama) {           // fallback: no library, show the first step and leave the chart in its full state
    activate(steps[0]); onStep(+steps[steps.length - 1].dataset.step, 'down'); return null;
  }
  // "Next" button: jumps to the next step while the section is on screen
  const next = document.createElement('button');
  next.className = 'next'; next.type = 'button'; next.innerHTML = 'Next ↓'; next.setAttribute('aria-label', 'Next step');
  sectionEl.querySelector('.sticky').appendChild(next);
  let current = 0;
  next.addEventListener('click', () => {
    const el = steps[Math.min(current + 1, steps.length - 1)];
    scrollBy({ top: el.getBoundingClientRect().top - innerHeight * 0.45, behavior: 'smooth' });
  });
  new IntersectionObserver(es => next.classList.toggle('on', es[0].isIntersecting), { threshold: 0.3 }).observe(sectionEl);

  const scroller = scrollama();
  scroller.setup({ step: steps, offset: innerWidth < 760 ? 0.8 : 0.6 })
    .onStepEnter(({ element, direction }) => { activate(element); current = steps.indexOf(element);
      next.style.visibility = current === steps.length - 1 ? 'hidden' : 'visible'; onStep(+element.dataset.step, direction); });
  window.addEventListener('resize', () => scroller.resize());
  activate(steps[0]); onStep(0, 'down');
  return scroller;
}
