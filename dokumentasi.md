# Prompt Antigravity: Rhythm Game (gaya FNF)

Dokumen ini adalah spesifikasi untuk melanjutkan game musik ritme di website. Layar 1 (assets game) **sudah jadi** di `index.html`. Tugasmu: tambahkan layar 2 (run music) dan layar 3 (score), lalu hubungkan ketiganya.

## 1. Ringkasan

Pemain memasukkan 3 file (chart `.json`, musik, vocal) di layar assets, lalu memainkan lagu di canvas dengan 4 tombol (mirip Friday Night Funkin'), lalu melihat skor dan kembali ke layar assets.

Alur: **Assets game → Run music → Score → kembali ke Assets game**.

## 2. Aturan kerja

- Tetap **satu file `index.html`**. Gunakan HTML, Tailwind CSS (CDN), jQuery (CDN), dan canvas. Tanpa framework dan tanpa bundler.
- **Jangan mengubah perilaku layar assets** yang sudah ada. Hanya tambah kode untuk layar baru dan penghubungnya.
- Game dirender di **canvas**. HUD (skor, combo, jeda, hasil) memakai HTML yang ditumpuk di atas canvas.
- Latar semua layar: gradient atas biru, bawah hitam (`bg-gradient-to-b from-blue-600 to-black`).
- Teks antarmuka berbahasa Indonesia, kalimat biasa (bukan huruf kapital semua).
- Semua sprite note berasal dari `NOTE_assets.png` dan atlas `A` yang sudah tertanam di `index.html`.

## 3. Struktur folder

```
index.html          // semua layar
NOTE_assets.png     // spritesheet note (sudah ada)
docs/
  PROMPT-ANTIGRAVITY.md
```

## 4. Layar dan state

Tiga layar dalam satu halaman. Hanya satu yang tampil pada satu waktu. Buat fungsi `showScreen('assets' | 'game' | 'result')`.

```
ASSETS ──(Main sekarang)──> COUNTDOWN ──> PLAYING ⇄ PAUSED
                                             │
                      lagu selesai / health habis
                                             ▼
                                          RESULT ──(Kembali ke assets game)──> ASSETS
                                             └──(Main lagi)──> COUNTDOWN
```

Bungkus layar assets yang sudah ada ke dalam `<section id="screen-assets">`. Tambahkan `<section id="screen-game">` dan `<section id="screen-result">`.

## 5. Kontrak data (sudah ada di layar assets)

Saat tombol **Main sekarang** diklik, layar assets sudah membuat `window.GameAssets`, memanggil `window.startGame(GameAssets)` kalau fungsinya ada, dan memicu event `game:start`. **Implementasikan `window.startGame`.**

```js
window.GameAssets = {
  chart:  /* objek song dari JSON FNF (isi dari d.song) */,
  music:  /* AudioBuffer inst (wajib) */,
  vocal:  /* AudioBuffer voices, atau null */,
  ctx:    /* AudioContext yang sama untuk semua audio */,
  sprite: /* HTMLImageElement NOTE_assets.png */,
  atlas:  /* objek A, lihat bagian 7 */,
  settings: {
    keys: [{c:'KeyD',l:'D'},{c:'KeyF',l:'F'},{c:'KeyJ',l:'J'},{c:'KeyK',l:'K'}], // urutan: kiri, bawah, atas, kanan
    speed: 2.7,   // 1.0 sampai 4.0, default mengikuti chart
    offset: 0,    // ms, boleh negatif
    volume: 80    // 0 sampai 100
  }
};
```

- `settings.keys[i].c` adalah `event.code`. Cocokkan input dengan `event.code`, bukan `event.key`.
- Data ini **harus tetap ada** saat kembali dari layar score, supaya pemain tidak perlu mengunggah ulang.

Buat juga `window.showAssets()` untuk kembali ke layar assets.

Hasil permainan untuk layar score:

```js
GameResult = {
  title, score, accuracy,        // accuracy dalam persen, dua desimal
  maxCombo,
  counts: { sick, good, bad, shit, miss },
  rank,                          // 'S' | 'A' | 'B' | 'C' | 'D'
  completed                      // false kalau health habis
};
```

## 6. Format chart (FNF / Psych Engine)

Chart contoh: `electro-train-easier.json` (113 BPM, speed 2.7, 170 section, 1.622 note, 625 di antaranya hold, durasi 4:28).

```json
{
  "song": {
    "song": "Electro Train",
    "bpm": 113, "speed": 2.7, "needsVoices": true,
    "notes": [
      { "lengthInSteps": 16, "mustHitSection": true,
        "changeBPM": false, "sectionNotes": [[1062.5, 2, 0], [1327.4, 1, 400]] }
    ]
  }
}
```

- `sectionNotes[i] = [waktu_ms, jalur, panjang_hold_ms]`. Elemen keempat (tipe note) bisa ada. **Abaikan note bertipe khusus** (string), jangan error.
- `waktu_ms` sudah **absolut dari awal lagu**. Tidak perlu dihitung dari BPM. BPM dan `changeBPM` hanya dipakai untuk hitung mundur dan efek beat, bukan untuk posisi note.
- Jalur 0 sampai 7. Penentuan note pemain:
  - Kalau `mustHitSection === true`: jalur 0 sampai 3 milik **pemain**, jalur 4 sampai 7 milik lawan.
  - Kalau `false`: jalur 4 sampai 7 milik **pemain**, jalur 0 sampai 3 milik lawan.
  - Jalur di layar = `jalur % 4`. Urutan: 0 kiri, 1 bawah, 2 atas, 3 kanan.
- **Note lawan tidak digambar dan tidak dinilai.**
- Panjang hold > 0 berarti note panjang.

Buat daftar note pemain sekali saat lagu dimulai (urut berdasarkan waktu), jangan memodifikasi objek chart aslinya:

```js
{ t: waktu_ms, lane: 0..3, len: ms, hit: false, missed: false, holding: false }
```

## 7. Sprite dan atlas

Atlas `A` (sudah tertanam di `index.html`) memetakan nama ke `[x, y, w, h, frameX, frameY, frameW, frameH]`. Tiga nilai terakhir hanya ada pada sprite yang dipangkas.

| Kebutuhan | Kunci atlas |
|---|---|
| Receptor diam | `arrowLEFT`, `arrowDOWN`, `arrowUP`, `arrowRIGHT` |
| Note | `purple` (kiri), `blue` (bawah), `green` (atas), `red` (kanan) |
| Badan hold | `purple hold piece`, `blue hold piece`, `green hold piece`, `red hold piece` |
| Ujung hold | `purple end`, `blue end`, `green end`, `red end` |
| Efek tekan | `left press0`, `down press0`, `up press0`, `right press0` |
| Efek kena | `left confirm0` sampai `confirm3`, begitu juga `down`, `up`, `right` |

Menggambar sprite dengan offset (rumus yang sudah dipakai di preview):

```js
function spr(n, cx, cy, s) {
  const f = A[n]; if (!f) return;
  const [x, y, w, h, fx = 0, fy = 0, fw = w, fh = h] = f;
  g.drawImage(img, x, y, w, h, cx - fw*s/2 - fx*s, cy - fh*s/2 - fy*s, w*s, h*s);
}
```

Hold note:
- Badan hold (`... hold piece`, 51×45) **diregangkan** secara vertikal sesuai panjang hold.
- Ujung hold (`... end`, 51×65) digambar di ujung jauh. Untuk **downscroll**, ujungnya harus **dibalik vertikal** (`scale(1, -1)`), karena sprite aslinya dibuat untuk upscroll.
- Lebar hold digambar sekitar `51 * 0.55` untuk skala preview. Sesuaikan agar proporsional dengan skala note di game.

## 8. Audio dan sinkronisasi

- Pakai **satu `AudioContext`** (`GameAssets.ctx`) dan `AudioBufferSourceNode` untuk `music` dan `vocal`. Mulai keduanya pada **waktu yang sama** (`src.start(t0)`).
- Posisi lagu (ms) dihitung dari jam audio, bukan dari `setTimeout` atau `Date.now()`:

```js
songPos = (ctx.currentTime - startTime) * 1000 + settings.offset;
```

- Gunakan `GainNode` untuk volume master (`settings.volume / 100`). Vocal punya gain sendiri: **diredam (0) saat miss** dan dikembalikan saat note berikutnya kena.
- `AudioBufferSourceNode` hanya bisa dipakai sekali. Saat "Ulangi lagu" atau "Main lagi", buat source baru dari buffer yang sama.
- **Jeda**: `ctx.suspend()`. **Lanjut**: tampilkan hitung mundur singkat, lalu `ctx.resume()`.
- Lagu selesai ketika `onended` pada source musik terpanggil.
- Kalau `vocal` bernilai `null`, jangan buat source vocal dan jangan error.

## 9. Gameplay

### Hitung mundur
Sebelum lagu mulai: tampilkan 3, 2, 1, Go. Selang antar angka = `60000 / bpm` ms (BPM section pertama). Audio mulai setelah "Go".

### Posisi note di layar
Gunakan resolusi logis **1280×720**. Skala ke ukuran window dengan letterbox dan perhitungkan `devicePixelRatio`.

```js
pxPerMs = 0.45 * settings.speed;                 // satuan logis 720p
y(note) = receptorY + (note.t - songPos) * pxPerMs * (downscroll ? -1 : 1);
```

- Default **downscroll**: receptor di dekat bagian bawah, note turun dari atas.
- Skala sprite sekitar 0.7, jarak antar jalur 112 px logis, 4 jalur berada di tengah.
- Gambar hanya note yang berada dalam area yang terlihat. Pakai pointer indeks untuk note berikutnya, jangan loop seluruh 1.622 note setiap frame.

### Input
- Pakai `keydown` dan `keyup` dengan `event.code` yang cocok dengan `settings.keys`. **Abaikan `event.repeat`.**
- Panggil `preventDefault()` untuk tombol game.
- Esc membuka dan menutup menu jeda.
- Tambahkan kontrol sentuh: 4 area di bawah layar pada perangkat sentuh.

### Penilaian (selisih waktu absolut antara tekan dan `note.t`)

| Nilai | Selisih | Skor | Bobot akurasi |
|---|---|---|---|
| Sick | ≤ 45 ms | 350 | 1,00 |
| Good | ≤ 90 ms | 200 | 0,75 |
| Bad | ≤ 135 ms | 100 | 0,50 |
| Shit | ≤ 166 ms | 50 | 0,25 |
| Miss | lebih dari itu, atau tidak ditekan | 0 | 0 |

- Tombol ditekan: pilih note pemain **terdekat yang belum dinilai** di jalur itu dalam jendela ±166 ms. Kalau tidak ada, abaikan tanpa hukuman (ghost tapping aktif).
- Note yang `t` nya terlewat lebih dari 166 ms tanpa ditekan: **Miss**, combo putus.
- Efek di receptor: saat tombol ditahan pakai `press0`. Saat kena pakai urutan `confirm0` sampai `confirm3` (sekitar 45 ms per frame).
- Popup nilai (Sick, Good, Bad, Shit, Miss) muncul sebentar dekat jalur, lalu memudar.

### Hold note
- Kepala hold dinilai seperti note biasa.
- Selama tombol ditahan sampai `t + len`: kepala menempel di receptor, badan memendek, efek `confirm` terus tampil, dan skor/health bertambah kecil per detik.
- Tombol dilepas sebelum `t + len - 100` ms: hold dibatalkan, hitung **satu Miss**, combo putus.
- Kepala tidak dinilai (Miss): seluruh hold ikut dianggap miss.

### Health, skor, akurasi, rank
- Health 0 sampai 100, mulai 50. Sick +2, Good +1, Bad 0, Shit −1, Miss −5, tahan hold +4 per detik.
- Health mencapai 0: **gagal**, lagu berhenti, `completed = false`, masuk layar score.
- Akurasi = jumlah bobot / jumlah semua note pemain yang sudah lewat (termasuk Miss) × 100.
- Rank: S ≥ 95%, A ≥ 90%, B ≥ 80%, C ≥ 70%, selain itu D.

## 10. Tampilan layar run music

```
[Judul lagu]                          [ II Jeda ]
1:12 [=========------------------] 4:28

Skor 12.450          +-----------------+
Combo 37             |  <   v   ^   >  |
Akurasi 94,2%        |   (note jatuh)  |
                     +-----------------+       [popup nilai]

[ikon lawan] ===== Health =====[] [ikon pemain]
```

- Canvas di tengah. HUD berupa elemen HTML di atas canvas (skor, combo, akurasi, progress lagu, health bar, tombol Jeda).
- Tombol tiap jalur ditampilkan kecil di dekat receptor (ambil dari `settings.keys[i].l`).
- Efek beat boleh dibuat ringan (misalnya health bar sedikit membesar tiap beat), tapi opsional.
- Hormati `prefers-reduced-motion`: kurangi animasi non-esensial.

### Menu jeda
Panel di atas canvas dengan 3 tombol: **Lanjutkan**, **Ulangi lagu**, **Kembali ke assets game**.

## 11. Tampilan layar score

```
Electro Train
Lagu selesai            (atau "Gagal" kalau health habis)

[Rank S]   Skor 48.920
           Akurasi 96,4%
           Combo maks 212

Sick   1.402 [==========]
Good     131 [==        ]
Bad       23 [=         ]
Shit       9 [          ]
Miss      57 [=         ]

[ Main lagi ]        [ Kembali ke assets game ]
```

- Bar jumlah dinormalkan terhadap total note.
- **Main lagi**: ulang lagu yang sama dari awal (hitung mundur dulu).
- **Kembali ke assets game**: panggil `showAssets()`. Kotak upload harus tetap menampilkan file yang sudah dimuat.

## 12. Kriteria selesai

1. Mengunggah 3 file contoh (`electro-train-easier.json`, `inst.ogg`, `voices.ogg`), lalu menekan **Main sekarang** menampilkan hitung mundur dan lagu berjalan.
2. Musik dan vocal sinkron. Note tepat mengenai receptor saat bunyi yang bersangkutan terdengar, dengan `offset = 0`.
3. Hanya note pemain yang tampil. Jumlah note pemain dihitung dari `mustHitSection` dan jalur `% 4`.
4. Hold note tampil dengan badan yang memanjang, ujung yang benar (dibalik untuk downscroll), dan menyusut saat ditahan.
5. Penilaian, combo, skor, akurasi, health, dan popup nilai bekerja sesuai tabel di atas.
6. Jeda, lanjut, ulangi lagu, dan kembali ke assets bekerja tanpa kehilangan file yang sudah diunggah.
7. Layar score menampilkan hasil yang benar untuk lagu selesai maupun gagal.
8. Tidak ada error di konsol untuk chart tanpa vocal, chart dengan note bertipe khusus, dan perubahan BPM di tengah lagu.
9. Tampilan tetap nyaman di desktop dan HP (canvas menyesuaikan, kontrol sentuh tersedia).

## 13. Keputusan default (boleh diubah)

- Health habis berarti **gagal**.
- Arah scroll: **downscroll**.
- Ambang rank: S 95, A 90, B 80, C 70.
- Ghost tapping: **aktif** (menekan tombol tanpa note tidak dihukum).
- Note lawan: **tidak ditampilkan** dan **tidak dinilai**.