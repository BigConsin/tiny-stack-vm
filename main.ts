// Tiny stack VM for make.fun's tiny stack ISA v1, faithful to the reference
// VM: wrapping arithmetic, unsigned ops, INT_MIN/-1, masked shift counts,
// sign-extended PUSH8, all ten traps in the reference's check order, and the
// step and output limits. A/B/U: per bytecode 0..83, immediate length,
// values popped, values pushed; 'x' is not an opcode.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const A = '01400000xxxxxxxx000000000000000x000xxxxxxxxxxxxx22220xxxxxxxxxxx00xxxxxxxxxxxxxx0000';
const B = '00011223xxxxxxxx222222212221222x222xxxxxxxxxxxxx01100xxxxxxxxxxx12xxxxxxxxxxxxxx1101';
const U = '01102233xxxxxxxx111111111111111x111xxxxxxxxxxxxx00000xxxxxxxxxxx10xxxxxxxxxxxxxx0010';
function R(p, q) {
  let D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), o = [], S = 0, c = 0, P = 0, k = 0, s = 0;
  for (;;) {
    if (s == 1e6) return [o, 10];
    if (P < 0 || P >= p.length) return [o, 9];
    let e = p[P];
    if (e > 83 || A[e] == 'x') return [o, 5];
    let m = A.charCodeAt(e) - 48;
    if (P + m >= p.length) return [o, 9];
    s++;
    let N = P + 1 + m, a = B.charCodeAt(e) - 48;
    if (S < a) return [o, 2];
    if (S - a + (U.charCodeAt(e) - 48) > 256) return [o, 3];
    P = N;
    if (e > 15 && e < 35 && e != 23 && e != 27) {
      let b = D[--S], x = D[--S];
      if (e > 18 && e < 23 && !b) return [o, 4];
      D[S++] = e == 16 ? x + b : e == 17 ? x - b : e == 18 ? Math.imul(x, b) : e == 19 ? (x == -2147483648 && b == -1 ? x : Math.trunc(x / b)) : e == 20 ? (b == -1 ? 0 : x % b) : e == 21 ? Math.floor((x >>> 0) / (b >>> 0)) : e == 22 ? (x >>> 0) % (b >>> 0) : e == 24 ? x & b : e == 25 ? x | b : e == 26 ? x ^ b : e == 28 ? x << (b & 31) : e == 29 ? x >> (b & 31) : e == 30 ? x >>> (b & 31) : e == 32 ? (x == b ? 1 : 0) : e == 33 ? (x < b ? 1 : 0) : (x >>> 0) < (b >>> 0) ? 1 : 0;
      continue;
    }
    if (!e) return [o, 0];
    else if (e == 1) D[S++] = (p[N - 1] << 24) >> 24;
    else if (e == 2) D[S++] = p[N - 4] | p[N - 3] << 8 | p[N - 2] << 16 | p[N - 1] << 24;
    else if (e == 3) S--;
    else if (e == 4) D[S] = D[S - 1], S++;
    else if (e == 5) { let t = D[S - 1]; D[S - 1] = D[S - 2]; D[S - 2] = t; }
    else if (e == 6) D[S] = D[S - 2], S++;
    else if (e == 7) { let t = D[S - 3]; D[S - 3] = D[S - 2]; D[S - 2] = D[S - 1]; D[S - 1] = t; }
    else if (e == 23) D[S - 1] = -D[S - 1];
    else if (e == 27) D[S - 1] = ~D[S - 1];
    else if (e > 47 && e < 51) { let t = ((p[N - 2] | p[N - 1] << 8) << 16) >> 16; if (e == 48 || (e == 49) == (D[--S] == 0)) P = N + t; }
    else if (e == 51) { if (c == 64) return [o, 7]; C[c++] = N; P = p[N - 2] | p[N - 1] << 8; }
    else if (e == 52) { if (!c) return [o, 8]; P = C[--c]; }
    else if (e == 64) { let t = D[S - 1]; if (t < 0 || t > 255) return [o, 6]; D[S - 1] = M[t]; }
    else if (e == 65) { let t = D[S - 1]; if (t < 0 || t > 255) return [o, 6]; M[t] = D[S - 2]; S -= 2; }
    else if (e == 80) { let t = String(D[S - 1]); if (o.length + t.length > 65536) return [o, 11]; S--; for (let h of t) o.push(h.charCodeAt(0)); }
    else if (e == 81) { if (o.length > 65535) return [o, 11]; o.push(D[--S] & 255); }
    else if (e == 82) D[S++] = k < q.length ? q[k++] : -1;
    else if (e == 83) return [o, D[--S] & 255];
  }
}
let I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (let d of readdirSync(I).sort()) {
  let r = R(new Uint8Array(readFileSync(join(I, d, 'program.bin'))), new Uint8Array(readFileSync(join(I, d, 'input.bin'))));
  mkdirSync(join(O, d), { recursive: true });
  writeFileSync(join(O, d, 'stdout.bin'), Uint8Array.from(r[0]));
  writeFileSync(join(O, d, 'exit.txt'), r[1] + '\n');
}
