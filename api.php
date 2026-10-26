<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function out(array $data, int $status=200): never { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function body(): array { $d=json_decode(file_get_contents('php://input'),true); return is_array($d)?$d:$_POST; }
function rupiah_int($v): int { return (int)round((float)$v); }
$action = $_GET['action'] ?? '';
try {
 if ($action === 'menu') {
   $rows=$pdo->query("SELECT m.id_menu AS id,m.nama_menu AS name,m.deskripsi AS description,m.harga AS price,m.gambar AS image,k.nama_kategori AS category FROM menu m LEFT JOIN kategori_menu k ON k.id_kategori=m.id_kategori WHERE m.aktif=1 ORDER BY m.id_menu")->fetchAll();
   out(['ok'=>true,'data'=>$rows]);
 }
 if ($action === 'create_order' && $_SERVER['REQUEST_METHOD']==='POST') {
   $d=body(); $name=trim((string)($d['name']??'')); $phone=trim((string)($d['phone']??'')); $note=trim((string)($d['note']??'')); $payment=(string)($d['payment']??'COD'); $items=$d['items']??[];
   if(mb_strlen($name)<2 || !preg_match('/^[0-9+\-\s]{9,16}$/',$phone)) out(['ok'=>false,'message'=>'Nama atau nomor telepon tidak valid.'],422);
   if(!in_array($payment,['COD','Transfer Bank','E-Wallet / QRIS'],true)) out(['ok'=>false,'message'=>'Metode pembayaran tidak valid.'],422);
   if(!is_array($items)||!count($items)||count($items)>40) out(['ok'=>false,'message'=>'Keranjang kosong atau terlalu banyak item.'],422);
   $ids=[]; foreach($items as $it){$id=(int)($it['id']??0);$qty=(int)($it['qty']??0);if($id<1||$qty<1||$qty>99)out(['ok'=>false,'message'=>'Item keranjang tidak valid.'],422);$ids[$id]=($ids[$id]??0)+$qty;}
   $pdo->beginTransaction();
   $lookup=$pdo->prepare('SELECT id_menu,nama_menu,harga FROM menu WHERE id_menu=? AND aktif=1');
   $valid=[];$subtotal=0;
   foreach($ids as $id=>$qty){$lookup->execute([$id]);$p=$lookup->fetch();if(!$p)throw new RuntimeException('Ada menu yang sudah tidak tersedia. Muat ulang halaman.');$price=(int)$p['harga'];$line=$price*$qty;$subtotal+=$line;$valid[]=['id'=>(int)$p['id_menu'],'name'=>$p['nama_menu'],'price'=>$price,'qty'=>$qty,'line'=>$line];}
   $tax=(int)round($subtotal*0.10);$total=$subtotal+$tax;$code='PS'.date('ymd').strtoupper(bin2hex(random_bytes(3)));
   $stmt=$pdo->prepare('INSERT INTO pesanan (kode_pesanan,nama_pelanggan,no_telepon,catatan,metode_pembayaran,status,subtotal,pajak,total) VALUES (?,?,?,?,?,?,?,?,?)');
   $stmt->execute([$code,$name,$phone,$note,$payment,'Diproses',$subtotal,$tax,$total]);$orderId=(int)$pdo->lastInsertId();
   $detail=$pdo->prepare('INSERT INTO detail_pesanan (id_pesanan,id_menu,nama_menu,harga_satuan,jumlah,subtotal) VALUES (?,?,?,?,?,?)');
   foreach($valid as $it)$detail->execute([$orderId,$it['id'],$it['name'],$it['price'],$it['qty'],$it['line']]);
   $pdo->commit();out(['ok'=>true,'message'=>'Pesanan berhasil disimpan.','order'=>['id'=>$orderId,'code'=>$code,'status'=>'Diproses','total'=>$total]]);
 }
 if ($action === 'reviews' && $_SERVER['REQUEST_METHOD'] === 'GET') {
   $rows=$pdo->query('SELECT id_ulasan AS id,nama AS name,rating,isi_ulasan AS text,dibuat_pada AS date FROM ulasan ORDER BY dibuat_pada DESC LIMIT 60')->fetchAll();
   out(['ok'=>true,'data'=>$rows]);
 }
 if ($action === 'reviews' && $_SERVER['REQUEST_METHOD'] === 'POST') {
   $d=body(); $name=trim((string)($d['name']??'')); $rating=(int)($d['rating']??0); $review=trim((string)($d['text']??''));
   if(mb_strlen($name)<2 || mb_strlen($name)>50) out(['ok'=>false,'message'=>'Nama harus terdiri dari 2–50 karakter.'],422);
   if($rating<1 || $rating>5) out(['ok'=>false,'message'=>'Pilih rating dari 1 sampai 5.'],422);
   if(mb_strlen($review)<10 || mb_strlen($review)>500) out(['ok'=>false,'message'=>'Ulasan harus terdiri dari 10–500 karakter.'],422);
   $st=$pdo->prepare('INSERT INTO ulasan (nama,rating,isi_ulasan) VALUES (?,?,?)'); $st->execute([$name,$rating,$review]);
   out(['ok'=>true,'message'=>'Ulasan berhasil disimpan.']);
 }
 if ($action === 'orders') {
   $phone=trim((string)($_GET['phone']??''));if(!preg_match('/^[0-9+\-\s]{9,16}$/',$phone))out(['ok'=>false,'message'=>'Masukkan nomor telepon yang valid.'],422);
   $s=$pdo->prepare('SELECT id_pesanan,kode_pesanan,nama_pelanggan,catatan,metode_pembayaran,status,subtotal,pajak,total,dibuat_pada FROM pesanan WHERE no_telepon=? ORDER BY dibuat_pada DESC LIMIT 100');$s->execute([$phone]);$rows=$s->fetchAll();
   $detail=$pdo->prepare('SELECT nama_menu AS name,harga_satuan AS price,jumlah AS qty,subtotal AS line_total FROM detail_pesanan WHERE id_pesanan=?');
   foreach($rows as &$o){$detail->execute([$o['id_pesanan']]);$o['items']=$detail->fetchAll();}unset($o);
   out(['ok'=>true,'data'=>$rows]);
 }
 out(['ok'=>false,'message'=>'Aksi API tidak dikenal.'],404);
} catch (Throwable $e) {
 if($pdo->inTransaction())$pdo->rollBack();
 $status=$e instanceof RuntimeException?422:500;
 out(['ok'=>false,'message'=>$e->getMessage()],$status);
}
