/**
 * TASUKE'26 — MAIN.JS
 * All interactive logic: cursor, canvas, charts, scroll animations,
 * camera feeds, 3D camera renderer, notifications, incidents
 */

/* ═══════════════════════════════════════
   1. CURSOR
═══════════════════════════════════════ */
(function initCursor() {
  const c = document.getElementById('cursor');
  const t = document.getElementById('cursor-trail');
  if (!c) return;
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    c.style.left = mx + 'px';
    c.style.top  = my + 'px';
    setTimeout(() => {
      if (t) { t.style.left = mx + 'px'; t.style.top = my + 'px'; }
    }, 80);
  });
  document.addEventListener('mousedown', () => {
    c.style.width = '6px'; c.style.height = '6px';
  });
  document.addEventListener('mouseup', () => {
    c.style.width = '12px'; c.style.height = '12px';
  });
  document.querySelectorAll('a, button, .ds-item, .cam-cell').forEach(el => {
    el.addEventListener('mouseenter', () => { c.style.width='20px'; c.style.height='20px'; c.style.opacity='.5'; });
    el.addEventListener('mouseleave', () => { c.style.width='12px'; c.style.height='12px'; c.style.opacity='1'; });
  });
})();

/* ═══════════════════════════════════════
   2. LOADER
═══════════════════════════════════════ */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('done');
    startEntrance();
  }, 2000);
});

/* ═══════════════════════════════════════
   3. NAVBAR SCROLL
═══════════════════════════════════════ */
(function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
  // Burger menu
  const burger = document.getElementById('nav-burger');
  const menu   = document.getElementById('mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', () => menu.classList.toggle('open'));
  }
})();

