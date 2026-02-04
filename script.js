const canvas = document.getElementById('solarCanvas');
const ctx = canvas.getContext('2d');
const dayCounterEl = document.getElementById('dayCounter');
const modal = document.getElementById('modal');
const bgMusic = document.getElementById('bgMusic');

let width, height, centerX, centerY;
let mouseX = 0, mouseY = 0, isPaused = false, globalSpeedMultiplier = 1;
let viewScale = 0.8, followedPlanet = null, totalEarthRotation = 0;

const planets = [
    { name: "Mercury", distance: 80, radius: 4, color: '#A5A5A5', speed: 0.03, angle: Math.random() * 6, fact: "The smallest planet. A year is only 88 days!" },
    { name: "Venus", distance: 130, radius: 7, color: '#E3BB76', speed: 0.015, angle: Math.random() * 6, fact: "The hottest planet. Its thick atmosphere traps heat." },
    { name: "Earth", distance: 190, radius: 8, color: '#2271B3', speed: 0.01, angle: Math.random() * 6, fact: "The only planet known to harbor life.", hasMoon: true },
    { name: "Mars", distance: 260, radius: 6, color: '#E27B58', speed: 0.008, angle: Math.random() * 6, fact: "Home to the largest canyons and volcanoes in the system." },
    { name: "Jupiter", distance: 410, radius: 22, color: '#D39C7E', speed: 0.004, angle: Math.random() * 6, fact: "A gas giant that acts as a gravity shield for Earth." },
    { name: "Saturn", distance: 540, radius: 18, color: '#F4D03F', speed: 0.003, angle: Math.random() * 6, fact: "Its iconic rings are made of ice and rock particles.", hasRings: true }
];

let stars = [], asteroids = [], moon = { distance: 16, radius: 2, color: '#DDD', speed: 0.04, angle: 0 };
let comet = { x: -500, y: -500, vx: 0, vy: 0, active: false };

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2; centerY = height / 2;
    stars = Array.from({ length: 800 }, () => ({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 1.2, opacity: Math.random() }));
    asteroids = Array.from({ length: 500 }, () => ({
        dist: 300 + Math.random() * 70,
        angle: Math.random() * Math.PI * 2,
        size: Math.random() * 1.5,
        speed: (0.003 + Math.random() * 0.002)
    }));
}

// Start Interaction
document.getElementById('startBtn').onclick = () => {
    document.getElementById('overlay').style.display = 'none';
    bgMusic.play();
    bgMusic.volume = 0.4;
};

// UI Handlers
window.closeModal = () => { modal.style.display = 'none'; isPaused = false; };
document.getElementById('shotBtn').onclick = () => { const a = document.createElement('a'); a.download = 'space_snap.png'; a.href = canvas.toDataURL(); a.click(); };
document.getElementById('pauseBtn').onclick = (e) => { isPaused = !isPaused; e.target.textContent = isPaused ? "Resume" : "Pause"; };
document.getElementById('resetBtn').onclick = () => { followedPlanet = null; viewScale = 0.8; };
document.getElementById('speedSlider').oninput = (e) => globalSpeedMultiplier = parseFloat(e.target.value);

// Viewport & Scaling
canvas.onwheel = (e) => { e.preventDefault(); viewScale = Math.min(Math.max(viewScale * (e.deltaY < 0 ? 1.1 : 0.9), 0.05), 10); };
canvas.onmousemove = (e) => { mouseX = e.clientX; mouseY = e.clientY; };
canvas.onclick = () => {
    const target = getPlanetAtMouse();
    if (target) followedPlanet === target ? (isPaused = true, document.getElementById('mName').innerText = target.name, document.getElementById('mFact').innerText = target.fact, modal.style.display = 'block') : followedPlanet = target;
};

