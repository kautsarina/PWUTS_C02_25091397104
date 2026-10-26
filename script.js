(() => {
  'use strict';
  const content = document.getElementById('page-content');
  const hero = document.querySelector('.hero');
  const toast = document.getElementById('toast');
  const navLinks = [...document.querySelectorAll('[data-page]')];
  let toastTimer;
  const api = (url, options={}) => fetch(url, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers||{}) } }).then(async response => {
    let data; try { data = await response.json(); } catch (_) { throw new Error('Server tidak mengirim respons JSON. Periksa api.php.'); }
    if (!response.ok || data.ok === false) throw new Error(data.message || 'Permintaan gagal.');
    return data;
  });
  function safeText(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function showToast(message) { if (!toast) return; toast.textContent=message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2800); }
  function setActive(page) { navLinks.forEach(a=>{const yes=a.dataset.page===page;a.classList.toggle('active',yes);if(yes)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}); }
  function bindPageLinks() { document.querySelectorAll('[data-page]').forEach(a=>{if(a.dataset.bound==='1')return;a.dataset.bound='1';a.addEventListener('click',e=>{e.preventDefault();loadPage(a.dataset.page);window.scrollTo({top:0,behavior:'smooth'});});}); }
  async function loadPage(page, updateHash=true) {
    if(!['beranda','ulasan','pesanan'].includes(page)) page='beranda';
    setActive(page); document.body.classList.toggle('subpage-open',page!=='beranda'); if(hero)hero.hidden=page!=='beranda';
    if(updateHash && location.hash!==`#${page}`) history.pushState({page},'',`#${page}`);
    if(page==='beranda') {
      content.innerHTML='<div class="home-extra"><div class="section-title"><div><div class="kicker">SELAMAT DATANG DI KAFE-IN</div><h2>Ruang kecil untuk <em>cerita besar.</em></h2></div><p>Jelajahi pengalaman pelanggan atau periksa pesananmu melalui navigasi di bawah.</p></div><div class="home-shortcuts"><a class="shortcut-card" href="#ulasan" data-page="ulasan"><span class="shortcut-icon">☆</span><strong>Baca & tulis ulasan</strong><span>Bagikan pengalamanmu bersama Kafe-in →</span></a><a class="shortcut-card" href="#pesanan" data-page="pesanan"><span class="shortcut-icon">▤</span><strong>Cek status pesanan</strong><span>Lihat status dan riwayat pesanan →</span></a></div></div>';
      bindPageLinks(); return;
    }
    content.innerHTML='<div class="loading" role="status">Memuat halaman...</div>';
    try { const res=await fetch(`pages/${page}.html`,{headers:{'X-Requested-With':'fetch'}}); if(!res.ok)throw new Error('Halaman tidak ditemukan.'); content.innerHTML=await res.text(); if(page==='ulasan')initReviews(); if(page==='pesanan'){initOrderLookup();initTransactionForm();} bindPageLinks(); }
    catch(err){content.innerHTML=`<div class="empty error-state">${safeText(err.message)} Jalankan website melalui localhost/Live Server.</div>`;}
  }
  async function initReviews() {
    const form=document.getElementById('reviewForm'), grid=document.getElementById('reviewGrid'), msg=document.getElementById('reviewMessage'); if(!form||!grid)return;
    const render=rows=>{const samples=[{name:'Rani A.',rating:5,text:'Tempat yang nyaman untuk menikmati kopi dan mengerjakan tugas.'},{name:'Dimas P.',rating:5,text:'Rasa kopinya enak, suasananya juga tenang dan menyenangkan.'}]; const list=[...(rows||[]),...samples]; grid.innerHTML=list.map(r=>`<article class="review-card"><div class="review-stars" aria-label="Rating ${Number(r.rating)} dari 5">${'★'.repeat(Number(r.rating))}${'☆'.repeat(5-Number(r.rating))}</div><p>“${safeText(r.text)}”</p><strong>${safeText(r.name)}</strong><small>${r.date?safeText(r.date):'Pelanggan Kafe-in'}</small></article>`).join('');};
    try {const data=await api('api.php?action=reviews');render(data.data);} catch(e){grid.innerHTML=`<div class="empty">Ulasan dari server belum dapat dimuat. ${safeText(e.message)} Pastikan database dan tabel <code>ulasan</code> sudah disiapkan.</div>`;}
    form.addEventListener('submit',async e=>{e.preventDefault();const name=document.getElementById('reviewName').value.trim(),rating=Number(document.getElementById('reviewRating').value),text=document.getElementById('reviewText').value.trim();
      if(name.length<2||name.length>50){msg.textContent='Nama harus terdiri dari 2–50 karakter.';return;} if(!Number.isInteger(rating)||rating<1||rating>5){msg.textContent='Silakan pilih rating 1 sampai 5.';return;} if(text.length<10||text.length>500){msg.textContent='Ulasan harus terdiri dari 10–500 karakter.';return;}
      const btn=form.querySelector('button[type="submit"]');btn.disabled=true;try{const result=await api('api.php?action=reviews',{method:'POST',body:JSON.stringify({name,rating,text})});msg.textContent=result.message;form.reset();const latest=await api('api.php?action=reviews');render(latest.data);showToast('Ulasan berhasil disimpan');}catch(err){msg.textContent=`Gagal menyimpan ulasan: ${err.message}`;}finally{btn.disabled=false;}
    });
  }
  function initOrderLookup() {
    const form=document.getElementById('orderSearch'),input=document.getElementById('searchPhone'),result=document.getElementById('orders');if(!form||!input||!result)return;
    form.addEventListener('submit',async e=>{e.preventDefault();const phone=input.value.replace(/[\s-]/g,'').trim();if(!/^[0-9+()]{8,20}$/.test(phone)){result.innerHTML='<div class="empty">Masukkan nomor telepon yang valid (8–20 karakter).</div>';return;}
      result.innerHTML='<div class="empty">Mencari pesanan...</div>';try{const data=await api(`api.php?action=orders&phone=${encodeURIComponent(phone)}`);const orders=data.data||[];if(!orders.length){result.innerHTML='<div class="empty">Pesanan dengan nomor tersebut belum ditemukan. Pastikan nomor telepon sama dengan nomor saat transaksi.</div>';return;}
        result.innerHTML=orders.map(o=>{const status=String(o.status||'Diproses'),statusClass=status==='Selesai'?'status-done':status==='Dibatalkan'?'status-cancelled':'status-process';const items=(o.items||[]).map(i=>`<li><span>${safeText(i.name)} × ${Number(i.qty)}</span><strong>Rp${Number(i.line_total||0).toLocaleString('id-ID')}</strong></li>`).join('');return `<article class="order-card"><div class="order-card-head"><div><small>KODE PESANAN</small><strong>${safeText(o.kode_pesanan)}</strong></div><span class="order-status ${statusClass}">${safeText(status)}</span></div><p class="order-date">${safeText(o.dibuat_pada||'')}</p><h4>Pesanan sebelumnya</h4><ul class="order-items">${items||'<li>Detail item tidak tersedia.</li>'}</ul><div class="order-total"><span>Total</span><strong>Rp${Number(o.total||0).toLocaleString('id-ID')}</strong></div></article>`;}).join('');
      }catch(err){result.innerHTML=`<div class="empty">Tidak dapat mengambil status pesanan dari server. ${safeText(err.message)} Pastikan Apache, MySQL, dan database <code>kafein_db</code> aktif.</div>`;}
    });
  }

  async function initTransactionForm() {
    const form=document.getElementById('transactionForm'); if(!form)return;
    const menuSelect=document.getElementById('transactionMenu'),qtyInput=document.getElementById('transactionQty'),totalEl=document.getElementById('transactionTotal'),msg=document.getElementById('transactionMessage');
    let menuItems=[];
    const formatRp=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
    try { const response=await api('api.php?action=menu'); menuItems=response.data||[]; menuSelect.innerHTML='<option value="">Pilih menu</option>'+menuItems.map(m=>`<option value="${Number(m.id)}">${safeText(m.name)} — ${formatRp(m.price)}</option>`).join(''); if(!menuItems.length)menuSelect.innerHTML='<option value="">Menu belum tersedia di database</option>'; }
    catch(err){menuSelect.innerHTML='<option value="">Gagal memuat menu</option>';msg.textContent='Menu tidak dapat dimuat: '+err.message;}
    const selected=()=>menuItems.find(m=>Number(m.id)===Number(menuSelect.value));
    const updateTotal=()=>{const item=selected(),qty=Math.max(1,Math.min(99,Number(qtyInput.value)||1));totalEl.textContent=item?`Subtotal: ${formatRp(Number(item.price)*qty)} · Pajak 10% dihitung saat pesanan disimpan.`:'Pilih menu untuk melihat harga.';};
    menuSelect.addEventListener('change',updateTotal);qtyInput.addEventListener('input',updateTotal);
    form.addEventListener('submit',async e=>{e.preventDefault();msg.textContent='';const name=document.getElementById('transactionName').value.trim(),phone=document.getElementById('transactionPhone').value.trim(),item=selected(),qty=Number(qtyInput.value),payment=document.getElementById('transactionPayment').value,note=document.getElementById('transactionNote').value.trim();
      if(name.length<2||name.length>120){msg.textContent='Nama harus terdiri dari 2–120 karakter.';return;}
      if(!/^[0-9+\-\s]{9,16}$/.test(phone)){msg.textContent='Nomor telepon harus terdiri dari 9–16 karakter angka atau tanda +/-. ';return;}
      if(!item){msg.textContent='Silakan pilih menu yang tersedia.';return;}
      if(!Number.isInteger(qty)||qty<1||qty>99){msg.textContent='Jumlah harus antara 1–99.';return;}
      const button=form.querySelector('button[type="submit"]');button.disabled=true;button.textContent='Mengirim...';
      try{const result=await api('api.php?action=create_order',{method:'POST',body:JSON.stringify({name,phone,note,payment,items:[{id:Number(item.id),qty}]})});msg.textContent=`${result.message} Kode pesanan: ${result.order.code}. Total: ${formatRp(result.order.total)}.`;form.reset();qtyInput.value='1';updateTotal();showToast('Pesanan berhasil dikirim');}
      catch(err){msg.textContent='Pesanan gagal dikirim: '+err.message;}finally{button.disabled=false;button.textContent='Kirim Pesanan';}
    });
  }

  window.addEventListener('popstate',()=>loadPage(location.hash.slice(1)||'beranda',false)); bindPageLinks(); loadPage(location.hash.slice(1)||'beranda',false);
})();
