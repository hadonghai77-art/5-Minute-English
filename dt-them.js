/* Thêm cho các trang "Trò chuyện cùng Tân":
   - ghi lại các câu em đã nói, cuối buổi xem lại từng câu và nghe câu đúng;
   - Tân chọn MỘT điều cần sửa nhất, lưu vào máy để hiện ở trang Thi đua;
   - trang có nhiều hơn 2 tình huống (nhập vai) cũng chuyển cảnh được;
   - kết quả 3 mức có tiếng báo riêng: đúng, gần đúng, chưa đúng;
   - đo tốc độ nói (từ mỗi phút) và chỗ ngắt dài khi em nói bằng micro;
   - Tân mấp máy môi theo âm (khau-hinh.js) và chớp mắt tự nhiên;
   - nút Gợi ý câu trả lời và nút Dịch câu này khi tắt nghĩa tiếng Việt;
   - nhận xét lịch sự: nhắc khi câu mẫu có please, thank you, excuse me... mà em quên. */
(function(){
"use strict";
if(typeof judge !== "function" || typeof SCENES === "undefined") return;
let said = [], pace = null, hinted = -1;
const _judge = judge, _choose = choose, _finish = finish, _load = loadScene, _speak = speak, _stopAll = stopAll, _showTurn = showTurn, _sayChar = sayChar;
const day = ()=> Math.floor((Date.now() - new Date().getTimezoneOffset()*60000) / 86400000);
const e = s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tu = s=> SCENES[sceneIx].look==="teacher" ? s : s.replace(/\bEm\b/g,"Bạn").replace(/\bem\b/g,"bạn");

/* ---------- Khẩu hình và chớp mắt ---------- */
function installMouth(){
  const g = document.getElementById("charg");
  if(!g || !window.KhauHinh || g.querySelector(".kh")) return;
  const head = g.querySelector(".head");
  if(head) head.insertAdjacentHTML("beforeend", KhauHinh.shapes(80, 110));
}
if(!window.KhauHinh){
  const sc = document.createElement("script"); sc.src = "khau-hinh.js"; sc.onload = installMouth;
  document.head.appendChild(sc);
}else installMouth();
window.speak = function(text, who, act, done, lang){
  let id = 0;
  if(who === "char" && window.KhauHinh){
    installMouth();
    id = KhauHinh.start(document.getElementById("charg"), text, lang === "vi" ? "vi" : "en", lang === "vi" ? 1 : 0.85);
  }
  const d = done;
  return _speak(text, who, act, id ? ()=>{ KhauHinh.stop(id); d && d(); } : d, lang);
};
window.stopAll = function(){ if(window.KhauHinh) KhauHinh.stop(); return _stopAll(); };

window.loadScene = function(i){
  said = []; pace = null; hinted = -1;
  _load(i);
  installMouth();
  document.querySelectorAll(".scenes .chip").forEach(b=>b.setAttribute("aria-pressed", b.id === "sc"+i));
};

/* ---------- Tiếng báo 3 mức (không cần file âm thanh) ---------- */
let actx = null;
function tone(kind){
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === "ok" ? [[660,0],[880,.11]] : kind === "near" ? [[523,0],[587,.12]] : [[330,0],[262,.14]];
    notes.forEach(([f,at])=>{
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + at;
      o.type = kind === "bad" ? "triangle" : "sine"; o.frequency.value = f; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .2);
      o.start(t); o.stop(t + .22);
    });
  }catch(err){}
}