/* ═══════════════════════════════════════
   4. HERO CANVAS — Particle / neural grid
═══════════════════════════════════════ */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], raf;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Particles
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * 1920, y: Math.random() * 1080,
      vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
      r: Math.random() * 1.2 + .4,
      op: Math.random() * .5 + .1
    });
  }

  function draw(ts) {
    raf = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);

    // BG gradient
    const g = ctx.createRadialGradient(W*.7, H*.3, 0, W*.7, H*.3, W*.8);
    g.addColorStop(0, 'rgba(56,189,248,0.05)');
    g.addColorStop(1, 'rgba(2,4,8,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Scan line
    const sy = (ts * .06) % (H + 100);
    const sg = ctx.createLinearGradient(0, sy - 40, 0, sy + 40);
    sg.addColorStop(0,   'rgba(56,189,248,0)');
    sg.addColorStop(.5,  'rgba(56,189,248,0.03)');
    sg.addColorStop(1,   'rgba(56,189,248,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, sy - 40, W, 80);

    // Particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 140) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(56,189,248,${.05 * (1 - d/140)})`;
          ctx.lineWidth = .5; ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(56,189,248,${p.op})`;
      ctx.fill();
    }
  }
  requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════
   5. AUTH PAGE CANVAS
═══════════════════════════════════════ */
function initAuthCanvas() {
  const canvas = document.getElementById('auth-canvas');
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  // Grid
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(56,189,248,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
    // Glow orb
    const g = ctx.createRadialGradient(canvas.width*.7, canvas.height*.3, 0, canvas.width*.7, canvas.height*.3, 400);
    g.addColorStop(0, 'rgba(56,189,248,0.08)');
    g.addColorStop(1, 'rgba(2,4,8,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  drawGrid();
}

/* ═══════════════════════════════════════
   6. HERO FEED CANVAS (camera preview)
═══════════════════════════════════════ */
function initFeedCanvas() {
  const canvas = document.getElementById('feed-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 640; canvas.height = 360;

  let frame = 0;
  const persons = [
    { x: 120, y: 80, vx: .3, vy: 0, w: 40, h: 80, label: 'PERSON', conf: 98.2, threat: false },
    { x: 370, y: 100, vx: -.2, vy: .1, w: 32, h: 70, label: 'THREAT', conf: 94.1, threat: true },
  ];

  function drawFeed() {
    requestAnimationFrame(drawFeed);
    frame++;

    // Fake camera background
    ctx.fillStyle = '#090e16';
    ctx.fillRect(0, 0, 640, 360);

    // Grid floor perspective
    ctx.strokeStyle = 'rgba(56,189,248,0.06)';
    ctx.lineWidth = .5;
    for (let i = 0; i < 20; i++) {
      const x = i * 34;
      ctx.beginPath(); ctx.moveTo(x, 360); ctx.lineTo(320, 180); ctx.stroke();
    }
    for (let j = 1; j < 8; j++) {
      const y = 180 + j * 26;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();
    }

    // Timestamp
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillStyle = 'rgba(56,189,248,0.7)';
    const now = new Date();
    ctx.fillText(now.toTimeString().slice(0,8) + ' · REC', 10, 20);

    // Persons with bounding boxes
    persons.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 10 || p.x > 580) p.vx *= -1;
      if (p.y < 60 || p.y > 260) p.vy *= -1;

      // Body silhouette
      ctx.fillStyle = p.threat ? 'rgba(100,20,30,0.4)' : 'rgba(20,40,80,0.4)';
      ctx.fillRect(p.x, p.y, p.w, p.h);

      // BBox
      const color = p.threat ? '#F43F5E' : '#38BDF8';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      if (p.threat) {
        ctx.shadowColor = '#F43F5E';
        ctx.shadowBlur = Math.sin(frame*.08)*6+6;
      } else {
        ctx.shadowBlur = 4; ctx.shadowColor = '#38BDF8';
      }
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.shadowBlur = 0;

      // Corners
      const cs = 8;
      [
        [p.x, p.y, 1, 1], [p.x+p.w, p.y, -1, 1],
        [p.x, p.y+p.h, 1, -1], [p.x+p.w, p.y+p.h, -1, -1]
      ].forEach(([cx, cy, sx, sy]) => {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+cs*sx, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy+cs*sy); ctx.stroke();
      });

      // Label
      ctx.fillStyle = color;
      ctx.fillRect(p.x, p.y - 18, p.label.length * 6.5 + 40, 16);
      ctx.fillStyle = '#020408';
      ctx.font = '9px "JetBrains Mono"';
      ctx.fillText(`${p.label} · ${p.conf}%`, p.x + 3, p.y - 6);
    });

    // Scan overlay
    ctx.fillStyle = `rgba(56,189,248,${.015 + Math.sin(frame*.05)*.005})`;
    ctx.fillRect(0, 0, 640, 360);
  }
  drawFeed();
}

/* ═══════════════════════════════════════
   7. 3D CAMERA WIREFRAME (Three.js)
═══════════════════════════════════════ */
function initCameraWireframe() {
  const canvas = document.getElementById('camera-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, .1, 100);
  cam.position.set(4, 2, 6);
  cam.lookAt(0, 0, 0);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const mw = new THREE.MeshBasicMaterial({ color: 0x38BDF8, wireframe: true, transparent: true, opacity: .5 });
  const mb = new THREE.MeshBasicMaterial({ color: 0x7DD3FC, wireframe: true, transparent: true, opacity: .75 });

  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(2.4, 1, 1), mw));

  const lens = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, 1.2, 16), mb);
  lens.rotation.z = Math.PI / 2; lens.position.set(1.8, 0, 0);
  group.add(lens);

  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(.38, 32),
    new THREE.MeshBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: .25, side: THREE.DoubleSide })
  );
  glass.rotation.y = Math.PI / 2; glass.position.set(2.42, 0, 0);
  group.add(glass);

  const arm  = new THREE.Mesh(new THREE.BoxGeometry(.18, 1.4, .18), mw);
  arm.position.set(-.5, -1, 0);
  group.add(arm);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .1, 16), mw);
  base.position.set(-.5, -1.75, 0);
  group.add(base);

  // IR dots
  const irG = new THREE.SphereGeometry(.05, 6, 4);
  const irM = new THREE.MeshBasicMaterial({ color: 0xF43F5E });
  [[1.15,.25,.38],[1.15,-.25,.38],[1.15,.25,-.38],[1.15,-.25,-.38]].forEach(p => {
    const ir = new THREE.Mesh(irG, irM); ir.position.set(...p); group.add(ir);
  });

  scene.add(group);
  scene.add(new THREE.GridHelper(10, 20, 0x38BDF8, 0x0a0f1a));

  // Particles
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(120 * 3);
  for (let i = 0; i < 120*3; i++) pPos[i] = (Math.random()-.5)*14;
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x38BDF8, size: .04, transparent: true, opacity: .4 })));

  let scrollRot = 0;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) animate(); else cancelAnimationFrame(rafId); });
  }, { threshold: .1 });
  obs.observe(canvas.closest('section'));

  let rafId;
  function animate(ts = 0) {
    rafId = requestAnimationFrame(animate);
    group.position.y = Math.sin(ts * .0007) * .12;
    scene.children.forEach(c => { if (c.isPoints) c.rotation.y += .0008; });
    renderer.render(scene, cam);
  }

  // Scroll-based rotation
  window.addEventListener('scroll', () => {
    const sec = canvas.closest('section');
    if (!sec) return;
    const rect = sec.getBoundingClientRect();
    const prog = 1 - (rect.top + rect.height) / (window.innerHeight + rect.height);
    group.rotation.y = (prog - .5) * 1.2;
    group.rotation.x = (prog - .5) * -.3;
  });
}

/* ═══════════════════════════════════════
   8. SCROLL ANIMATIONS
═══════════════════════════════════════ */
function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .15 });

  document.querySelectorAll('.feat-card, .module-card').forEach((el, i) => {
    el.style.transitionDelay = (i % 3) * .1 + 's';
    obs.observe(el);
  });
}

/* ═══════════════════════════════════════
   9. HERO COUNTER ANIMATION
═══════════════════════════════════════ */
function animateCounters() {
  document.querySelectorAll('.h-num, .sc-val').forEach(el => {
    const target = parseFloat(el.dataset.target || el.dataset.val || el.textContent);
    if (isNaN(target)) return;
    const isDecimal = target % 1 !== 0;
    const duration = 2000;
    const start = performance.now();
    function tick(now) {
      const prog = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - prog, 3);
      const val = target * ease;
      el.textContent = isDecimal ? val.toFixed(2) : Math.floor(val).toLocaleString();
      if (prog < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ═══════════════════════════════════════
   10. ENTRANCE ANIMATION
═══════════════════════════════════════ */
function startEntrance() {
  const hero = document.querySelector('.hero-content');
  if (!hero) return;
  hero.style.opacity = '0';
  hero.style.transform = 'translateY(40px)';
  hero.style.transition = 'opacity .8s ease, transform .8s ease';
  setTimeout(() => {
    hero.style.opacity = '1';
    hero.style.transform = 'translateY(0)';
  }, 100);

  const vis = document.querySelector('.hero-visual');
  if (vis) {
    vis.style.opacity = '0';
    vis.style.transform = 'translateX(40px)';
    vis.style.transition = 'opacity .8s ease .3s, transform .8s ease .3s';
    setTimeout(() => {
      vis.style.opacity = '1';
      vis.style.transform = 'translateX(0)';
    }, 100);
  }
  animateCounters();
}

/* ═══════════════════════════════════════
   11. MAGNETIC BUTTONS
═══════════════════════════════════════ */
function initMagneticButtons() {
  document.querySelectorAll('.mag-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width/2) * .25;
      const y = (e.clientY - r.top  - r.height/2) * .25;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ═══════════════════════════════════════
   12. DASHBOARD CHARTS (Canvas-based)
═══════════════════════════════════════ */
function initDashboardCharts() {
  drawThreatChart();
  drawPieChart();
  populateIncidents();
  populateNotifications();
  animateDashCounters();
}

function drawThreatChart() {
  const canvas = document.getElementById('threat-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth; canvas.width = W;
  const H = 180; canvas.height = H;
  const data  = [12,8,22,15,34,28,45,38,52,41,30,25,18,35,48,42,60,55,44,38,50,45,62,58];
  const data2 = [10,7,20,13,31,25,42,36,49,39,28,23,16,33,45,39,57,52,41,35,47,42,59,55];
  const max = Math.max(...data);
  const pad = { t:20, r:20, b:30, l:40 };
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;
  const step = cW / (data.length - 1);

  function pts(d) { return d.map((v,i) => [pad.l + i*step, pad.t + cH - (v/max)*cH]); }

  function drawLine(points, color) {
    ctx.beginPath();
    points.forEach(([x,y],i) => i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y));
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t+cH);
    grad.addColorStop(0, color.replace(')', ', 0.15)').replace('rgb', 'rgba'));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.lineTo(points[points.length-1][0], pad.t+cH);
    ctx.lineTo(points[0][0], pad.t+cH);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
  }

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
  for (let i=0; i<5; i++) {
    const y = pad.t + (cH/4)*i;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W-pad.r, y); ctx.stroke();
  }
  // Axes labels
  ctx.font = '9px "JetBrains Mono"'; ctx.fillStyle = '#475569'; ctx.textAlign = 'right';
  [0,.25,.5,.75,1].forEach((v,i) => {
    ctx.fillText(Math.round(max*(1-v)), pad.l-6, pad.t + (cH/4)*i + 3);
  });
  ctx.textAlign = 'center';
  ['0h','6h','12h','18h','24h'].forEach((l,i) => {
    ctx.fillText(l, pad.l + (cW/4)*i, H-8);
  });

  drawLine(pts(data),  '#38BDF8');
  drawLine(pts(data2), '#F43F5E');
}

function drawPieChart() {
  const canvas = document.getElementById('pie-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth; canvas.width = W;
  const H = 180; canvas.height = H;
  const slices = [
    { val: 45, color: '#38BDF8' },
    { val: 28, color: '#F43F5E' },
    { val: 18, color: '#F59E0B' },
    { val: 9,  color: '#10B981' },
  ];
  const total = slices.reduce((a,s) => a+s.val, 0);
  const cx = W/2, cy = H/2 - 10, r = 60;
  let angle = -Math.PI/2;
  slices.forEach(s => {
    const sweep = (s.val/total) * Math.PI*2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle+sweep);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.shadowColor = s.color; ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    angle += sweep;
  });
  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r*.55, 0, Math.PI*2);
  ctx.fillStyle = '#0d1829'; ctx.fill();
  // Center text
  ctx.fillStyle = '#38BDF8'; ctx.font = 'bold 14px Poppins'; ctx.textAlign = 'center';
  ctx.fillText('1,284', cx, cy+2);
  ctx.font = '9px "JetBrains Mono"'; ctx.fillStyle = '#475569';
  ctx.fillText('EVENTS', cx, cy+14);
}

function populateIncidents() {
  const incidents = [
    { sev: 'critical', type: 'critical', title: 'Perimeter Breach Detected', meta: 'Zone C · CAM-03', cam: 'CAM-03', time: '14:32:01' },
    { sev: 'warning',  type: 'warning',  title: 'Unidentified Person Loitering', meta: 'Zone B · CAM-02', cam: 'CAM-02', time: '13:18:44' },
    { sev: 'warning',  type: 'warning',  title: 'Tailgating Attempt Blocked', meta: 'Zone A · CAM-01', cam: 'CAM-01', time: '11:05:22' },
    { sev: 'info',     type: 'info',     title: 'New Edge Node Connected', meta: 'NODE-001 · 192.168.1.50', cam: 'SYSTEM', time: '09:44:10' },
    { sev: 'info',     type: 'info',     title: 'AI Model Updated', meta: 'T26-NPU Firmware 2.6.1', cam: 'SYSTEM', time: '08:00:00' },
  ];

  function renderIncident(inc) {
    return `<div class="inc-row" data-type="${inc.type}">
      <div class="inc-sev sev-${inc.sev}"></div>
      <div class="inc-content">
        <div class="inc-title">${inc.title}</div>
        <div class="inc-meta">${inc.meta}</div>
      </div>
      <div class="inc-cam">${inc.cam}</div>
      <div class="inc-time mono">${inc.time}</div>
      <div class="inc-action"><button class="btn-ghost-sm">Review</button></div>
    </div>`;
  }

  const list = document.getElementById('incidents-list');
  if (list) list.innerHTML = incidents.slice(0,4).map(renderIncident).join('');

  const full = document.getElementById('inc-full-list');
  if (full) full.innerHTML = incidents.map(renderIncident).join('');
}

function populateNotifications() {
  const notifs = [
    { color: '#F43F5E', title: '⚠ Perimeter Alert — Zone C', time: '14:32' },
    { color: '#F59E0B', title: 'NODE-002 went offline', time: '12:15' },
    { color: '#38BDF8', title: 'AI model update available', time: '08:00' },
  ];
  const list = document.getElementById('np-list');
  if (!list) return;
  list.innerHTML = notifs.map(n => `
    <div class="np-item">
      <div class="np-dot" style="background:${n.color}"></div>
      <div class="np-content">
        <div class="np-title">${n.title}</div>
        <div class="np-time mono">${n.time}</div>
      </div>
    </div>`).join('');
}

function animateDashCounters() {
  document.querySelectorAll('.sc-val').forEach(el => {
    const target = parseFloat(el.dataset.target);
    if (isNaN(target)) return;
    const isDecimal = target % 1 !== 0;
    const dur = 1500;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now-start)/dur, 1);
      const e = 1 - Math.pow(1-p, 3);
      el.textContent = isDecimal ? (target*e).toFixed(2) : Math.floor(target*e).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ═══════════════════════════════════════
   13. CAMERA FEEDS (Dashboard)
═══════════════════════════════════════ */
function initCameraFeeds() {
  const cells = document.querySelectorAll('.cam-cell');
  cells.forEach((cell, idx) => {
    const canvas = cell.querySelector('.cam-canvas');
    if (!canvas || canvas.tagName !== 'CANVAS' || canvas.dataset.init) return;
    canvas.dataset.init = '1';
    canvas.width = 640; canvas.height = 360;
    const ctx = canvas.getContext('2d');
    const isAlert = cell.classList.contains('alert-cam');

    const bboxes = isAlert
      ? [{ x:200, y:100, w:80, h:160, vx:.4, vy:.1, label:'⚠ INTRUDER', conf:96.3, threat:true }]
      : [{ x:100+idx*30, y:80, w:50, h:100, vx:.3*(idx%2?1:-1), vy:.1, label:'PERSON', conf:91+idx*2, threat:false }];

    let frame = 0;
    function render() {
      requestAnimationFrame(render);
      frame++;
      ctx.fillStyle = isAlert ? '#0f0508' : '#080d16';
      ctx.fillRect(0,0,640,360);

      // Grid
      ctx.strokeStyle = isAlert ? 'rgba(244,63,94,0.06)' : 'rgba(56,189,248,0.05)';
      ctx.lineWidth = .5;
      for(let x=0;x<640;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(320,180);ctx.stroke();}
      for(let y=180;y<360;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(640,y);ctx.stroke();}

      // Timestamp
      ctx.fillStyle = isAlert ? 'rgba(244,63,94,0.8)' : 'rgba(56,189,248,0.6)';
      ctx.font = '10px "JetBrains Mono"';
      const t = new Date().toTimeString().slice(0,8);
      ctx.fillText(t + ` · CAM-0${idx+1}`, 10, 18);

      bboxes.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if(p.x<0||p.x>580) p.vx*=-1;
        if(p.y<60||p.y>260) p.vy*=-1;
        const c = p.threat ? '#F43F5E' : '#38BDF8';
        ctx.strokeStyle = c; ctx.lineWidth = 1.5;
        ctx.shadowColor = c; ctx.shadowBlur = p.threat ? Math.sin(frame*.1)*6+6 : 4;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        ctx.shadowBlur = 0;
        ctx.fillStyle = c;
        ctx.fillRect(p.x, p.y-18, p.label.length*6.5+40, 16);
        ctx.fillStyle = '#020408'; ctx.font = '9px "JetBrains Mono"';
        ctx.fillText(`${p.label} · ${p.conf}%`, p.x+3, p.y-6);
      });

      // Scan
      ctx.fillStyle = `rgba(${isAlert?'244,63,94':'56,189,248'},${.01+Math.sin(frame*.04)*.005})`;
      ctx.fillRect(0,0,640,360);
    }
    render();
  });
}

/* ═══════════════════════════════════════
   14. ANALYTICS CHARTS
═══════════════════════════════════════ */
function initAnalyticsCharts() {
  // Accuracy line chart
  const accCanvas = document.getElementById('acc-chart');
  if (accCanvas && !accCanvas.dataset.init) {
    accCanvas.dataset.init = '1';
    const ctx = accCanvas.getContext('2d');
    const W = accCanvas.offsetWidth; accCanvas.width = W;
    accCanvas.height = 200;
    const data = Array.from({length:30}, (_,i) => 99.2 + Math.sin(i*.4)*.6 + Math.random()*.3);
    const max=Math.max(...data), min=Math.min(...data);
    ctx.strokeStyle='rgba(56,189,248,0.08)'; ctx.lineWidth=1;
    for(let i=0;i<5;i++){const y=200-i*40; ctx.beginPath();ctx.moveTo(40,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle='#38BDF8'; ctx.lineWidth=2;
    const sx=(W-60)/(data.length-1);
    ctx.beginPath();
    data.forEach((v,i)=>{
      const x=40+i*sx, y=200-((v-min)/(max-min))*160-20;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    });
    ctx.stroke();
  }

  // Heat chart
  const heatCanvas = document.getElementById('heat-chart');
  if (heatCanvas && !heatCanvas.dataset.init) {
    heatCanvas.dataset.init = '1';
    const ctx = heatCanvas.getContext('2d');
    const W = heatCanvas.offsetWidth; heatCanvas.width = W;
    heatCanvas.height = 200;
    const zones=['Zone A','Zone B','Zone C','Zone D'];
    const vals=[30,75,95,20];
    zones.forEach((z,i)=>{
      const bw=W/zones.length-12, x=6+i*(bw+12), h=vals[i]*1.6;
      const g=ctx.createLinearGradient(0,200-h,0,200);
      g.addColorStop(0, vals[i]>70?'#F43F5E':vals[i]>50?'#F59E0B':'#38BDF8');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle=g;
      ctx.fillRect(x,200-h,bw,h);
      ctx.fillStyle='#475569'; ctx.font='10px "JetBrains Mono"'; ctx.textAlign='center';
      ctx.fillText(z,x+bw/2,196);
      ctx.fillStyle=vals[i]>70?'#F43F5E':vals[i]>50?'#F59E0B':'#38BDF8';
      ctx.fillText(vals[i]+'%',x+bw/2,200-h-6);
    });
  }

  // Weekly bar
  const wCanvas = document.getElementById('weekly-chart');
  if (wCanvas && !wCanvas.dataset.init) {
    wCanvas.dataset.init = '1';
    const ctx = wCanvas.getContext('2d');
    const W = wCanvas.offsetWidth; wCanvas.width = W;
    wCanvas.height = 180;
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const dvals=[42,38,65,55,80,35,28];
    const bw=(W-60)/days.length-8;
    days.forEach((d,i)=>{
      const x=30+i*(bw+8), h=dvals[i]*1.5, y=180-h-20;
      const g=ctx.createLinearGradient(0,y,0,160);
      g.addColorStop(0,'#38BDF8'); g.addColorStop(1,'rgba(56,189,248,0.1)');
      ctx.fillStyle=g;
      ctx.beginPath();
      ctx.roundRect(x,y,bw,h,3);
      ctx.fill();
      ctx.fillStyle='#475569'; ctx.font='9px "JetBrains Mono"'; ctx.textAlign='center';
      ctx.fillText(d,x+bw/2,178);
      ctx.fillStyle='#94A3B8'; ctx.fillText(dvals[i],x+bw/2,y-4);
    });
  }
}

/* ═══════════════════════════════════════
   15. PERIMETER MODULE FEED
═══════════════════════════════════════ */
function initPerimeterFeed() {
  const canvas = document.getElementById('perimeter-canvas');
  if (!canvas || canvas.dataset.init) return;
  canvas.dataset.init = '1';
  canvas.width = 640; canvas.height = 340;
  const ctx = canvas.getContext('2d');

  const zones = [
    { label:'Zone A', x:40, y:30, w:240, h:140, color:'#10B981', status:'Clear' },
    { label:'Zone B', x:300, y:30, w:240, h:140, color:'#10B981', status:'Clear' },
    { label:'Zone C — ALERT', x:40, y:185, w:240, h:130, color:'#F43F5E', status:'⚠ Motion' },
    { label:'Zone D', x:300, y:185, w:240, h:130, color:'#38BDF8', status:'Clear' },
  ];
  const intruder = { x:100, y:240, vx:.6, vy:.2, trail:[] };

  let frame = 0;
  function render() {
    requestAnimationFrame(render);
    frame++;
    ctx.fillStyle='#060d16'; ctx.fillRect(0,0,640,340);

    // Grid
    ctx.strokeStyle='rgba(56,189,248,0.04)'; ctx.lineWidth=.5;
    for(let x=0;x<640;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,340);ctx.stroke();}
    for(let y=0;y<340;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(640,y);ctx.stroke();}

    // Zones
    zones.forEach(z => {
      ctx.fillStyle = z.color==='#F43F5E'
        ? `rgba(244,63,94,${.04+Math.sin(frame*.08)*.02})`
        : `rgba(${z.color==='#10B981'?'16,185,129':'56,189,248'},0.04)`;
      ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = z.color + (z.color==='#F43F5E'?'':'80');
      ctx.lineWidth = z.color==='#F43F5E' ? 1.5 : 1;
      if(z.color==='#F43F5E') { ctx.shadowColor='#F43F5E'; ctx.shadowBlur=8; }
      ctx.strokeRect(z.x, z.y, z.w, z.h);
      ctx.shadowBlur=0;
      ctx.fillStyle = z.color; ctx.font='bold 11px Poppins'; ctx.textAlign='left';
      ctx.fillText(z.label, z.x+8, z.y+18);
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px "JetBrains Mono"';
      ctx.fillText(z.status, z.x+8, z.y+32);
    });

    // Intruder dot in zone C
    intruder.x += intruder.vx; intruder.y += intruder.vy;
    if(intruder.x<50||intruder.x>270){ intruder.vx*=-1; }
    if(intruder.y<195||intruder.y>305){ intruder.vy*=-1; }
    intruder.trail.push({x:intruder.x, y:intruder.y});
    if(intruder.trail.length>20) intruder.trail.shift();

    // Trail
    intruder.trail.forEach((p,i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
      ctx.fillStyle = `rgba(244,63,94,${i/20*.5})`; ctx.fill();
    });

    // Intruder
    ctx.beginPath(); ctx.arc(intruder.x, intruder.y, 8, 0, Math.PI*2);
    ctx.fillStyle='rgba(244,63,94,0.2)'; ctx.fill();
    ctx.beginPath(); ctx.arc(intruder.x, intruder.y, 4, 0, Math.PI*2);
    ctx.fillStyle='#F43F5E'; ctx.shadowColor='#F43F5E'; ctx.shadowBlur=12; ctx.fill();
    ctx.shadowBlur=0;

    // Alert ring
    const ringR = (frame%40)*(6);
    ctx.beginPath(); ctx.arc(intruder.x, intruder.y, ringR, 0, Math.PI*2);
    ctx.strokeStyle=`rgba(244,63,94,${1-(frame%40)/40})`; ctx.lineWidth=1; ctx.stroke();
  }
  render();
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initHeroCanvas();
  initAuthCanvas();
  initFeedCanvas();
  initScrollAnimations();
  initMagneticButtons();
  initCameraWireframe();
  initDashboardCharts();

  // Pricing card 3D tilt
  document.querySelectorAll('.pricing-card, .module-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX-r.left)/r.width  - .5;
      const y = (e.clientY-r.top) /r.height - .5;
      card.style.transform = `perspective(800px) rotateX(${-y*8}deg) rotateY(${x*8}deg) translateY(-6px)`;
      card.style.transition = 'transform .1s linear, box-shadow .3s';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1), box-shadow .3s';
    });
  });

  // Auto-animate dashboard counters on page load
  setTimeout(animateDashCounters, 500);

  if (document.body.classList.contains('dashboard-page')) {
    initBackendIntegration();
  }
  
  initGlobalNav();
});

function initGlobalNav() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");
  
  if (token && username) {
    // Top right navigation replacement (index.html)
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      navActions.innerHTML = `
        <span style="color:#94a3b8; font-size:14px; font-weight:600; font-family:'JetBrains Mono', monospace; margin-right: 15px;">👤 ${username.toUpperCase()}</span>
        <a href="dashboard.html" class="btn-primary-sm" style="text-decoration:none">Dashboard →</a>
      `;
    }
    
    // Mobile navigation updates
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      const loginLinks = mobileMenu.querySelectorAll('a[href="login.html"]');
      loginLinks.forEach(link => {
        link.href = "dashboard.html";
        if (link.classList.contains('btn-primary-sm')) {
          link.textContent = "Go to Dashboard →";
        } else {
          link.textContent = "Dashboard";
        }
      });
    }
    
    // Redirect if on auth page
    if (document.body.classList.contains('auth-page')) {
        // Only redirect if we are manually loading the page, but let login finish naturally too.
        // login.js already handles redirect. This just catches direct visits to login.html
        window.location.replace("dashboard.html");
    }
  }
}


/* ═══════════════════════════════════════
   17. BACKEND INTEGRATION (SOCKET.IO)
═══════════════════════════════════════ */
function initBackendIntegration() {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Display username
  const userDisp = document.querySelector(".ds-username");
  if (userDisp) userDisp.textContent = username || "Unknown";

  // Logout
  const logoutBtn = document.querySelector(".ds-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "login.html";
    });
  }

  if (typeof io === 'undefined') return;

  const socket = io({ auth: { token } });

  socket.on("connect_error", (err) => {
    if (err.message.includes("Authentication error")) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  });

  const videoStream = document.getElementById("video-stream");
  const videoOverlay = document.getElementById("video-overlay");
  const videoOverlayText = document.getElementById("video-overlay-text");
  const alertsList = document.getElementById("incidents-list");
  const fullList = document.getElementById("inc-full-list");

  let isCameraActive = false;

  // Receive video frames via Socket.io
  socket.on("video-frame", (frameData) => {
    if (!isCameraActive) return;

    if (videoOverlay && videoOverlay.style.display !== "none") {
      videoOverlay.style.display = "none";
    }
    if (videoStream) {
      videoStream.style.display = "block";
      videoStream.src = "data:image/jpeg;base64," + frameData;
    }
  });

  socket.on("new-alert", (alertData) => {
    const label = alertData.label || "SECURITY BREACH";
    const confidence = alertData.confidence ? `${(alertData.confidence * 100).toFixed(1)}%` : "N/A";
    const time = new Date().toLocaleTimeString('en-US',{hour12:false}).slice(0,8);

    const incHtml = `
    <div class="inc-row" data-type="critical">
      <div class="inc-sev sev-critical"></div>
      <div class="inc-content">
        <div class="inc-title">${label}</div>
        <div class="inc-meta">Zone A · CONF: ${confidence}</div>
      </div>
      <div class="inc-cam">CAM-01</div>
      <div class="inc-time mono">${time}</div>
      <div class="inc-action"><button class="btn-ghost-sm">Review</button></div>
    </div>`;

    if (alertsList) {
      alertsList.insertAdjacentHTML('afterbegin', incHtml);
      if (alertsList.children.length > 5) alertsList.lastElementChild.remove();
    }
    if (fullList) {
      fullList.insertAdjacentHTML('afterbegin', incHtml);
    }
    
    // Also add to notifications
    const npList = document.getElementById('np-list');
    if (npList) {
      const notifHtml = `
      <div class="np-item">
        <div class="np-dot" style="background:#F43F5E"></div>
        <div class="np-content">
          <div class="np-title">⚠ ${label} DETECTED</div>
          <div class="np-time mono">${time}</div>
        </div>
      </div>`;
      npList.insertAdjacentHTML('afterbegin', notifHtml);
      const dot = document.querySelector('.notif-dot');
      if (dot) dot.style.display = 'block';
    }
  });

  socket.on("connect", () => {
    console.log("Connected to SafeSight VMS Controller");
    const node1Status = document.querySelector('.node-card.online .node-status');
    if (node1Status) {
      node1Status.textContent = '● SYSTEM UPLINK ONLINE';
      node1Status.style.color = 'var(--emerald)';
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from uplink");
    if (videoOverlay) {
      videoOverlay.style.display = "flex";
      if (videoOverlayText) videoOverlayText.textContent = "UPLINK SEVERED. RECONNECTING...";
    }
    const node1Status = document.querySelector('.node-card.online .node-status');
    if (node1Status) {
      node1Status.textContent = '● UPLINK OFFLINE';
      node1Status.style.color = 'var(--rose)';
    }
  });

  window.toggleAI = function() {
    socket.emit("toggle-camera", !isCameraActive);
  };

  socket.on("camera-status", (state) => {
    isCameraActive = state;
    const aiBtn = document.getElementById('ai-toggle');
    const startBtn = document.getElementById('start-uplink-btn');
    const stopBtn = document.getElementById('stop-uplink-btn');

    if (aiBtn) {
      aiBtn.innerHTML = `<span class="toggle-dot ${state?'':'off'}"></span> AI Overlay ${state?'ON':'OFF'}`;
      if (state) aiBtn.classList.add('active');
      else aiBtn.classList.remove('active');
    }
    
    if (stopBtn) stopBtn.style.display = state ? 'inline-block' : 'none';
    if (startBtn) startBtn.style.display = state ? 'none' : 'block';

    if (!state) {
      if (videoOverlay) {
        videoOverlay.style.display = "flex";
        if (videoOverlayText) videoOverlayText.textContent = "SYSTEM STANDBY - AWAITING UPLINK";
      }
      if (videoStream) {
        videoStream.style.display = "none";
        videoStream.removeAttribute("src");
      }
    } else {
      if (videoOverlay && (!videoStream.hasAttribute('src') || videoStream.getAttribute('src').includes('placeholder'))) {
        videoOverlay.style.display = "flex";
        if (videoOverlayText) videoOverlayText.textContent = "INITIALIZING AI ENGINE...";
      }
    }
  });
}