function getPlanetAtMouse() {
    let offX = followedPlanet ? Math.cos(followedPlanet.angle) * followedPlanet.distance * viewScale : 0;
    let offY = followedPlanet ? Math.sin(followedPlanet.angle) * followedPlanet.distance * viewScale : 0;
    for (let p of planets) {
        const x = centerX + (Math.cos(p.angle) * p.distance * viewScale) - offX;
        const y = centerY + (Math.sin(p.angle) * p.distance * viewScale) - offY;
        if (Math.hypot(mouseX - x, mouseY - y) < (p.radius * viewScale) + 20) return p;
    }
    return null;
}

function draw() {
    ctx.fillStyle = '#020206'; ctx.fillRect(0, 0, width, height);
    stars.forEach(s => { ctx.fillStyle = `rgba(255,255,255,${s.opacity})`; ctx.fillRect(s.x, s.y, s.size, s.size); });

    let offX = followedPlanet ? Math.cos(followedPlanet.angle) * followedPlanet.distance * viewScale : 0;
    let offY = followedPlanet ? Math.sin(followedPlanet.angle) * followedPlanet.distance * viewScale : 0;
    const sX = centerX - offX, sY = centerY - offY;

    // Sun
    ctx.beginPath(); ctx.arc(sX, sY, 35 * viewScale, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700'; ctx.shadowBlur = 50 * viewScale; ctx.shadowColor = '#FFA500';
    ctx.fill(); ctx.shadowBlur = 0;

    // Asteroid Belt
    ctx.fillStyle = "#888";
    asteroids.forEach(a => {
        const ax = sX + Math.cos(a.angle) * a.dist * viewScale;
        const ay = sY + Math.sin(a.angle) * a.dist * viewScale;
        ctx.fillRect(ax, ay, a.size * viewScale, a.size * viewScale);
        if (!isPaused) a.angle += a.speed * globalSpeedMultiplier;
    });

    // Comet
    if (comet.active) {
        ctx.beginPath(); ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 2 * viewScale;
        ctx.moveTo(comet.x, comet.y); ctx.lineTo(comet.x - comet.vx * 8, comet.y - comet.vy * 8); ctx.stroke();
        if (!isPaused) { comet.x += comet.vx; comet.y += comet.vy; if (comet.x < -1000 || comet.x > width + 1000) comet.active = false; }
    } else if (Math.random() < 0.002 && !isPaused) {
        comet = { x: Math.random() * width, y: -100, vx: (Math.random() - 0.5) * 20, vy: 15, active: true };
    }

    let hovered = getPlanetAtMouse();
    planets.forEach(p => {
        const x = sX + Math.cos(p.angle) * p.distance * viewScale;
        const y = sY + Math.sin(p.angle) * p.distance * viewScale;

        if (p.hasRings) {
            ctx.beginPath(); ctx.ellipse(x, y, p.radius * 2.4 * viewScale, p.radius * 0.9 * viewScale, Math.PI / 8, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(194,178,128,0.4)"; ctx.lineWidth = 5 * viewScale; ctx.stroke();
        }

        ctx.beginPath(); ctx.arc(x, y, p.radius * viewScale, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();

        if (p.hasMoon) {
            const mx = x + Math.cos(moon.angle) * moon.distance * viewScale;
            const my = y + Math.sin(moon.angle) * moon.distance * viewScale;
            ctx.beginPath(); ctx.arc(mx, my, moon.radius * viewScale, 0, Math.PI * 2);
            ctx.fillStyle = "#AAA"; ctx.fill();
            if (!isPaused) moon.angle += moon.speed * globalSpeedMultiplier;
        }

        if (hovered === p || followedPlanet === p) {
            ctx.fillStyle = "white"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(p.name, x, y - (p.radius * viewScale + 30));
        }

        if (!isPaused) {
            const step = p.speed * globalSpeedMultiplier;
            p.angle += step;
            if (p.name === "Earth") {
                totalEarthRotation += step;
                dayCounterEl.innerText = Math.floor((totalEarthRotation / (Math.PI * 2)) * 365.25).toLocaleString();
            }
        }
    });

    canvas.style.cursor = hovered ? 'pointer' : 'default';
    requestAnimationFrame(draw);
}

window.onresize = init; init(); draw();