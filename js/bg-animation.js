// Animated background: floating colorful bubbles
const canvas = document.getElementById('bg-animation');
const ctx = canvas.getContext('2d');
let bubbles = [];

function randomColor() {
  const colors = ['#2563eb', '#1e40af', '#38bdf8', '#f472b6', '#facc15', '#4ade80'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createBubbles(count) {
  bubbles = [];
  for (let i = 0; i < count; i++) {
    bubbles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 15 + Math.random() * 25,
      dx: -0.5 + Math.random(),
      dy: -0.5 + Math.random(),
      color: randomColor(),
      alpha: 0.2 + Math.random() * 0.3
    });
  }
}

function drawBubbles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const b of bubbles) {
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.restore();
    b.x += b.dx;
    b.y += b.dy;
    if (b.x < -b.r) b.x = canvas.width + b.r;
    if (b.x > canvas.width + b.r) b.x = -b.r;
    if (b.y < -b.r) b.y = canvas.height + b.r;
    if (b.y > canvas.height + b.r) b.y = -b.r;
  }
}

function animate() {
  drawBubbles();
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  resizeCanvas();
  createBubbles(24);
});

resizeCanvas();
createBubbles(24);
animate();

// Place canvas behind everything
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '-1';
canvas.style.pointerEvents = 'none';
