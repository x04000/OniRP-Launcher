(() => {
    const $ = (id) => document.getElementById(id);
    const REPO = 'x04000/OniRP-Launcher';

    // ───────── Última versión: enlace directo al .exe si GitHub responde ─────────
    // Sin respuesta, los botones siguen llevando a la página de versiones.
    const verEls = document.querySelectorAll('[data-version]');
    const setVer = (text, state) => verEls.forEach((el) => { el.textContent = text; el.dataset.state = state; });

    fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((rel) => {
            const tag = String(rel.tag_name || '').replace(/^v/i, '');
            setVer(tag ? `Versión ${tag}` : 'Última versión', 'ready');
            const exe = (rel.assets || []).find((a) => /\.exe$/i.test(a.name));
            if (exe && /^https:\/\/github\.com\//.test(exe.browser_download_url)) {
                document.querySelectorAll('[data-download]').forEach((a) => { a.href = exe.browser_download_url; });
            }
        })
        .catch(() => setVer('Versión más reciente en GitHub', 'error'));

    // ───────── Simulador de parámetros (mismo orden que buildArgs en src/index.js) ─────────
    const demo = {
        opt: $('dOpt'), cfg: $('dCfg'), threads: $('dThreads'), ram: $('dRam'),
        threadChips: $('dThreadChips'), ramChips: $('dRamChips'), out: $('cmdLine'),
    };
    let threads = 8;
    let ramMb = 4096;
    let lastArgs = [];

    function buildArgs() {
        const a = [];
        if (demo.opt.checked) a.push('-nop4', '-high', '-noprocessheap', '-noworkshop');
        if (demo.threads.checked) a.push(`-threads ${threads}`);
        if (demo.ram.checked) a.push(`-maxMem=${ramMb}`);
        if (demo.cfg.checked) a.push('+exec horizonlauncher.cfg');
        return a;
    }

    function render() {
        const args = buildArgs();
        const out = demo.out;
        out.textContent = '';

        const exe = document.createElement('span');
        exe.className = 'exe';
        exe.textContent = 'gmod.exe ';
        out.appendChild(exe);

        if (!args.length) {
            const none = document.createElement('span');
            none.className = 'none';
            none.textContent = '(sin parámetros extra) ';
            out.appendChild(none);
        }
        for (const arg of args) {
            const s = document.createElement('span');
            s.className = 'arg' + (lastArgs.includes(arg) ? '' : ' new');
            s.textContent = arg;
            out.append(s, ' ');
        }
        const connect = document.createElement('span');
        connect.className = 'ph';
        connect.textContent = '+connect <IP del servidor>';
        out.appendChild(connect);

        lastArgs = args;

        for (const c of demo.threadChips.querySelectorAll('.chip')) {
            c.disabled = !demo.threads.checked;
            c.setAttribute('aria-pressed', String(Number(c.dataset.v) === threads));
        }
        for (const c of demo.ramChips.querySelectorAll('.chip')) {
            c.disabled = !demo.ram.checked;
            c.setAttribute('aria-pressed', String(Number(c.dataset.v) === ramMb));
        }
    }

    [demo.opt, demo.cfg, demo.threads, demo.ram].forEach((el) => el.addEventListener('change', render));
    demo.threadChips.addEventListener('click', (e) => {
        const c = e.target.closest('.chip');
        if (!c || c.disabled) return;
        threads = Number(c.dataset.v);
        render();
    });
    demo.ramChips.addEventListener('click', (e) => {
        const c = e.target.closest('.chip');
        if (!c || c.disabled) return;
        ramMb = Number(c.dataset.v);
        render();
    });
    lastArgs = buildArgs();   // sin resaltado en la primera pintura
    render();

    // ───────── Galería ─────────
    const stageImg = $('stageImg');
    const stageCap = $('stageCap');
    const thumbs = document.querySelectorAll('.thumb');
    thumbs.forEach((t) => t.addEventListener('click', () => {
        thumbs.forEach((o) => o.setAttribute('aria-pressed', String(o === t)));
        stageImg.src = t.dataset.src;
        stageImg.alt = t.dataset.alt;
        stageCap.textContent = t.dataset.cap;
    }));
})();
