-- Kafe-in: skema database baru dengan nama database yang SUDAH ADA: kafein_db
-- Jalankan di phpMyAdmin setelah memilih database kafein_db.
-- Jika database sudah memiliki tabel bernama sama, backup terlebih dahulu dan jangan jalankan
-- sebelum struktur tabel lama diperiksa.

CREATE TABLE IF NOT EXISTS kategori_menu (
  id_kategori INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama_kategori VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu (
  id_menu INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_kategori INT UNSIGNED NULL,
  nama_menu VARCHAR(120) NOT NULL,
  deskripsi VARCHAR(255) NULL,
  harga INT UNSIGNED NOT NULL,
  gambar VARCHAR(255) NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_menu_kategori FOREIGN KEY (id_kategori) REFERENCES kategori_menu(id_kategori)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pesanan (
  id_pesanan BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  kode_pesanan VARCHAR(24) NOT NULL UNIQUE,
  nama_pelanggan VARCHAR(120) NOT NULL,
  no_telepon VARCHAR(20) NOT NULL,
  catatan TEXT NULL,
  metode_pembayaran ENUM('COD','Transfer Bank','E-Wallet / QRIS') NOT NULL DEFAULT 'COD',
  status ENUM('Diproses','Selesai','Dibatalkan') NOT NULL DEFAULT 'Diproses',
  subtotal INT UNSIGNED NOT NULL,
  pajak INT UNSIGNED NOT NULL DEFAULT 0,
  total INT UNSIGNED NOT NULL,
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pesanan_telepon (no_telepon),
  INDEX idx_pesanan_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detail_pesanan (
  id_detail BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_pesanan BIGINT UNSIGNED NOT NULL,
  id_menu INT UNSIGNED NULL,
  nama_menu VARCHAR(120) NOT NULL,
  harga_satuan INT UNSIGNED NOT NULL,
  jumlah SMALLINT UNSIGNED NOT NULL,
  subtotal INT UNSIGNED NOT NULL,
  CONSTRAINT fk_detail_pesanan FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_detail_menu FOREIGN KEY (id_menu) REFERENCES menu(id_menu)
    ON UPDATE CASCADE ON DELETE SET NULL,
  INDEX idx_detail_order (id_pesanan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO kategori_menu (nama_kategori) VALUES ('Kopi'),('Non-Kopi'),('Camilan');

-- Data demo ditambahkan hanya jika nama menu tersebut belum ada.
INSERT INTO menu (id_kategori,nama_menu,deskripsi,harga)
SELECT k.id_kategori,'Kopi Latte','Espresso lembut dengan susu creamy.',18000 FROM kategori_menu k
WHERE k.nama_kategori='Kopi' AND NOT EXISTS (SELECT 1 FROM menu WHERE nama_menu='Kopi Latte') LIMIT 1;
INSERT INTO menu (id_kategori,nama_menu,deskripsi,harga)
SELECT k.id_kategori,'Es Kopi Susu','Kopi susu segar dengan gula aren.',16000 FROM kategori_menu k
WHERE k.nama_kategori='Kopi' AND NOT EXISTS (SELECT 1 FROM menu WHERE nama_menu='Es Kopi Susu') LIMIT 1;
INSERT INTO menu (id_kategori,nama_menu,deskripsi,harga)
SELECT k.id_kategori,'Americano','Espresso dengan rasa tegas.',14000 FROM kategori_menu k
WHERE k.nama_kategori='Kopi' AND NOT EXISTS (SELECT 1 FROM menu WHERE nama_menu='Americano') LIMIT 1;
INSERT INTO menu (id_kategori,nama_menu,deskripsi,harga)
SELECT k.id_kategori,'Matcha Latte','Matcha lembut dengan susu segar.',22000 FROM kategori_menu k
WHERE k.nama_kategori='Non-Kopi' AND NOT EXISTS (SELECT 1 FROM menu WHERE nama_menu='Matcha Latte') LIMIT 1;
INSERT INTO menu (id_kategori,nama_menu,deskripsi,harga)
SELECT k.id_kategori,'Chocolate Milk','Cokelat creamy untuk teman santai.',19000 FROM kategori_menu k
WHERE k.nama_kategori='Non-Kopi' AND NOT EXISTS (SELECT 1 FROM menu WHERE nama_menu='Chocolate Milk') LIMIT 1;
INSERT INTO menu (id_kategori,nama_menu,deskripsi,harga)
SELECT k.id_kategori,'Roti Bakar Cokelat','Roti hangat dengan cokelat lumer.',12000 FROM kategori_menu k
WHERE k.nama_kategori='Camilan' AND NOT EXISTS (SELECT 1 FROM menu WHERE nama_menu='Roti Bakar Cokelat') LIMIT 1;
INSERT INTO menu (id_kategori,nama_menu,deskripsi,harga)
SELECT k.id_kategori,'Croissant','Pastry renyah dengan lapisan buttery.',15000 FROM kategori_menu k
WHERE k.nama_kategori='Camilan' AND NOT EXISTS (SELECT 1 FROM menu WHERE nama_menu='Croissant') LIMIT 1;
INSERT INTO menu (id_kategori,nama_menu,deskripsi,harga)
SELECT k.id_kategori,'Kentang Goreng','Camilan gurih untuk menemani kopi.',17000 FROM kategori_menu k
WHERE k.nama_kategori='Camilan' AND NOT EXISTS (SELECT 1 FROM menu WHERE nama_menu='Kentang Goreng') LIMIT 1;


-- Tabel untuk fitur ulasan pada bagian tugas ini.
CREATE TABLE IF NOT EXISTS ulasan (
  id_ulasan BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(50) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  isi_ulasan VARCHAR(500) NOT NULL,
  dibuat_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_ulasan_rating CHECK (rating BETWEEN 1 AND 5),
  INDEX idx_ulasan_tanggal (dibuat_pada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
