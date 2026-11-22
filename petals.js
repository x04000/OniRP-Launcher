// Pétalos que caen sobre la portada: misma forma y tonos que src/particles.js del launcher.
(() => {
    const canvas = document.getElementById('petals');
    const toggle = document.getElementById('petalToggle');
    if (!canvas || !canvas.getContext) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const ctx = canvas.getContext('2d');
    const TONES = ['#5e0f17', '#741520', '#8a1a26', '#9c2230'];
    const LAYERS = [
        { size: [5, 7], speed: [10, 16], alpha: [0.25, 0.4], blur: 1.6, w: 0.45 },
        { size: [8, 11], speed: [16, 26], alpha: [0.45, 0.65], blur: 0.6, w: 0.4 },
        { size: [12, 16], speed: [26, 38], alpha: [0.6, 0.8], blur: 0, w: 0.15 },
    ];
    const rand = (a, b) => a + Math.random() * (b - a);

    const sprites = LAYERS.map((layer) => TONES.map((tone) => {
        const s = 32, c = document.createElement('canvas');
        c.width = c.height = s;
        const g = c.getContext('2d');
        g.filter = layer.blur ? `blur(${layer.blur}px)` : 'none';
        g.translate(s / 2, s / 2);
        g.beginPath();
        g.moveTo(0, 10);
        g.bezierCurveTo(-9, 4, -8, -8, -2.5, -10);
        g.lineTo(0, -7.5);
        g.lineTo(2.5, -10);
        g.bezierCurveTo(8, -8, 9, 4, 0, 10);
        g.closePath();
        const grad = g.createLinearGradient(0, 10, 0, -10);
        grad.addColorStop(0, tone);
        grad.addColorStop(1, '#b8303e');
        g.fillStyle = grad;
        g.fill();
        return c;
    }));

    let W = 0, H = 0, dpr = 1, petals = [];

    function pickLayer() {
        let r = Math.random();
        for (let i = 0; i < LAYERS.length; i++) { if ((r -= LAYERS[i].w) <= 0) return i; }
        return 0;
    }

    function spawn(anywhere) {
        const li = pickLayer(), L = LAYERS[li];
        return {
            li, tone: Math.floor(Math.random() * TONES.length),
            x: rand(0, W), y: anywhere ? rand(0, H) : rand(-40, -10),
            size: rand(L.size[0], L.size[1]), vy: rand(L.speed[0], L.speed[1]),
            alpha: rand(L.alpha[0], L.alpha[1]),
            sway: rand(12, 30), swaySpeed: rand(0.3, 0.8), phase: rand(0, Math.PI * 2),
            rot: rand(0, Math.PI * 2), vr: rand(-0.8, 0.8),
        };
    }

    function resize() {
        const r = canvas.getBoundingClientRect();
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = r.width; H = r.height;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.round(Math.min(56, Math.max(18, (W * H) / 26000)));
        petals = Array.from({ length: count }, () => spawn(true));
    }

    function draw(t) {
        ctx.clearRect(0, 0, W, H);
        for (const p of petals) {
            const x = p.x + Math.sin(t * p.swaySpeed + p.phase) * p.sway;
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.translate(x, p.y);
            ctx.rotate(p.rot);
            const s = p.size * 2;
            ctx.drawImage(sprites[p.li][p.tone], -s / 2, -s / 2, s, s);
            ctx.restore();
        }
    }

    let running = false, visible = true, paused = false, last = 0, raf = 0;

    function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        for (let i = 0; i < petals.length; i++) {
            const p = petals[i];
            p.y += p.vy * dt;
            p.rot += p.vr * dt;
            if (p.y > H + 30) petals[i] = spawn(false);
        }
        draw(now / 1000);
        raf = requestAnimationFrame(frame);
    }

    function update() {
        const should = visible && !paused && !reduced.matches && !document.hidden;
        if (should && !running) {
            running = true;
            last = performance.now();
            raf = requestAnimationFrame(frame);
        } else if (!should && running) {
            running = false;
            cancelAnimationFrame(raf);
        }
    }

    function applyReduced() {
        // Con movimiento reducido se pinta un único fotograma quieto y sobra el botón de pausa
        toggle.hidden = reduced.matches;
        if (reduced.matches) draw(0);
        update();
    }

    toggle.addEventListener('click', () => {
        paused = !paused;
        toggle.setAttribute('aria-pressed', String(paused));
        toggle.querySelector('.ptLabel').textContent = paused ? 'Reanudar pétalos' : 'Pausar pétalos';
        update();
    });

    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; update(); }).observe(canvas);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', applyReduced);
    window.addEventListener('resize', () => { resize(); if (!running) draw(0); });

    resize();
    applyReduced();
})();
