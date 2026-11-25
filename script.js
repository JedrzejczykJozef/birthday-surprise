'use strict';
const $ = (id) => document.getElementById(id);
const screens = [...document.querySelectorAll('[data-screen]')];
const segments = [...document.querySelectorAll('.progress-track span')];
const profileItems = [...document.querySelectorAll('.profile-item')];
const labels = ['Weryfikacja', 'Analiza profilu', 'Dopasowanie', 'Prezent', 'Plan dnia'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let stage = 0, generation = 0, scanFrame = 0, scanning = false, autoScan = false, scanStart = 0;
const pause = (ms) => new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? Math.min(ms, 100) : ms));
function showStage(index, moveFocus = true) {
  stage = index;
  generation++;
  screens.forEach((screen, i) => {screen.hidden = i !== index;});
  segments.forEach((segment, i) => segment.classList.toggle('active', i <= index));
  $('step-label').textContent = `0${index + 1} / 05 — ${labels[index]}`;
  document.body.classList.toggle('disco', index >= 3);
  document.querySelector('meta[name="theme-color"]').content = index >= 3 ? '#171024' : '#101519';
  window.scrollTo(0, 0);
  if (moveFocus) screens[index].querySelector('h1').focus({preventScroll:true});
  if (index === 1) runProfile(generation);
  if (index === 2) runSearch(generation);
  if (index === 3) confetti(180);
}
function updateScan(value) { $('scan-percent').textContent = `${String(value).padStart(2, '0')}%`; }
function cancelScan() {
  if (!scanning || autoScan) return;
  scanning = false;
  cancelAnimationFrame(scanFrame);
  $('scan').classList.remove('scanning');
  updateScan(0);
  $('scan-instruction').textContent = 'Przytrzymaj palec trochę dłużej. Spróbuj ponownie!';
}
function startScan(automatic = false) {
  if (stage !== 0 || scanning || $('scan').disabled) return;
  scanning = true; autoScan = automatic; scanStart = performance.now();
  $('scan').classList.add('scanning');
  $('scan-instruction').textContent = 'Weryfikacja solenizantki w toku…';
  function tick(now) {
    if (!scanning || stage !== 0) return;
    const value = Math.min(100, Math.floor((now - scanStart) / 20));
    updateScan(value);
    if (value < 100) { scanFrame = requestAnimationFrame(tick); return; }
    scanning = false;
    $('scan').disabled = true;
    $('scan-alt').disabled = true;
    $('scan').classList.remove('scanning');
    $('scan-instruction').textContent = 'Tożsamość potwierdzona. Dostęp przyznany!';
    if (typeof navigator.vibrate === 'function') navigator.vibrate(40);
    const token = generation;
    pause(550).then(() => { if (token === generation && stage === 0) showStage(1); });
  }
  scanFrame = requestAnimationFrame(tick);
}
const scan = $('scan');
scan.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  scan.setPointerCapture(event.pointerId);
  startScan();
});
scan.addEventListener('pointerup', cancelScan);
scan.addEventListener('pointercancel', cancelScan);
scan.addEventListener('lostpointercapture', cancelScan);
scan.addEventListener('contextmenu', e => e.preventDefault());
scan.addEventListener('click', e => { if (e.detail === 0) startScan(true); });
$('scan-alt').addEventListener('click', () => startScan(true));
async function runProfile(token) {
  $('profile-next').disabled = true;
  $('profile-status').textContent = 'Analiza w toku';
  $('match-score').textContent = '0%';
  $('profile-meter').style.width = '0%';
  profileItems.forEach(item => item.classList.remove('found'));
  for (const [i, item] of profileItems.entries()) {
    await pause(650);
    if (token !== generation) return;
    item.classList.add('found');
    const percent = (i + 1) * 25;
    $('match-score').textContent = `${percent}%`;
    $('profile-meter').style.width = `${percent}%`;
  }
  $('profile-status').textContent = 'Profil potwierdzony';
  $('profile-next').disabled = false;
}
$('profile-next').addEventListener('click', () => showStage(2));
const searchLines = [
  'Analiza zainteresowań: taniec i muzyka…',
  'Uwzględnianie poziomu uzależnienia od kawy…',
  'Odrzucanie opcji: skarpetki, odkurzacz…',
  'Sprawdzanie poziomu potencjalnej ekscytacji…',
  'Znaleziono idealny prezent!'
];
async function runSearch(token) {
  $('search-log').replaceChildren();
  $('search-score').textContent = '0%';
  $('search-meter').style.width = '0%';
  $('search-core').textContent = '✳';
  $('search-status').textContent = 'Szukam…';
  $('reveal-next').disabled = true;
  for (const [i, line] of searchLines.entries()) {
    await pause(i === 4 ? 1000 : 650);
    if (token !== generation) return;
    const p = document.createElement('p'); p.textContent = line; $('search-log').append(p);
    const percent = (i + 1) * 20;
    $('search-score').textContent = `${percent}%`;
    $('search-meter').style.width = `${percent}%`;
  }
  $('search-core').textContent = '✓';
  $('search-status').textContent = 'Dopasowano';
  $('reveal-next').disabled = false;
}
$('reveal-next').addEventListener('click', () => showStage(3));
$('plan-next').addEventListener('click', () => showStage(4));
$('celebrate').addEventListener('click', () => { $('celebrate').hidden = true; $('final-message').hidden = false; confetti(110); });
$('restart').addEventListener('click', () => {
  cancelAnimationFrame(scanFrame); scanning = false; autoScan = false;
  $('scan').classList.remove('scanning'); $('scan').disabled = false; $('scan-alt').disabled = false;
  updateScan(0); $('scan-instruction').textContent = 'Przyłóż palec i przytrzymaj przez 2 sekundy';
  $('final-message').hidden = true; $('celebrate').hidden = false; clearConfetti(); showStage(0);
});
const canvas = $('confetti');
const ctx = canvas.getContext('2d');
let confettiFrame = 0;
function clearConfetti() { cancelAnimationFrame(confettiFrame); if (ctx) ctx.clearRect(0,0,canvas.width,canvas.height); }
function confetti(count) {
  if (!ctx || reducedMotion.matches) return;
  clearConfetti();
  const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(w*dpr); canvas.height = Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
  const colors = ['#ffcf85','#efb0cb','#b7a0ea','#fff4da','#ec8b70'];
  const pieces = Array.from({length:count}, () => ({x:w*(.3+Math.random()*.4),y:h*.36,vx:(Math.random()-.5)*13,vy:-4-Math.random()*13,angle:Math.random()*6.28,spin:(Math.random()-.5)*.24,size:4+Math.random()*7,color:colors[Math.floor(Math.random()*colors.length)]}));
  let last = performance.now(), elapsed = 0;
  function draw(now) {
    const dt = Math.min((now-last)/16.67,3); last = now; elapsed += dt;
    ctx.clearRect(0,0,w,h);
    for (const p of pieces) {p.vy += .22*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=Math.max(0,Math.min(1,(180-elapsed)/35));ctx.fillStyle=p.color;ctx.fillRect(-p.size/2,-p.size/3,p.size,p.size*.65);ctx.restore();}
    if (elapsed<180) confettiFrame=requestAnimationFrame(draw); else ctx.clearRect(0,0,w,h);
  }
  confettiFrame=requestAnimationFrame(draw);
}
showStage(0,false);