/* ---------- Tốc độ nói: đo từ lúc em bắt đầu nói đến khi máy nghe xong ---------- */
const SRc = window.SpeechRecognition || window.webkitSpeechRecognition;
if(SRc && SRc.prototype && !SRc.prototype.__pace){
  const os = SRc.prototype.start;
  SRc.prototype.start = function(){
    let t0 = 0, prev = 0, pauses = 0;
    this.addEventListener("speechstart", ()=>{ if(!t0) t0 = performance.now(); });
    this.addEventListener("result", ev=>{
      const now = performance.now();
      if(!t0) t0 = now - 400;
      if(prev && now - prev > 1200) pauses++;
      prev = now;
      let t = ""; for(let i=0;i<ev.results.length;i++) t += ev.results[i][0].transcript + " ";
      const words = t.trim().split(/\s+/).filter(Boolean).length, sec = Math.max(0.6, (now - t0 - 250)/1000);
      pace = {at: Date.now(), words, wpm: Math.round(words/sec*60), pauses};
    });
    return os.apply(this, arguments);
  };
  SRc.prototype.__pace = true;
}
/* câu gõ bằng bàn phím thì không tính tốc độ nói */
document.addEventListener("click", ev=>{ if(ev.target && ev.target.id === "send") pace = null; }, true);
document.addEventListener("keydown", ev=>{ if(ev.target && ev.target.id === "typed") pace = null; }, true);
/* Học sinh nên nói khoảng 80 đến 130 từ mỗi phút */
function paceInfo(p){
  if(!p || p.words < 3) return null;
  const w = p.wpm;
  const lv = w < 60 ? ["bad","hơi chậm","Em nói liền mạch hơn, đừng dừng sau từng từ."]
    : w < 80 ? ["near","hơi chậm một chút","Em nói liền các từ trong một cụm, ví dụ: my new school."]
    : w <= 130 ? ["ok","vừa phải","Tốc độ rất tốt, dễ nghe."]
    : w <= 160 ? ["near","hơi nhanh","Em chậm lại một chút cho rõ từng từ."]
    : ["bad","nhanh quá","Em nói chậm lại, rõ từng từ."];
  return {wpm: w, pauses: p.pauses, level: lv[0], label: lv[1], tip: p.pauses >= 2 ? "Em ngập ngừng " + p.pauses + " lần. Em đọc thầm câu một lần rồi nói liền một hơi nhé." : lv[2]};
}
const LV = {ok:"🟢", near:"🟡", bad:"🟠"};

