/*
 * "What the cat can do": one run through all of it, on request, with a caption for
 * each thing and a button to skip on or stop.
 *
 * It plays on folders of its own, drawn on the layer. So it works with windows all
 * over the screen, shows the game with icons to someone who has not switched that on,
 * and never touches a real icon.
 */
const FireflyCatDemo = (() => {
  const picture = (svg) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

  const FOLDER = picture(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M4 12a3 3 0 0 1 3-3h11l5 5h18a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#d9962f"/><rect x="4" y="18" width="40" height="24" rx="3" fill="#f6c453"/><rect x="4" y="18" width="40" height="3" rx="1.5" fill="#fbdc8b"/></svg>`);
  const FILE = picture(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M11 4h18l10 10v28a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#f4f6fb"/><path d="M29 4l10 10H31a2 2 0 0 1-2-2z" fill="#bcc6dc"/><g fill="#8b98b8"><rect x="15" y="20" width="18" height="2.4" rx="1.2"/><rect x="15" y="26" width="18" height="2.4" rx="1.2"/><rect x="15" y="32" width="12" height="2.4" rx="1.2"/></g></svg>`);

  const STYLES = `
    .demo-icons {
      position: fixed;
      inset: 0;
      pointer-events: none;
    }
    .demo-icon {
      position: absolute;
      display: grid;
      justify-items: center;
      align-content: start;
      gap: 3px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
      will-change: transform;
    }
    .demo-icon img {
      display: block;
      width: 48px;
      height: 48px;
    }
    .demo-window {
      position: fixed;
      box-sizing: border-box;
      border-radius: 10px;
      border: 1px solid var(--w-border-strong);
      background: var(--w-pill);
      box-shadow: 0 18px 44px -14px rgba(0, 0, 0, 0.55);
      pointer-events: none;
      will-change: transform;
    }
    .demo-window::before {
      content: "";
      display: block;
      height: 30px;
      border-bottom: 1px solid var(--w-border);
      border-radius: 10px 10px 0 0;
      background: var(--w-soft);
    }
    .demo-card {
      position: fixed;
      z-index: 5;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      display: grid;
      gap: 10px;
      width: min(440px, calc(100vw - 32px));
      box-sizing: border-box;
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid var(--w-border);
      background: var(--w-pill);
      color: var(--w-text);
      box-shadow: 0 12px 34px -12px var(--w-shadow-2);
      pointer-events: auto;
      cursor: default;
    }
    .demo-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 12px;
      font-weight: 800;
      color: var(--w-subtle);
    }
    .demo-say {
      min-height: 2.7em;
      font-size: 15px;
      font-weight: 700;
      line-height: 1.35;
    }
    .demo-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .demo-buttons button {
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid var(--w-border);
      background: var(--w-soft);
      color: var(--w-text);
      font-size: 13px;
      font-weight: 700;
    }
    .demo-buttons button:hover {
      border-color: var(--w-border-strong);
    }
    .demo-buttons .demo-next {
      background: var(--accent);
      border-color: transparent;
      color: var(--on-accent, #fff);
    }
  `;

  function start({ cat, root, say, images, under, onEnd }) {
    const center = window.innerWidth / 2;
    const row = Math.round(window.innerHeight * 0.56);
    const place = document.createElement("div");
    place.className = "demo-icons";

    const folders = [
      { id: "demo0", x: center - 214, source: FOLDER, name: say.demoFolder },
      { id: "demo1", x: center - 24, source: FILE, name: say.demoFile },
      { id: "demo2", x: center + 166, source: FOLDER, name: say.demoFolder },
    ].map((folder) => {
      const element = document.createElement("div");
      element.className = "demo-icon";
      element.style.cssText = `left:${folder.x - 14}px;top:${row - 2}px;width:76px`;
      const image = document.createElement("img");
      image.src = folder.source;
      image.alt = "";
      const label = document.createElement("span");
      label.textContent = folder.name;
      element.append(image, label);
      place.append(element);
      images.set(folder.id, folder.source);
      return {
        id: folder.id,
        x: folder.x,
        y: row,
        w: 48,
        h: 48,
        cell: { x: folder.x - 14, y: row - 2, w: 76, h: 78 },
        fake: true,
        element,
        from: [folder.x, row],
      };
    });
    root.prepend(place);
    cat.setScripted(true);
    cat.endOuting();
    cat.setPerches(folders);

    const card = document.createElement("div");
    card.className = "demo-card";
    card.innerHTML = `
      <div class="demo-head"><span class="demo-title"></span><span class="demo-count"></span></div>
      <div class="demo-say" aria-live="polite"></div>
      <div class="demo-buttons"><button class="demo-stop" type="button"></button><button class="demo-next" type="button"></button></div>`;
    root.append(card);
    const text = (selector, value) => {
      card.querySelector(selector).textContent = value;
    };
    text(".demo-title", say.demoTitle);
    text(".demo-stop", say.demoStop);
    text(".demo-next", say.demoNext);

    let stopped = false;
    let skip = () => {};
    let turn = 0;
    // Dragging the card's buttons around would otherwise start dragging nothing.
    card.addEventListener("pointerdown", (event) => event.stopPropagation());
    card.querySelector(".demo-next").addEventListener("click", () => skip());

    const roam = () => cat.setActivity("roam", { from: cat.whereabouts() });

    /* A window of its own to sit on, moved about the way a person would. */
    function drawnWindow() {
      const W = 460;
      const box = { x: Math.max(40, center - 330), y: Math.round(window.innerHeight * 0.36), w: W, h: 230 };
      const element = document.createElement("div");
      element.className = "demo-window";
      element.style.cssText = `left:${box.x}px;top:${box.y}px;width:${box.w}px;height:${box.h}px`;
      under(element);
      // The window goes over them, and the theme's colours let a little through.
      place.style.visibility = "hidden";
      const from = { x: box.x, y: box.y };
      const seat = () => ({ id: "demo-window", fake: true, x: box.x, y: box.y, r: box.x + box.w, free: [[box.x, box.x + box.w]] });
      const put = (x, y) => {
        box.x = x;
        box.y = y;
        element.style.transform = `translate(${x - from.x}px, ${y - from.y}px)`;
        cat.windowMoved(seat());
      };
      const glide = (dx, dy, ms, live) => new Promise((resolve) => {
        const x0 = box.x;
        const y0 = box.y;
        const toX = Math.min(window.innerWidth - W - 8, Math.max(8, x0 + dx));
        const began = performance.now();
        const timer = setInterval(() => {
          const p = Math.min(1, (performance.now() - began) / ms);
          if (live()) put(x0 + (toX - x0) * p, y0 + dy * p);
          if (p >= 1 || !live()) {
            clearInterval(timer);
            resolve();
          }
        }, 33);
      });
      const remove = () => {
        place.style.visibility = "";
        const fading = element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "ease-out" });
        fading.onfinish = () => element.remove();
        fading.oncancel = () => element.remove();
      };
      return { seat, glide, remove };
    }

    const steps = [
      { words: say.demoHop, run: () => cat.perform("hop", { route: folders }) },
      { words: say.demoHide, run: () => cat.perform("hide", { perch: folders[1], peeks: 1 }) },
      { words: say.demoBite, run: () => cat.perform("bite", { perch: folders[2], holdMs: 11000 }) },
      {
        words: say.demoDrag,
        run: () => cat.perform("drag", {
          plan: {
            id: folders[0].id,
            x: Math.max(40, folders[0].x - 190),
            y: Math.min(window.innerHeight - 110, folders[0].y + 90),
          },
        }),
      },
      {
        words: say.demoBall,
        run: async (live, pause) => {
          cat.setActivity("ball", { from: cat.whereabouts() });
          await pause(1500);
          if (live()) cat.rollBallAt(folders[1].x + 24, folders[1].y + 24);
          await pause(9000);
        },
      },
      {
        words: say.demoRide,
        run: async (live, pause) => {
          const drawn = drawnWindow();
          try {
            cat.perform("ride", { seat: drawn.seat(), holdMs: 60000 });
            while (live() && !cat.isRiding()) await pause(100);
            await pause(1100);
            if (live()) await drawn.glide(190, 26, 1500, live);
            await pause(600);
            if (live()) await drawn.glide(-120, -40, 1200, live);
            await pause(800);
            // And now a good yank.
            if (live()) await drawn.glide(-420, 0, 230, live);
            await pause(2300);
          } finally {
            drawn.remove();
          }
        },
      },
      { words: say.demoPeek, run: () => cat.perform("peek", { edges: ["right", "top"], rounds: 2, pace: 120 }) },
      { words: say.demoFirefly, run: () => cat.perform("firefly", { rounds: 2 }) },
      { words: say.demoCursor, run: () => cat.perform("cursor") },
      { words: say.demoZoomies, run: () => cat.perform("zoomies", { legs: 3 }) },
      { words: say.demoCheer, run: () => cat.perform("cheer") },
      {
        words: say.demoPurr,
        run: async (live, pause) => {
          await pause(600);
          if (live()) cat.setPurring(true);
          await pause(4500);
          cat.setPurring(false);
        },
      },
    ];

    function finish() {
      if (stopped) return;
      stopped = true;
      skip();
      cat.endOuting();
      cat.setPurring(false);
      cat.setScripted(false);
      cat.setPerches([]);
      card.remove();
      place.remove();
      for (const folder of folders) images.delete(folder.id);
      onEnd();
    }

    card.querySelector(".demo-stop").addEventListener("click", finish);

    async function run() {
      // With animations switched off in Windows, the cat sits still: nothing to show.
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        text(".demo-say", say.demoReduced);
        card.querySelector(".demo-next").hidden = true;
        return;
      }
      roam();
      for (let index = 0; index < steps.length && !stopped; index += 1) {
        const mine = ++turn;
        const live = () => turn === mine && !stopped;
        const step = steps[index];
        text(".demo-count", `${index + 1} / ${steps.length}`);
        text(".demo-say", step.words);
        const skipped = new Promise((resolve) => {
          skip = resolve;
        });
        const pause = (ms) => Promise.race([new Promise((resolve) => setTimeout(resolve, ms)), skipped]);
        await Promise.race([step.run(live, pause), skipped]);
        if (stopped) return;
        // Whatever it was still doing there, the next thing starts from a clean slate.
        turn += 1;
        cat.endOuting();
        cat.setPurring(false);
        roam();
        await pause(index === steps.length - 1 ? 0 : 500);
      }
      finish();
    }

    run().catch((error) => {
      console.error(error);
      finish();
    });

    return {
      stop: finish,
      moved(perch) {
        perch.element.style.transform = `translate(${perch.x - perch.from[0]}px, ${perch.y - perch.from[1]}px)`;
      },
    };
  }

  return { start, STYLES };
})();
