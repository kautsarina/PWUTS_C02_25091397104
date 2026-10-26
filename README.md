Kafe-in — Bagian Homepage, Ulasan, dan Status Pesanan 

Bagian ini mempertahankan tiga navigasi yang menjadi tanggung jawab saya setelah ppembagian dengan kelompok saya: Beranda, Ulasan, dan Status Pesanan. Tidak ada navigasi menu atau checkout di bagian ini, karena sudah dikerjakan oleh teman saya bagian konfirmasi pembayaran saya gabungkan dengan status pesanan karena pada poin c diminta ada formulir sesuai kebutuhan transaksi 

# Implementasi
- `index.html` menjadi homepage/layout utama.
- Navigasi bawah responsif berisi Beranda, Ulasan, dan Status Pesanan.
- Halaman Ulasan dan Status Pesanan dimuat dengan Fetch API (AJAX), tanpa memuat ulang layout utama.
- Form ulasan divalidasi JavaScript (nama 2–50 karakter, rating 1–5, ulasan 10–500 karakter) dan dikirim melalui HTTP POST ke `api.php`, lalu disimpan ke tabel `ulasan`.
- Status dan riwayat pesanan diambil melalui HTTP GET dari `api.php` dan database `kafein_db`, bukan dari data contoh di JavaScript.
- `style.css` mengatur tampilan responsif untuk desktop dan HP.

# Cara Penggunaan
1. Buat salinan/backup database sebelum mengubah struktur tabel.
2. Ekstrak/simpan folder ini ke `C:\xampp\htdocs\PWUTS_C02_25091397104`.
3. Jalankan Apache dan MySQL/MariaDB di XAMPP.
4. Pastikan database `kafein_db` dan tabel `pesanan`, `detail_pesanan`, `menu`, serta `kategori_menu` sudah ada. Jika belum, tinjau `database.sql` dan impor ke database yang benar. File SQL membuat tabel dengan `IF NOT EXISTS`; tetap lakukan backup terlebih dahulu.
5. Impor bagian tabel `ulasan` dari `database.sql` jika tabel tersebut belum ada.
6. Periksa `config.php`; pengaturan default adalah database `kafein_db`, user `root`, password kosong (standar XAMPP).
7. Buka `http://localhost/PWUTS_C02_25091397104/`. Jangan membuka HTML langsung dengan double-click karena fitur AJAX/PHP membutuhkan server.

# Pengujian
- Ulasan: buka navigasi Ulasan, isi seluruh kolom, lalu kirim. Ulasan yang valid seharusnya muncul setelah tersimpan di database.
- Validasi: coba nama kurang dari 2 karakter atau ulasan kurang dari 10 karakter. Form harus menolak input tersebut.
- Status Pesanan: masukkan nomor telepon yang tercatat pada tabel `pesanan`. Hasil menampilkan kode, status, item, dan total pesanan.
- Jika status kosong, pastikan nomor telepon persis sama dengan data transaksi.


