# Lorong Gelap - 3D PC Horror Game

Game horor 3D first-person untuk PC yang dibuat dengan WebGL, Three.js, dan Web Audio API. Game ini sepenuhnya modular, ringan, dan dapat dimainkan langsung di browser PC Anda tanpa perlu download asset eksternal yang besar.

---

## 🎮 Cara Menjalankan Game

1. **Cara Cepat:**
   - Cukup klik ganda (double-click) file `START_GAME.bat` atau langsung klik ganda `index.html` menggunakan browser modern (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, dsb).
2. **Memulai:**
   - Di menu utama, klik tombol **"Play"**.
   - Klik pada layar game untuk mengunci kursor mouse (Pointer Lock).
   - Gunakan headphone atau speaker untuk pengalaman horor maksimal!

---

## ⌨️ Kontrol Game

| Tombol | Aksi |
| :--- | :--- |
| **W, A, S, D** | Bergerak (Maju, Mundur, Kiri, Kanan) |
| **Mouse / Touchpad** | Melihat Sekeliling (Klik layar untuk kunci kursor, atau langsung geser/drag) |
| **Tombol Panah (⬅️ ➡️ ⬆️ ⬇️)** | Alternatif melihat sekeliling bagi pengguna Touchpad Laptop |
| **Shift (Tahan)** | Berlari / Sprint (Mengonsumsi stamina) |
| **F** | Menyalakan / Mematikan Senter (Jangkauan sinar luas & terang) |
| **E** | Berinteraksi (Ambil Kunci, Baterai, Buka Pintu Keluar) |
| **ESC** | Melepaskan kursor mouse |

---

## 🎯 Objektif & Gameplay

1. **Jelajahi Gedung**: Anda terbangun di lorong gedung tua yang gelap dan mencekam.
2. **Kumpulkan 3 Kunci**:
   - **Kunci 1 (Storage Key)**: Terletak di Ruang Arsip / Gudang barat daya.
   - **Kunci 2 (Medical Key)**: Terletak di atas meja ruang medis/morgue tenggara.
   - **Kunci 3 (Electrical Key)**: Terletak di dekat generator ruang utilitas listrik barat laut.
3. **Manajemen Baterai Senter**:
   - Baterai senter berkurang ketika senter menyala.
   - Jika baterai menipis (<20%), senter mulai berkedip.
   - Temukan botol baterai hijau cadangan (+50%) di meja kantor atau bangku lorong.
4. **Hindari Monster ("The Lurker")**:
   - Makhluk humanoid gelap berpatroli di gedung.
   - Monster sensitif terhadap suara lari (Shift) dan sorotan sinar senter.
   - Jika monster mendekat, layar akan bergetar merah dan suara detak jantung akan berdegup semakin kencang.
   - Jika tertangkap, jumpscare akan memicu **GAME OVER**.
5. **Kabur & Menang**:
   - Bawa ketiga kunci ke Pintu Keluar baja di ujung utara lorong (di bawah tanda "EXIT" hijau).
   - Tekan **[E]** untuk membuka kunci dan keluar hidup-hidup!

---

## 🛠️ Arsitektur & Fitur Teknis

- **Modular Code**:
  - `css/style.css`: Antarmuka HUD, efek scanline CRT, vignette kegelapan, modal menu.
  - `js/audio.js`: Sintesis audio prosedural murni menggunakan Web Audio API (detak jantung, langkah kaki, sakelar senter, denting kunci, raungan monster, jeritan jumpscare, dan musik kemenangan).
  - `js/textures.js`: Pembuatan tekstur realistis kotoran dinding, ubin lantai retak, karat, dan kayu secara prosedural menggunakan HTML5 Canvas.
  - `js/map.js`: Level 3D dengan koridor, 4 ruangan tematik, properti furnitur, lampu berkedip, sistem tabrakan (*AABB collision*), dan penempatan item.
  - `js/player.js`: Kontrol sudut pandang orang pertama (FPS), Pointer Lock API, head bobbing, raycasting interaksi, dan manajemen baterai & stamina.
  - `js/monster.js`: AI State Machine (Patroli waypoint, deteksi pandangan & suara, mode kejar/chase, jumpscare sequence).
  - `js/game.js`: Pengatur alur utama permainan, siklus hidup render Three.js, notifikasi, transisi layar Game Over dan Kemenangan.