/* ---------- Lịch sự ---------- */
const POLITE = /\b(please|thank you|thanks|excuse me|sorry|pardon|could you|would you|can you|could i|can i|may i|would you like|i'd like|i would like|you're welcome|nice to meet you)\b/;
const lowq = s=>String(s||"").toLowerCase().replace(/[’`]/g,"'");
function politeGap(model, raw){
  const m = lowq(model).match(POLITE);
  if(!m || POLITE.test(lowq(raw))) return null;
  return m[1];
}

/* ---------- Ghi lại câu em nói, chấm 3 mức ---------- */
window.judge = function(raw){
  let st = null;
  try{
    const t = SCENES[sceneIx].turns[turn], r = evaluate(raw, t);
    st = r.status;
    if(r.status !== "empty"){
      const p = pace && Date.now() - pace.at < 6000 ? pace : null;
      said.push({turn, q: fill(t.en), raw, model: fill(r.model), st: r.status, notes: r.notes || [], pace: p, hint: hinted === turn});
    }
  }catch(err){}
  pace = null;
  const out = _judge(raw);
  try{
    if(st && st !== "empty"){
      tone(st === "ok" ? "ok" : st === "near" ? "near" : "bad");
      const x = said[said.length-1], pi = paceInfo(x && x.pace), fbs = document.querySelectorAll("#panel .feedback"), fb = fbs[fbs.length-1];
      if(fb){
        const lvl = st === "ok" ? "🟢 Tốt" : st === "near" ? "🟡 Gần đúng" : "🟠 Cần luyện thêm";
        fb.insertAdjacentHTML("afterbegin", `<span class="dt-lv">${lvl}</span> `);
        if(pi) fb.insertAdjacentHTML("beforeend", `<span class="dt-pace">⏱ ${pi.wpm} từ/phút, ${e(pi.label)}${pi.pauses ? `, ngắt dài ${pi.pauses} lần` : ""}</span>`);
      }
    }
  }catch(err){}
  return out;
};
window.choose = function(k, btn){
  try{
    const t = SCENES[sceneIx].turns[turn], o = t.opts[k];
    said.push({turn, q: fill(t.en), raw: fill(o.en), model: fill(o.ok ? o.en : t.say[0]), st: o.ok ? "pick" : "wrong", notes: o.ok ? [] : [o.why], picked:true});
    tone(o.ok ? "ok" : "bad");
  }catch(err){}
  return _choose(k, btn);
};

/* ---------- Gợi ý câu trả lời ---------- */
window.showTurn = function(){
  const out = _showTurn();
  try{
    const t = SCENES[sceneIx].turns[turn], pick = document.getElementById("pick");
    if(pick && !document.getElementById("dtHint")){
      const b = document.createElement("button"); b.className = "link"; b.id = "dtHint"; b.textContent = "💡 Gợi ý câu trả lời";
      pick.parentNode.insertBefore(b, pick);
      b.onclick = ()=>{
        hinted = turn;
        const seen = new Set(), list = [];
        for(const s of t.say){ const f = fill(s); if(!seen.has(f.toLowerCase())){ seen.add(f.toLowerCase()); list.push(f); } if(list.length >= 3) break; }
        const okOpt = (t.opts||[]).find(o=>o.ok);
        const viOf = s=>{ const o = (t.opts||[]).find(o=>o.ok && norm(fill(o.en)) === norm(s)); return o ? fill(o.vi||"") : ""; };
        const box = document.createElement("div"); box.className = "dt-sug"; box.id = "dtSug";
        box.innerHTML = `<b>💡 Em có thể nói:</b>${list.map((s,i)=>{ const vi = viOf(s) || (i===0 && okOpt ? fill(okOpt.vi||"") : "");
          return `<div class="dt-sugi"><button class="mini" data-s="${e(s)}" aria-label="Nghe câu gợi ý">🔊</button><span><span class="dt-sugen">${e(s)}</span>${vi ? `<span class="vi">${e(vi)}</span>` : ""}</span></div>`; }).join("")}
          <span class="dt-sugnote">${e(tu("Em bấm micro và tự nói một câu nhé. Đổi vài từ cho đúng với em thì càng tốt."))}</span>`;
        b.replaceWith(box);
        box.querySelectorAll("[data-s]").forEach(x=>x.onclick = ()=>speak(x.dataset.s, "me", null, null));
      };
    }
  }catch(err){}
  return out;
};

/* ---------- Dịch câu này (khi đã tắt nghĩa tiếng Việt để luyện nghe) ---------- */
(function(){
  const bar = document.querySelector(".toolbar"), cb = document.getElementById("vi"), bubble = document.getElementById("bubble");
  if(!bar || !cb || !bubble || document.getElementById("dtTr")) return;
  const b = document.createElement("button"); b.className = "mini"; b.id = "dtTr"; b.textContent = "🇻🇳 Dịch câu này"; b.hidden = cb.checked;
  const againBtn = document.getElementById("again"); bar.insertBefore(b, againBtn || null);
  const tip = document.createElement("p"); tip.className = "dt-trtip"; tip.textContent = "Mẹo: tắt nghĩa tiếng Việt để luyện nghe, khi chưa hiểu thì bấm “Dịch câu này”.";
  bar.insertAdjacentElement("afterend", tip);
  cb.addEventListener("change", ()=>{ b.hidden = cb.checked; bubble.classList.remove("show-vi"); b.textContent = "🇻🇳 Dịch câu này"; });
  b.onclick = ()=>{ const on = bubble.classList.toggle("show-vi"); b.textContent = on ? "Ẩn nghĩa" : "🇻🇳 Dịch câu này"; };
})();
window.sayChar = function(line){
  const bubble = document.getElementById("bubble"), b = document.getElementById("dtTr");
  if(bubble) bubble.classList.remove("show-vi"); if(b) b.textContent = "🇻🇳 Dịch câu này";
  return _sayChar(line);
};

/* điều cần sửa nhất: lỗi lặp lại nhiều nhất, nếu không thì lỗi đầu tiên; không có lỗi thì xem lịch sự, rồi tốc độ */
function oneThing(polite, paceAll){
  const bad = said.filter(x=>x.st === "wrong" || x.st === "near");
  if(!bad.length){
    if(polite.miss.length){ const x = polite.miss[0]; return {note: `Em nhớ nói “${x.word}” như câu mẫu cho lịch sự.`, model: x.model, times: polite.miss.length}; }
    if(paceAll && paceAll.level !== "ok") return {note: `Em nói ${paceAll.label} (khoảng ${paceAll.wpm} từ mỗi phút). ${paceAll.tip}`, model: (said.find(x=>x.pace)||{}).model || "", times: 1};
    return null;
  }
  const cnt = {};
  bad.forEach(x=>x.notes.slice(0,1).forEach(n=>{ cnt[n] = (cnt[n]||0) + 1; }));
  const note = Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0] || "";
  const ex = bad.find(x=>x.notes[0] === note) || bad[0];
  return {note: note.replace(/^Câu em nói chưa đúng ý\.\s*/,""), model: ex.model, times: cnt[note] || 1};
}
function remember(fix, paceAll){
  try{
    const K = "hmn-v1", S0 = JSON.parse(localStorage.getItem(K) || "{}");
    S0.fixes = (S0.fixes || []).slice(-29);
    const src = (document.querySelector(".eyebrow")||{}).textContent || document.title;
    S0.fixes.push({d: day(), src: src.replace(/ · Bài tập tình huống| · Nhập vai/,"") + " · " + SCENES[sceneIx].chip, t: fix ? fix.note : "", ex: fix ? fix.model : "", ok: !fix});
    S0.talks = (S0.talks || 0) + 1;
    if(paceAll){ S0.paceLog = S0.paceLog || {}; const pl = S0.paceLog[day()] || [0,0]; pl[0] += paceAll.wpm; pl[1]++; S0.paceLog[day()] = pl; }
    localStorage.setItem(K, JSON.stringify(S0));
  }catch(err){}
}

/* liên kết sang trang "Nói tự do với Tân" cùng lớp, cùng bài */
const ntd = (()=>{ const f = location.pathname.split("/").pop();
  let m = f.match(/^lop-(\d+)-unit-(\d+)-doi-thoai\.html$/); if(m) return `noi-tu-do.html?lop=${m[1]}&u=${m[2]}`;
  m = f.match(/^lop-(\d+)-doi-thoai-tan\.html$/); if(m) return `noi-tu-do.html?lop=${m[1]}&u=1`;
  if(f === "doi-thoai-tan.html") return "noi-tu-do.html?lop=6&u=1";
  return ""; })();
if(ntd){ const hb = document.querySelector(".homebar"); if(hb && !document.getElementById("dtFreeTop")){ const a = document.createElement("a"); a.id = "dtFreeTop"; a.href = ntd; a.textContent = "🗣️ Nói tự do"; a.style.marginLeft = "8px"; hb.appendChild(a); } }

window.finish = function(){
  _finish();
  const panel = document.getElementById("panel");
  // trang nhập vai có nhiều tình huống: nút sang tình huống tiếp theo
  if(sceneIx > 0 && sceneIx < SCENES.length - 1 && !document.getElementById("nx")){
    const row = panel.querySelector(".row");
    if(row){ const b = document.createElement("button"); b.className = "mini"; b.id = "nx"; b.textContent = "Sang tình huống tiếp: " + SCENES[sceneIx+1].chip; b.onclick = ()=>loadScene(sceneIx+1); row.appendChild(b); }
  }
  const mine = said.filter(x=>x.st !== "empty");
  // lịch sự: chỉ xét câu em tự nói (không xét câu chọn sẵn)
  const polite = {need:0, miss:[], used:0};
  mine.forEach(x=>{ if(x.picked) return; if(POLITE.test(lowq(x.raw))) polite.used++;
    if(POLITE.test(lowq(x.model))){ polite.need++; const w = politeGap(x.model, x.raw); if(w){ x.polite = w; polite.miss.push({word:w, model:x.model}); } } });
  // tốc độ trung bình của các câu nói bằng micro
  const ps = mine.map(x=>x.pace).filter(p=>p && p.words >= 3);
  const paceAll = ps.length ? paceInfo({words: 99, wpm: Math.round(ps.reduce((s,p)=>s+p.wpm,0)/ps.length), pauses: ps.reduce((s,p)=>s+p.pauses,0)}) : null;
  const fix = oneThing(polite, paceAll);
  remember(fix, paceAll);
  const box = document.createElement("div");
  box.className = "dt-review";
  box.innerHTML = `<h2 style="margin-top:6px">Xem lại câu em đã nói</h2>
    ${mine.length ? `<ol class="dt-list">${mine.map((x,i)=>`<li class="${x.st==="ok"||x.st==="pick" ? "ok" : x.st}">
      <span class="dt-ic">${x.st==="ok" ? "🟢" : x.st==="pick" ? "☑️" : x.st==="near" ? "🟡" : "🟠"}</span>
      <span><span class="dt-said">${x.picked ? "Em chọn" : "Em nói"}: “${e(x.raw)}”${x.hint ? ` <span class="dt-tag">💡 có xem gợi ý</span>` : ""}</span>
      ${x.st==="ok"||x.st==="pick" ? "" : `<span class="dt-note">${e(tu(x.notes.join(" ")))}</span><span class="dt-good">Câu đúng: <b>${e(x.model)}</b></span>`}
      ${x.polite ? `<span class="dt-pol">${e(tu(`🤝 Câu mẫu có “${x.polite}”. Em thêm vào cho lịch sự hơn.`))}</span>` : ""}
      ${paceInfo(x.pace) ? `<span class="dt-pace">⏱ ${paceInfo(x.pace).wpm} từ/phút, ${e(paceInfo(x.pace).label)}${x.pace.pauses ? `, ngắt dài ${x.pace.pauses} lần` : ""}</span>` : ""}
      <button class="mini dt-say" data-i="${i}">🔊 Nghe câu đúng</button></span></li>`).join("")}</ol>
      <p class="dt-legend">🟢 Tốt · 🟡 Gần đúng · 🟠 Cần luyện thêm · ☑️ Chọn câu có sẵn</p>`
      : `<p class="note">Em chưa nói câu nào.</p>`}
    ${paceAll ? `<div class="dt-box"><b>⏱ Tốc độ nói</b><span>${LV[paceAll.level]} Trung bình ${paceAll.wpm} từ mỗi phút: ${e(paceAll.label)}.${paceAll.pauses ? ` Ngắt dài ${paceAll.pauses} lần.` : ""}</span><span class="dt-small">${e(tu(paceAll.tip))} Học sinh nên nói khoảng 80 đến 130 từ mỗi phút.</span></div>` : ""}
    ${polite.need || polite.used ? `<div class="dt-box"><b>🤝 Lịch sự</b><span>${polite.miss.length === 0 ? "🟢 " + e(tu("Em nói rất lịch sự.")) : polite.miss.length === 1 ? "🟡 " + e(tu(`Em quên “${polite.miss[0].word}” 1 lần.`)) : "🟠 " + e(tu(`Em quên từ lịch sự ${polite.miss.length} lần.`))}${polite.used ? ` ${e(tu(`Em đã dùng từ lịch sự ${polite.used} lần.`))}` : ""}</span>
      <span class="dt-small">${e(tu("Khi nhờ, hỏi hay cảm ơn, người nói tiếng Anh hay dùng: please, could you, excuse me, thank you, sorry."))}</span></div>` : ""}
    <div class="dt-one"><b>🎯 Một điều cần sửa nhất</b><span id="dtOne"></span></div>
    ${ntd ? `<a class="dt-free" href="${ntd}">🗣️ Nói tự do với Tân về chủ đề này</a>` : ""}`;
  panel.appendChild(box);
  const oneTxt = fix
    ? `${fix.times > 1 ? `Lỗi này em gặp ${fix.times} lần. ` : ""}${fix.note}${fix.model ? ` Lần sau em nhớ nói: “${fix.model}”` : ""}`
    : "Em không có lỗi nào cần sửa. Lần sau em thử tự nói, không chọn câu có sẵn, và nói nhanh hơn một chút nhé.";
  box.querySelector("#dtOne").textContent = tu(oneTxt);
  box.querySelectorAll(".dt-say").forEach(b=>b.onclick = ()=>{ const x = mine[+b.dataset.i]; speak(x.model, "me", null, null); });
  // Tân nói điều cần sửa nhất bằng tiếng Việt, sau lời chào cuối
  setTimeout(()=>{ if(document.getElementById("dtOne")) speak(tu(fix ? "Một điều cần sửa nhất: " + fix.note : "Hôm nay em nói rất tốt!"), "char", "open", null, "vi"); }, 4200);
};
if(!document.getElementById("dt-css")){
  const st = document.createElement("style"); st.id = "dt-css";
  st.textContent = `.dt-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.dt-list li{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;padding:9px 10px;background:var(--bg)}
.dt-list li>span:last-child{display:flex;flex-direction:column;gap:4px;min-width:0}
.dt-ic{flex:none}.dt-said{font-size:14.5px}.dt-note{font-size:13.5px;color:var(--bad)}.dt-good{font-size:14.5px}
.dt-say{align-self:flex-start}
.dt-free{display:block;text-align:center;margin-top:10px;padding:12px 14px;border-radius:12px;background:var(--sun);color:#2A2206;font-weight:600;text-decoration:none}
.dt-one,.dt-box{background:var(--sun-soft);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;font-size:14.5px;margin-top:8px}
.dt-box{background:var(--bg);border:1px solid var(--line)}
.dt-small,.dt-legend{font-size:12.5px;color:var(--muted)}.dt-legend{margin:6px 0 0}
.dt-pace,.dt-pol{display:block;font-size:13px;margin-top:3px}.dt-pol{color:var(--ink)}
.dt-lv{font-weight:700}.dt-tag{font-size:12px;color:var(--muted)}
.dt-sug{display:flex;flex-direction:column;gap:6px;border:1.5px dashed var(--sun);border-radius:12px;padding:10px 12px;font-size:14.5px}
.dt-sugi{display:flex;gap:8px;align-items:flex-start}.dt-sugi>span{display:flex;flex-direction:column;min-width:0}.dt-sugen{font-weight:600}
.dt-sugnote,.dt-trtip{font-size:12.5px;color:var(--muted);margin:0}
.hide-vi .show-vi .vi{display:block}`;
  document.head.appendChild(st);
}
// gắn nút cho tình huống thứ 3 trở đi
SCENES.forEach((sc,k)=>{ const b = document.getElementById("sc"+k); if(b && k > 1){ b.textContent = sc.chip; b.onclick = ()=>loadScene(k); } });
})();
