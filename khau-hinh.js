/* Khẩu hình của Tân: miệng đổi hình theo âm đang đọc, mắt chớp tự nhiên.
   Dùng chung cho trang Học mỗi ngày và các trang Trò chuyện cùng Tân. Không cần mạng, không tốn phí.
   9 hình miệng: X nghỉ, A há to, E bè ngang, O tròn, U chu môi, FV răng chạm môi dưới,
   TH lưỡi giữa hai răng, MBP mím môi, L lưỡi chạm lợi trên, S hai hàm răng khép. */
(function(){
"use strict";
if(window.KhauHinh) return;

/* Các hình miệng, vẽ quanh tâm miệng (cx, cy) của nhân vật */
function shapes(cx, cy){
  const L = "#7A3B2E", T = "#E8838A", W = "#FFFFFF";
  const x = n=>cx+n, y = n=>cy+n;
  return `<g class="kh" aria-hidden="true">
  <g class="kh-X"><path d="M${x(-8)} ${y(-2)} Q${cx} ${y(3)} ${x(8)} ${y(-2)}" fill="none" stroke="${L}" stroke-width="3.5" stroke-linecap="round"/></g>
  <g class="kh-A"><ellipse cx="${cx}" cy="${y(0)}" rx="10" ry="9" fill="${L}"/><rect x="${x(-7)}" y="${y(-9)}" width="14" height="3.5" rx="1.5" fill="${W}"/><ellipse cx="${cx}" cy="${y(5)}" rx="6" ry="3" fill="${T}"/></g>
  <g class="kh-E"><rect x="${x(-12)}" y="${y(-4)}" width="24" height="8" rx="4" fill="${L}"/><rect x="${x(-9)}" y="${y(-4)}" width="18" height="3" rx="1.2" fill="${W}"/></g>
  <g class="kh-O"><ellipse cx="${cx}" cy="${y(0)}" rx="7" ry="8.5" fill="${L}" stroke="${L}" stroke-width="2.5"/><ellipse cx="${cx}" cy="${y(4)}" rx="4" ry="2.4" fill="${T}"/></g>
  <g class="kh-U"><ellipse cx="${cx}" cy="${y(0)}" rx="4.6" ry="5" fill="${L}" stroke="${T}" stroke-width="3"/></g>
  <g class="kh-FV"><path d="M${x(-10)} ${y(1)} Q${cx} ${y(7)} ${x(10)} ${y(1)}" fill="${T}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/><rect x="${x(-7)}" y="${y(-3)}" width="14" height="4.5" rx="1.5" fill="${W}" stroke="${L}" stroke-width="1"/></g>
  <g class="kh-TH"><rect x="${x(-10)}" y="${y(-4)}" width="20" height="9" rx="4.5" fill="${L}"/><rect x="${x(-7)}" y="${y(-4)}" width="14" height="2.6" rx="1" fill="${W}"/><rect x="${x(-7)}" y="${y(2.4)}" width="14" height="2.6" rx="1" fill="${W}"/><ellipse cx="${cx}" cy="${y(1)}" rx="6" ry="2.6" fill="${T}"/></g>
  <g class="kh-MBP"><path d="M${x(-9)} ${y(0)} H${x(9)}" stroke="${L}" stroke-width="4.5" stroke-linecap="round"/></g>
  <g class="kh-L"><ellipse cx="${cx}" cy="${y(0)}" rx="9" ry="6.5" fill="${L}"/><ellipse cx="${cx}" cy="${y(-3)}" rx="4.5" ry="2.4" fill="${T}"/></g>
  <g class="kh-S"><rect x="${x(-10)}" y="${y(-3.5)}" width="20" height="7" rx="3.5" fill="${L}"/><rect x="${x(-8)}" y="${y(-2.5)}" width="16" height="5" rx="1.2" fill="${W}"/><path d="M${cx} ${y(-2.5)} V${y(2.5)}" stroke="#DDD" stroke-width="0.8"/></g>
  </g>`;
}

/* Kiểu dáng: chỉ hiện một hình miệng khi đang nói; mắt chớp bằng JS (ngẫu nhiên như người thật) */
const css = document.createElement("style");
css.textContent = `.kh{display:none}
.kh-on .kh{display:inline}.kh-on .kh>g{display:none}
.kh-on[data-kh="X"] .kh-X,.kh-on[data-kh="A"] .kh-A,.kh-on[data-kh="E"] .kh-E,.kh-on[data-kh="O"] .kh-O,.kh-on[data-kh="U"] .kh-U,
.kh-on[data-kh="FV"] .kh-FV,.kh-on[data-kh="TH"] .kh-TH,.kh-on[data-kh="MBP"] .kh-MBP,.kh-on[data-kh="L"] .kh-L,.kh-on[data-kh="S"] .kh-S{display:inline}
.kh-on .m-smile,.kh-on .m-open,.kh-on .m-o{display:none!important}
html.kh-js .blink{animation:none!important;transition:transform .06s}
html.kh-shut .blink{transform:scaleY(.1)}`;
(document.head || document.documentElement).appendChild(css);

/* Chữ cái sang hình miệng (gần đúng theo cách đọc, đủ để em nhìn thấy môi tròn, răng chạm môi, lưỡi giữa răng) */
const DIG = [["th","TH"],["sh","S"],["ch","S"],["ph","FV"],["oo","U"],["ee","E"],["ea","E"],["ou","O"],["ow","O"],["aw","O"],["ng","L"],["wh","U"],["qu","U"],["ck","E"],["gh",""]];
const ONE = {a:"A",e:"E",i:"E",y:"E",o:"O",u:"O",w:"U",q:"U",r:"U",f:"FV",v:"FV",m:"MBP",b:"MBP",p:"MBP",l:"L",n:"L",t:"L",d:"L",s:"S",z:"S",c:"S",j:"S",x:"S",g:"E",k:"E",h:"A"};
function wordVis(w, vi){
  w = w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/g,"d").replace(/[^a-z]/g,"");
  if(!vi && w.length > 3 && /[^aeiou]e$/.test(w)) w = w.slice(0,-1); // e câm cuối từ
  const out = [];
  for(let i=0;i<w.length;){
    let v = null;
    for(const [d,m] of DIG) if(w.startsWith(d, i)){ v = m; i += 2; break; }
    if(v === null){ v = ONE[w[i]] || "E"; i++; }
    if(vi && v === "TH") v = "L"; // tiếng Việt "th" là âm bật hơi, không đặt lưỡi giữa răng
    if(v && out[out.length-1] !== v) out.push(v);
  }
  return out.length ? out : ["A"];
}

/* Mỗi lần nói là một "lượt". Lượt mới thay lượt cũ, nên khi câu trước bị ngắt, miệng không bị kẹt. */
let cur = null, seq = 0;
function setV(el, v){ if(el && el.getAttribute("data-kh") !== v) el.setAttribute("data-kh", v); }
function start(el, text, lang, rate){
  stop();
  if(!el || !text) return 0;
  const vi = lang === "vi";
  const words = String(text).split(/\s+/).filter(Boolean);
  const vis = words.map(w=>wordVis(w, vi));
  const per = (vi ? 70 : 82) / (rate || (vi ? 1 : 0.85)); // thời gian mỗi hình miệng, mili giây
  const gap = 55 / (rate || 1);
  const t0 = performance.now();
  cur = {id: ++seq, el, vis, per, gap, word: 0, wStart: t0, t0, started: false, seenSpeaking: false, timer: 0};
  el.classList.add("kh-on"); setV(el, "X");
  const c = cur;
  const total = vis.reduce((s,v)=>s + v.length*per + gap, 0);
  c.timer = setInterval(()=>{
    if(cur !== c){ clearInterval(c.timer); return; }
    if(!c.el.isConnected){ stop(); return; }
    const now = performance.now();
    const ss = window.speechSynthesis;
    if(ss && ss.speaking) c.seenSpeaking = true;
    // giọng đọc đã dừng hẳn: khép miệng
    if(ss && c.seenSpeaking && !ss.speaking && !ss.pending && now - c.t0 > 600){ stop(c.id); return; }
    if(now - c.t0 > total*2.5 + 4000){ stop(c.id); return; }
    if(c.word >= c.vis.length){ setV(c.el, "X"); return; }
    const v = c.vis[c.word], k = Math.floor((now - c.wStart) / c.per);
    if(k < v.length){ setV(c.el, v[k]); return; }
    setV(c.el, "X");
    // không có tín hiệu từng từ: tự sang từ tiếp theo theo thời gian ước tính
    if(!c.bounds && now - c.wStart >= v.length*c.per + c.gap){ c.word++; c.wStart = now; }
  }, 40);
  return c.id;
}
/* Giọng đọc báo đang ở từ thứ mấy: đặt miệng về đầu từ đó cho khớp */
function boundary(charIndex, text){
  if(!cur) return;
  const upto = String(text||"").slice(0, charIndex).trim();
  const n = upto ? upto.split(/\s+/).length : 0;
  cur.bounds = true;
  if(n < cur.vis.length){ cur.word = n; cur.wStart = performance.now(); }
}
function stop(id){
  if(!cur || (id && cur.id !== id)) return;
  clearInterval(cur.timer);
  if(cur.el){ cur.el.classList.remove("kh-on"); cur.el.removeAttribute("data-kh"); }
  cur = null;
}

/* Gắn vào giọng đọc của điện thoại để nhận tín hiệu từng từ */
const ss = window.speechSynthesis;
if(ss && !ss.__kh){
  try{
    const orig = ss.speak.bind(ss);
    ss.speak = function(u){
      if(cur && u && u.addEventListener){
        const id = cur.id;
        u.addEventListener("boundary", e=>{ if(cur && cur.id === id && e.name !== "sentence") boundary(e.charIndex, u.text); });
      }
      return orig(u);
    };
    ss.__kh = true;
  }catch(e){}
}

/* Chớp mắt ngẫu nhiên 2 đến 6 giây một lần, thỉnh thoảng chớp hai lần liền */
let blinking = false;
function blinkLoop(){
  if(blinking) return; blinking = true;
  if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const root = document.documentElement; root.classList.add("kh-js");
  const once = (after)=>{ root.classList.add("kh-shut"); setTimeout(()=>{ root.classList.remove("kh-shut"); after && after(); }, 110); };
  const next = ()=>setTimeout(()=>{
    if(document.hidden){ next(); return; }
    once(Math.random() < 0.2 ? ()=>setTimeout(()=>once(), 160) : null);
    next();
  }, 2000 + Math.random()*4000);
  next();
}
blinkLoop();

window.KhauHinh = {shapes, start, stop, boundary, wordVis};
})();
