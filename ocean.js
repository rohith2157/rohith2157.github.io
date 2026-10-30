/* ASCII ocean: schools of fish (boids) and a few sharks, drawn on a 12x18 cell grid.
   Exposes window.createOcean(canvas) -> { start, stop, setDark, redraw, splash }. */
(function () {
  "use strict";

  var CW = 12, CH = 18;
  var RAMP = ":;t%SX8#@";
  var ACCENTS = ["#e0892c", "#d9473f", "#a855f7", "#2bb3b8", "#3cae5a", "#4f6bed", "#cfb53b"];
  // Tile colours per shark (cool blue, lavender, slate, teal), mottled cell by cell.
  var SKINS = [
    [[78, 92, 140], [96, 110, 160], [66, 78, 120], [112, 124, 172]],
    [[96, 86, 150], [118, 104, 170], [84, 74, 132], [136, 122, 186]],
    [[88, 98, 112], [106, 116, 132], [74, 84, 98], [124, 134, 150]],
    [[60, 104, 120], [74, 124, 140], [52, 90, 104], [88, 140, 154]]
  ];
  var TAU = Math.PI * 2;
  var NODES = 18;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function angleDiff(a, b) {
    var d = (b - a) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }
  function hash(x, y, z) {
    var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  // Fish species: cruise speed, school size, spacing (in cells), flocking weights.
  var SPECIES = [
    { cruise: 38, max: 70, min: 16, school: [16, 26], sep: [1.7, 1.1], align: 1.8, cohesion: 1.4, jitter: 36 },
    { cruise: 46, max: 80, min: 20, school: [18, 30], sep: [1.5, 1.0], align: 3.0, cohesion: 0.5, jitter: 28 },
    { cruise: 30, max: 60, min: 14, school: [6, 10], sep: [2.4, 1.3], align: 2.0, cohesion: 0.9, jitter: 24 },
    { cruise: 26, max: 56, min: 10, school: [8, 12], sep: [1.4, 1.1], align: 0.4, cohesion: 1.3, jitter: 90 }
  ];

  // Body half-width as a fraction of length; s runs from nose (0) to tail (1).
  function bodyWidth(s) {
    if (s < 0) return 0;
    if (s < 0.12) return 0.1 * Math.pow(Math.sin((s / 0.12) * Math.PI / 2), 0.8);
    if (s < 0.3) return 0.1 + 0.012 * Math.sin(((s - 0.12) / 0.18) * Math.PI);
    if (s < 0.86) return 0.018 + 0.082 * Math.pow(1 - (s - 0.3) / 0.56, 1.25);
    if (s <= 1) return 0.018 * (1 - (s - 0.86) / 0.14) + 0.007;
    return 0;
  }

  // Point-in-triangle in (s, v) space.
  function inTri(px, py, ax, ay, bx, by, cx, cy) {
    var d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
    var d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
    var d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
    var neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(neg && pos);
  }

  // Returns shade (0 = outside, 0..1 inside) for a point in shark-local coordinates.
  function sharkShape(kind, s, v) {
    var a = Math.abs(v);
    if (kind === "hammer") {
      if (s > -0.015 && s < 0.035 && a > 0.16 && a < 0.205) return 0.97; // eyes at the hammer tips
      if (s > -0.02 && s < 0.055 && a < 0.2 - s * 0.9) return 0.62;
    }
    var bw = bodyWidth(s);
    if (bw > 0 && a < bw) return 0.45 + 0.55 * (1 - a / bw);
    if (inTri(s, a, 0.18, 0.07, 0.33, 0.07, 0.47, 0.27)) return 0.34; // pectoral fins, swept back
    if (inTri(s, a, 0.6, 0.02, 0.67, 0.02, 0.73, 0.085)) return 0.3;  // pelvic fins
    if (inTri(s, v, 0.85, 0.0, 0.93, 0.0, 1.08, -0.14)) return 0.38;  // tail, upper lobe
    if (inTri(s, v, 0.87, 0.0, 0.95, 0.0, 1.03, 0.08)) return 0.32;   // tail, lower lobe
    return 0;
  }

  window.createOcean = function (canvas) {
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, dpr = 1, cols = 0, rows = 0;
    var fish = [], sharks = [], ripples = [];
    var time = 0, lastSpawn = 0, running = false, raf = 0, lastFrame = 0, dark = false;
    var cellShade = new Float32Array(0), cellOwner = new Int16Array(0);
    var hashSize = 60, hashCols = 0, hashRows = 0, hashHead = new Int32Array(0), hashNext = new Int32Array(0);
    var palette, skinOf = [];

    function setPalette() {
      palette = dark
        ? { ink: "240,243,248", inkA: [0.55, 1], fish: "229,231,236", accentA: 0.9 }
        : { ink: "18,22,32", inkA: [0.6, 1], fish: "37,40,48", accentA: 0.7 };
    }

    // Skin colour for one cell: brighter toward the spine in dark mode, pastel in light mode.
    function tileColour(rgb, shade) {
      var r, g, b;
      if (dark) {
        var gain = 0.55 + 0.6 * shade;
        r = rgb[0] * gain; g = rgb[1] * gain; b = rgb[2] * gain;
      } else {
        var mix = 0.62 - 0.32 * shade;
        r = rgb[0] + (255 - rgb[0]) * mix; g = rgb[1] + (255 - rgb[1]) * mix; b = rgb[2] + (255 - rgb[2]) * mix;
      }
      return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
    }

    /* ---------- setup ---------- */
    function sharkLength() { return clamp(Math.min(W, H) * 0.44, 150, 420); }

    function addShark(id, kind, scale) {
      var len = sharkLength() * scale, x = 0, y = 0, best = -1;
      for (var tries = 0; tries < 24; tries++) {
        var cx = rand(W * 0.08, W * 0.92), cy = rand(H * 0.1, H * 0.9), near = Infinity;
        for (var i = 0; i < sharks.length; i++) {
          near = Math.min(near, Math.hypot(cx - sharks[i].nodes[0], cy - sharks[i].nodes[1]) / (len + sharks[i].len));
        }
        if (near > best) { best = near; x = cx; y = cy; }
        if (near > 0.7) break;
      }
      var heading = rand(0, TAU), seg = len / (NODES - 1), nodes = new Float32Array(NODES * 2);
      for (var n = 0; n < NODES; n++) {
        nodes[n * 2] = x - Math.cos(heading) * seg * n;
        nodes[n * 2 + 1] = y - Math.sin(heading) * seg * n;
      }
      sharks.push({ id: id, kind: kind, len: len, nodes: nodes, heading: heading, speed: 30,
        wander: heading, hunger: rand(0.3, 0.8), phase: rand(0, TAU), target: null, retarget: 0 });
      skinOf[id] = (id - 1) % SKINS.length;
    }

    function spawnSchool(list, x, y, dir) {
      var sp = Math.floor(Math.random() * SPECIES.length), spec = SPECIES[sp];
      for (var i = 0; i < list.length; i++) {
        var f = list[i];
        f.alive = true; f.species = sp; f.alarm = 0;
        f.x = x + rand(-1, 1) * 50; f.y = y + rand(-1, 1) * 30;
        f.vx = Math.cos(dir) * spec.cruise; f.vy = Math.sin(dir) * spec.cruise;
        f.depth = rand(0.55, 1);
      }
    }

    function seed() {
      sharks = [];
      var count = W < 700 ? 2 : W < 1200 ? 4 : 5;
      var kinds = ["hammer", "reef", "hammer", "hammer", "reef"];
      var scales = [1, 0.72, 0.86, 0.78, 0.9];
      for (var i = 0; i < count; i++) addShark(i + 1, kinds[i], scales[i]);
      sharks.sort(function (a, b) { return a.len - b.len; });

      var total = clamp(Math.round((W * H) / 4400), 80, 320);
      fish = [];
      while (fish.length < total) {
        var spec = SPECIES[Math.floor(Math.random() * SPECIES.length)];
        var n = Math.min(Math.floor(rand(spec.school[0], spec.school[1] + 1)), total - fish.length);
        var batch = [];
        for (var k = 0; k < n; k++) { var f = {}; batch.push(f); fish.push(f); }
        spawnSchool(batch, rand(W * 0.06, W * 0.94), rand(H * 0.08, H * 0.92), (Math.random() < 0.5 ? 0 : Math.PI) + rand(-0.5, 0.5));
      }
      hashNext = new Int32Array(fish.length);
    }

    /* ---------- simulation ---------- */
    function rebuildHash() {
      hashCols = Math.ceil(W / hashSize) + 2;
      hashRows = Math.ceil(H / hashSize) + 2;
      if (hashHead.length !== hashCols * hashRows) hashHead = new Int32Array(hashCols * hashRows);
      hashHead.fill(-1);
      for (var i = 0; i < fish.length; i++) {
        var f = fish[i];
        if (!f.alive) continue;
        var b = bucket(f.x, f.y);
        hashNext[i] = hashHead[b];
        hashHead[b] = i;
      }
    }
    function bucket(x, y) {
      return clamp(Math.floor(y / hashSize) + 1, 0, hashRows - 1) * hashCols + clamp(Math.floor(x / hashSize) + 1, 0, hashCols - 1);
    }

    function stepFish(dt) {
      var perc2 = hashSize * hashSize;
      for (var i = 0; i < fish.length; i++) {
        var f = fish[i];
        if (!f.alive) continue;
        var spec = SPECIES[f.species];
        var sx = spec.sep[0] * CW * (1 + f.alarm), sy = spec.sep[1] * CH * (1 + f.alarm);
        var ax = 0, ay = 0, avx = 0, avy = 0, cx = 0, cy = 0, n = 0;
        var bx = clamp(Math.floor(f.x / hashSize) + 1, 0, hashCols - 1), by = clamp(Math.floor(f.y / hashSize) + 1, 0, hashRows - 1);
        for (var yy = Math.max(0, by - 1); yy <= Math.min(hashRows - 1, by + 1); yy++) {
          for (var xx = Math.max(0, bx - 1); xx <= Math.min(hashCols - 1, bx + 1); xx++) {
            for (var j = hashHead[yy * hashCols + xx]; j !== -1; j = hashNext[j]) {
              if (j === i) continue;
              var o = fish[j], dx = o.x - f.x, dy = o.y - f.y, d2 = dx * dx + dy * dy;
              if (d2 > perc2) continue;
              var ex = dx / sx, ey = dy / sy, e2 = ex * ex + ey * ey;
              if (e2 < 1) { var push = (1 - Math.sqrt(e2)) * 90; ax -= ex * push; ay -= ey * push; }
              if (o.species !== f.species) continue;
              avx += o.vx; avy += o.vy; cx += o.x; cy += o.y; n++;
            }
          }
        }
        if (n > 0) {
          ax += (avx / n - f.vx) * spec.align;
          ay += (avy / n - f.vy) * spec.align;
          ax += (cx / n - f.x) * spec.cohesion;
          ay += (cy / n - f.y) * spec.cohesion;
        }
        // flee sharks
        for (var s = 0; s < sharks.length; s++) {
          var sh = sharks[s], r = 70 + sh.len * 0.25;
          for (var k = 0; k < NODES; k += 3) {
            var hx = f.x - sh.nodes[k * 2], hy = f.y - sh.nodes[k * 2 + 1], hd = Math.hypot(hx, hy);
            if (hd < r && hd > 0.01) {
              var flee = (1 - hd / r) * (k === 0 ? 420 : 160);
              ax += (hx / hd) * flee; ay += (hy / hd) * flee;
              if (k === 0) f.alarm = Math.max(f.alarm, 1 - hd / r);
            }
          }
        }
        ax += rand(-1, 1) * spec.jitter;
        ay += rand(-1, 1) * spec.jitter * 0.6;
        f.vx += ax * dt; f.vy += ay * dt;
        f.vy *= Math.exp(-dt * 2.2); // fish mostly swim level
        var speed = Math.hypot(f.vx, f.vy) || 1;
        var want = spec.cruise * (1 + f.alarm * 0.9);
        var target = clamp(speed + (want - speed) * Math.min(1, dt * 1.5), spec.min, spec.max * (1 + f.alarm * 0.4));
        f.vx = (f.vx / speed) * target; f.vy = (f.vy / speed) * target;
        f.x += f.vx * dt; f.y += f.vy * dt;
        f.alarm = Math.max(0, f.alarm - dt * 0.6);
        // wrap around the edges
        if (f.x < -24) f.x += W + 48; else if (f.x > W + 24) f.x -= W + 48;
        if (f.y < -24) f.y += H + 48; else if (f.y > H + 24) f.y -= H + 48;
      }
    }

    function findPrey(sh) {
      var range = sh.len * 0.9 + 160, hx = sh.nodes[0], hy = sh.nodes[1];
      var cos = Math.cos(sh.heading), sin = Math.sin(sh.heading), best = null, bestScore = Infinity;
      for (var i = 0; i < fish.length; i++) {
        var f = fish[i];
        if (!f.alive) continue;
        var dx = f.x - hx, dy = f.y - hy, d = Math.hypot(dx, dy);
        if (d > range || d < 0.01) continue;
        var ahead = (dx * cos + dy * sin) / d;
        if (ahead < 0.2) continue;
        var score = d * (1 + (1 - ahead) * 0.8);
        if (score < bestScore) { bestScore = score; best = f; }
      }
      return best;
    }

    function stepSharks(dt) {
      for (var s = 0; s < sharks.length; s++) {
        var sh = sharks[s], nodes = sh.nodes, len = sh.len;
        var hx = nodes[0], hy = nodes[1];
        sh.hunger = Math.min(1, sh.hunger + dt * 0.025);
        sh.wander += rand(-1, 1) * dt * 1.4;
        var dx = Math.cos(sh.wander), dy = Math.sin(sh.wander);

        if (time > sh.retarget) { sh.target = findPrey(sh); sh.retarget = time + 0.45; }
        var hunting = false, closeness = 0;
        if (sh.target && sh.target.alive && sh.hunger > 0.3) {
          var tx = sh.target.x + sh.target.vx * 0.35 - hx, ty = sh.target.y + sh.target.vy * 0.35 - hy, td = Math.hypot(tx, ty) || 1;
          var pull = 1.4 + 2.6 * sh.hunger;
          dx += (tx / td) * pull; dy += (ty / td) * pull;
          hunting = true; closeness = clamp(1 - td / (len * 0.9), 0, 1);
        }
        // keep away from other sharks
        for (var o = 0; o < sharks.length; o++) {
          if (o === s) continue;
          for (var k = 0; k < NODES; k += 4) {
            var ox = hx - sharks[o].nodes[k * 2], oy = hy - sharks[o].nodes[k * 2 + 1], od = Math.hypot(ox, oy);
            var reach = (len + sharks[o].len) * 0.45;
            if (od < reach && od > 0.01) { var rep = (1 - od / reach) * 3; dx += (ox / od) * rep; dy += (oy / od) * rep; }
          }
        }
        // soft walls
        var m = len * 0.35;
        dx += (clamp(-hx / m, 0, 1) - clamp((hx - W) / m, 0, 1)) * 3.5;
        dy += (clamp(-hy / m, 0, 1) - clamp((hy - H) / m, 0, 1)) * 3.5;

        var desired = Math.atan2(dy, dx);
        var maxTurn = Math.min(hunting ? 1.7 + closeness : 0.8, sh.speed / (len * 0.22)) * dt;
        sh.heading += clamp(angleDiff(sh.heading, desired), -maxTurn, maxTurn);
        var cruise = 30 + len * 0.04;
        var wantSpeed = hunting ? cruise * (1.45 + closeness * 1.5) : cruise;
        sh.speed += (wantSpeed - sh.speed) * Math.min(1, dt * 1.1);
        sh.phase += dt * (2 + sh.speed / 24);

        var swim = sh.heading + Math.sin(sh.phase) * 0.06;
        nodes[0] += Math.cos(swim) * sh.speed * dt;
        nodes[1] += Math.sin(swim) * sh.speed * dt;

        // body follows the head with a limited bend per segment
        var seg = len / (NODES - 1), prev = sh.heading + Math.PI;
        for (var n = 1; n < NODES; n++) {
          var px = nodes[(n - 1) * 2], py = nodes[(n - 1) * 2 + 1];
          var ang = Math.atan2(nodes[n * 2 + 1] - py, nodes[n * 2] - px);
          ang = prev + clamp(angleDiff(prev, ang), -0.12, 0.12);
          nodes[n * 2] = px + Math.cos(ang) * seg;
          nodes[n * 2 + 1] = py + Math.sin(ang) * seg;
          prev = ang;
        }

        // eat
        if (sh.hunger > 0.15) {
          var bite = len * 0.05 + 8;
          for (var i = 0; i < fish.length; i++) {
            var f = fish[i];
            if (f.alive && (f.x - nodes[0]) * (f.x - nodes[0]) + (f.y - nodes[1]) * (f.y - nodes[1]) < bite * bite) {
              f.alive = false; f.respawnAt = time + rand(3, 8);
              sh.hunger = Math.max(0, sh.hunger - 0.16);
            }
          }
        }
      }
    }

    function respawn() {
      var ready = [];
      for (var i = 0; i < fish.length; i++) if (!fish[i].alive && fish[i].respawnAt <= time) ready.push(fish[i]);
      if (!ready.length || (ready.length < 6 && time - lastSpawn < 9)) return;
      lastSpawn = time;
      var side = Math.floor(Math.random() * 4), t = rand(0.15, 0.85);
      var x = side === 0 ? -20 : side === 1 ? W + 20 : t * W;
      var y = side === 2 ? -20 : side === 3 ? H + 20 : t * H;
      spawnSchool(ready.slice(0, 26), x, y, Math.atan2(H / 2 - y, W / 2 - x) + rand(-0.5, 0.5));
    }

    function step(dt) {
      time += dt;
      rebuildHash();
      stepFish(dt);
      stepSharks(dt);
      respawn();
      for (var r = ripples.length - 1; r >= 0; r--) if (time - ripples[r].t > 1.1) ripples.splice(r, 1);
    }

    /* ---------- rendering ---------- */
    function rasterSharks() {
      cellShade.fill(0);
      cellOwner.fill(0);
      for (var s = 0; s < sharks.length; s++) {
        var sh = sharks[s], nodes = sh.nodes, len = sh.len, seg = len / (NODES - 1);
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (var n = 0; n < NODES; n++) {
          minX = Math.min(minX, nodes[n * 2]); maxX = Math.max(maxX, nodes[n * 2]);
          minY = Math.min(minY, nodes[n * 2 + 1]); maxY = Math.max(maxY, nodes[n * 2 + 1]);
        }
        var pad = len * 0.26;
        var c0 = clamp(Math.floor((minX - pad) / CW), 0, cols - 1), c1 = clamp(Math.floor((maxX + pad) / CW), 0, cols - 1);
        var r0 = clamp(Math.floor((minY - pad) / CH), 0, rows - 1), r1 = clamp(Math.floor((maxY + pad) / CH), 0, rows - 1);
        for (var r = r0; r <= r1; r++) {
          for (var c = c0; c <= c1; c++) {
            var px = c * CW + CW / 2, py = r * CH + CH / 2;
            // nearest point on the spine -> (s along body, v across body), both in units of length
            var bestD = Infinity, bs = 0, bv = 0;
            for (var k = 0; k < NODES - 1; k++) {
              var ax = nodes[k * 2], ay = nodes[k * 2 + 1], bx = nodes[k * 2 + 2], by = nodes[k * 2 + 3];
              var ex = bx - ax, ey = by - ay, el2 = ex * ex + ey * ey || 1;
              var t = ((px - ax) * ex + (py - ay) * ey) / el2;
              var lo = k === 0 ? -0.6 : 0, hi = k === NODES - 2 ? 1.6 : 1;
              t = clamp(t, lo, hi);
              var qx = ax + ex * t - px, qy = ay + ey * t - py, d = qx * qx + qy * qy;
              if (d < bestD) {
                bestD = d;
                bs = (k + t) * seg / len;
                bv = ((px - ax) * ey - (py - ay) * ex) / Math.sqrt(el2) / len;
              }
            }
            var shade = sharkShape(sh.kind, bs, bv);
            if (shade <= 0) continue;
            var idx = r * cols + c;
            if (shade >= cellShade[idx]) { cellShade[idx] = shade; cellOwner[idx] = sh.id; }
          }
        }
      }
    }

    function draw() {
      if (!cols) return;
      ctx.clearRect(0, 0, W, H);
      rasterSharks();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "500 13px 'Geist Mono', ui-monospace, Menlo, monospace";

      var ink = palette.ink;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var idx = r * cols + c, shade = cellShade[idx];
          var x = c * CW, y = r * CH;
          if (!shade) {
            // a loose ring of 'o' and '.' around each body softens the outline
            var edge = (c > 0 && cellShade[idx - 1]) || (c < cols - 1 && cellShade[idx + 1]) ||
              (r > 0 && cellShade[idx - cols]) || (r < rows - 1 && cellShade[idx + cols]);
            if (edge) {
              var e = hash(c, r, 99);
              if (e > 0.55) {
                ctx.fillStyle = "rgba(" + ink + ",0.45)";
                ctx.fillText(e > 0.8 ? "o" : ".", x + CW / 2, y + CH / 2);
              }
            }
            continue;
          }
          var owner = cellOwner[idx], h = hash(c, r, owner), h2 = hash(r, c, owner + 17);
          if (h < 0.06 && shade > 0.4) {
            ctx.globalAlpha = palette.accentA;
            ctx.fillStyle = ACCENTS[Math.floor(h * 1000) % ACCENTS.length];
            ctx.fillRect(x + 0.5, y + 1, CW - 1, CH - 2);
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = tileColour(SKINS[skinOf[owner] || 0][Math.floor(h2 * 4)], shade);
            ctx.fillRect(x + 0.5, y + 1, CW - 1, CH - 2);
          }
          ctx.fillStyle = "rgba(" + ink + "," + (palette.inkA[0] + (palette.inkA[1] - palette.inkA[0]) * shade).toFixed(3) + ")";
          var level = clamp(shade + (h2 - 0.5) * 0.25, 0, 0.999);
          ctx.fillText(RAMP[Math.floor(level * RAMP.length)], x + CW / 2, y + CH / 2 + 1);
        }
      }

      // fish
      for (var i = 0; i < fish.length; i++) {
        var f = fish[i];
        if (!f.alive) continue;
        var fc = Math.floor(f.x / CW), fr = Math.floor(f.y / CH);
        if (fc < 0 || fr < 0 || fc >= cols || fr >= rows || cellShade[fr * cols + fc]) continue;
        var ang = Math.atan2(f.vy, f.vx), ch;
        var flat = Math.abs(Math.cos(ang)), up = Math.sin(ang);
        if (flat > 0.8) ch = "-";
        else if (flat < 0.35) ch = "'";
        else ch = (up > 0) === (Math.cos(ang) > 0) ? "`" : ",";
        ctx.fillStyle = "rgba(" + palette.fish + "," + (0.35 + 0.45 * f.depth + 0.2 * f.alarm).toFixed(3) + ")";
        ctx.fillText(ch, fc * CW + CW / 2, fr * CH + CH / 2);
      }

      // splash rings
      for (var p = 0; p < ripples.length; p++) {
        var rp = ripples[p], age = (time - rp.t) / 1.1, rad = 20 + age * 220;
        ctx.fillStyle = "rgba(" + palette.fish + "," + (0.6 * (1 - age)).toFixed(3) + ")";
        var steps = Math.max(12, Math.floor(rad / 6));
        for (var q = 0; q < steps; q++) {
          var a = (q / steps) * TAU;
          var rc = Math.floor((rp.x + Math.cos(a) * rad) / CW), rr = Math.floor((rp.y + Math.sin(a) * rad * 0.7) / CH);
          ctx.fillText(q % 3 ? "." : "'", rc * CW + CW / 2, rr * CH + CH / 2);
        }
      }
    }

    function resize() {
      var first = W === 0;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CW); rows = Math.ceil(H / CH);
      cellShade = new Float32Array(cols * rows);
      cellOwner = new Int16Array(cols * rows);
      if (first) seed();
      else {
        var len = sharkLength();
        sharks.forEach(function (sh, i) { sh.len = len * [1, 0.72, 0.86, 0.78, 0.9][i % 5]; });
        fish.forEach(function (f) { f.x = clamp(f.x, 0, W); f.y = clamp(f.y, 0, H); });
      }
      draw();
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
      lastFrame = now;
      if (dt > 0) { step(dt); draw(); }
    }

    function splash(x, y) {
      ripples.push({ x: x, y: y, t: time });
      for (var i = 0; i < fish.length; i++) {
        var f = fish[i];
        if (!f.alive) continue;
        var dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy);
        if (d > 240 || d < 0.01) continue;
        var kick = (1 - d / 240) * 260;
        f.vx += (dx / d) * kick; f.vy += (dy / d) * kick; f.alarm = 1;
      }
      if (!running) draw();
    }

    setPalette();
    resize();
    // Let the scene settle so a paused / reduced-motion frame still looks alive.
    for (var warm = 0; warm < 90; warm++) step(1 / 30);
    draw();
    window.addEventListener("resize", resize);

    return {
      start: function () { if (running) return; running = true; lastFrame = 0; raf = requestAnimationFrame(frame); },
      stop: function () { running = false; cancelAnimationFrame(raf); },
      setDark: function (v) { dark = v; setPalette(); draw(); },
      redraw: draw,
      splash: splash
    };
  };
})();
