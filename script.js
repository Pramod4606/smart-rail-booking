// Stations data
const stations = [
  { id: 'PUN', name: 'Pune' },
  { id: 'NAS', name: 'Nashik' },
  { id: 'MUM', name: 'Mumbai' },
  { id: 'NAG', name: 'Nagpur' },
  { id: 'GOA', name: 'Goa (Madgaon)' }
];

// Distances between adjacent stations (in km)
const between = [210, 160, 820, 430]; // Pune->Nashik, Nashik->Mumbai, Mumbai->Nagpur, Nagpur->Goa

// Fare per km
const pricePerKm = { nonac: 1.2, ac: 2.6 };

// Platform mapping (demo)
const platformMap = {};
stations.forEach((s,i)=> platformMap[s.id] = (i % 6) + 1);

// Helper to compute distance
function computeDistance(fromIdx, toIdx){
  if(fromIdx === toIdx) return 0;
  let a = Math.min(fromIdx,toIdx), b=Math.max(fromIdx,toIdx);
  let sum=0;
  for(let i=a;i<b;i++) sum += between[i];
  return sum;
}

// Select elements
const fromSel = document.getElementById('from');
const toSel = document.getElementById('to');
const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const classEl = document.getElementById('class');
const qtyEl = document.getElementById('qty');
const promoEl = document.getElementById('promo');
const summaryEl = document.getElementById('summary');
const estimateBtn = document.getElementById('estimateBtn');
const bookBtn = document.getElementById('bookBtn');
const saveBtn = document.getElementById('saveBtn');
const stationsEl = document.getElementById('stations');

// Populate dropdowns and station list
function populateSelects(){
  stations.forEach((s,i)=>{
    const opt1 = document.createElement('option'); opt1.value = i; opt1.textContent = s.name; fromSel.appendChild(opt1);
    const opt2 = document.createElement('option'); opt2.value = i; opt2.textContent = s.name; toSel.appendChild(opt2);

    // station panel left side
    const div = document.createElement('div'); div.className='station';
    div.innerHTML = `<div><strong>${s.name}</strong><div class='muted'>${s.id}</div></div><div class='muted'>Platform ${platformMap[s.id]}</div>`;
    div.addEventListener('click', ()=>{
      if(fromSel.value === '') fromSel.value = i;
      else if(toSel.value === '') toSel.value = i;
    });
    stationsEl.appendChild(div);
  });
}

// Promo code logic
function applyPromo(total, promo){
  if(!promo) return { total, discount:0, note:'No promo' };
  const p = promo.trim().toUpperCase();
  if(p === 'SAVE10') return { total: +(total*0.9).toFixed(2), discount: +(total*0.1).toFixed(2), note:'SAVE10 applied (10% off)'};
  if(p === 'FLAT50') return { total: Math.max(0, +(total-50).toFixed(2)), discount:50, note:'FLAT50 applied' };
  return { total, discount:0, note:'Invalid promo' };
}

// Estimate Price function
function estimate(){
  const fi = parseInt(fromSel.value), ti = parseInt(toSel.value);
  if(Number.isNaN(fi) || Number.isNaN(ti)) { summaryEl.textContent = 'Please select both From and To stations.'; return null; }
  if(fi === ti){ summaryEl.textContent = 'From and To cannot be same.'; return null; }

  const distance = computeDistance(fi,ti);
  const cls = classEl.value; const qty = Math.max(1, parseInt(qtyEl.value)||1);
  const baseFare = +(distance * pricePerKm[cls]);
  const taxes = +(baseFare * 0.05); // 5% demo tax
  const subtotal = +(baseFare + taxes);
  const promo = applyPromo(subtotal, promoEl.value);
  const total = +(promo.total * qty).toFixed(2);

  const out = {
    from: stations[fi].name,
    fromCode: stations[fi].id,
    to: stations[ti].name,
    toCode: stations[ti].id,
    distance: Math.round(distance)+ ' km',
    platformFrom: platformMap[stations[fi].id],
    platformTo: platformMap[stations[ti].id],
    class: cls === 'ac' ? 'AC' : 'Non-AC',
    qty,
    farePerPassenger: +(promo.total).toFixed(2),
    taxes: +(taxes).toFixed(2),
    total,
    note: promo.note
  };

  summaryEl.textContent = `From: ${out.from} (${out.fromCode}) — Platform ${out.platformFrom}\nTo: ${out.to} (${out.toCode}) — Platform ${out.platformTo}\nClass: ${out.class}\nDistance: ${out.distance}\nPassengers: ${out.qty}\nFare (per pax): ₹${out.farePerPassenger}\nTaxes (per pax approx): ₹${out.taxes}\nPromo: ${out.note}\n\nTotal: ₹${out.total}`;
  return out;
}

// Event listeners
estimateBtn.addEventListener('click', estimate);

// Save booking
saveBtn.addEventListener('click', ()=>{
  const ticket = estimate();
  if(!ticket) return;
  const payload = { id: 'BK'+Date.now(), created: new Date().toISOString(), ticket };
  const all = JSON.parse(localStorage.getItem('rail_demo_bookings')||'[]');
  all.push(payload); localStorage.setItem('rail_demo_bookings', JSON.stringify(all));
  alert('Saved booking to localStorage.');
});

// Generate Ticket button
bookBtn.addEventListener('click', () => {
  const ticket = estimate(); // First calculate price
  if(!ticket) return;

  const id = 'TKT'+Date.now();
  const booking = {
    id,
    from: ticket.from,
    fromCode: ticket.fromCode,
    to: ticket.to,
    toCode: ticket.toCode,
    class: ticket.class,
    qty: ticket.qty,
    farePerPassenger: ticket.farePerPassenger,
    total: ticket.total,
    date: dateEl.value || new Date().toISOString().slice(0,10),
    time: timeEl.value || new Date().toTimeString().slice(0,5)
  };

  const w = window.open('','_blank','width=420,height=640');
  const html = `<!doctype html>
<html>
<head>
<meta charset='utf-8'>
<title>Ticket ${booking.id}</title>
<style>
body{font-family:Arial;background:#fff;color:#111;padding:20px}
h2{margin:6px 0}
pre{white-space:pre-wrap;font-size:14px}
button{padding:6px 10px;margin-top:12px;cursor:pointer}
</style>
</head>
<body>
<h2>Railway Ticket</h2>
<pre>
PNR: ${booking.id}
From: ${booking.from} (${booking.fromCode}) — Platform ${ticket.platformFrom}
To: ${booking.to} (${booking.toCode}) — Platform ${ticket.platformTo}
Class: ${booking.class}
Passengers: ${booking.qty}
Fare (per pax): ₹${booking.farePerPassenger}
Total: ₹${booking.total}
Date: ${booking.date}  Time: ${booking.time}
</pre>
<button onclick='window.print()'>Print Ticket</button>
</body>
</html>`;
  w.document.write(html);
  w.document.close();
});

// Initialize
populateSelects();
const today = new Date().toISOString().slice(0,10);
dateEl.min = today; dateEl.value = today;
timeEl.value = '09:00';
fromSel.selectedIndex = 0; toSel.selectedIndex = 1;