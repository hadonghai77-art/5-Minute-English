/* Thêm cho các trang "Trò chuyện cùng Tân":
   - ghi lại các câu em đã nói, cuối buổi xem lại từng câu và nghe câu đúng;
   - Tân chọn MỘT điều cần sửa nhất, lưu vào máy để hiện ở trang Thi đua;
   - trang có nhiều hơn 2 tình huống (nhập vai) cũng chuyển cảnh được. */
(function(){
"use strict";
if(typeof judge !== "function" || typeof SCENES === "undefined") return;
let said = [];
const _judge = judge, _choose = choose, _finish = finish, _load = loadScene;
const day = ()=> Math.floor((Date.now() - new Date().getTimezoneOffset()*60000) / 86400000);
const e = s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tu = s=> SCENES[sceneIx].look==="teacher" ? s : s.replace(/\bEm\b/g,"Bạn").replace(/\bem\b/g,"bạn");

window.loadScene = function(i){
  said = [];
  _load(i);
  document.querySelectorAll(".scenes .chip").forEach(b=>b.setAttribute("aria-pressed", b.id === "sc"+i));
};
window.judge = function(raw){
  try{
    const t = SCENES[sceneIx].turns[turn], r = evaluate(raw, t);
    if(r.status !== "empty") said.push({turn, q: fill(t.en), raw, model: fill(r.model), st: r.status, notes: r.notes || []});
  }catch(err){}
  return _judge(raw);
};
window.choose = function(k, btn){
  try{
    const t = SCENES[sceneIx].turns[turn], o = t.opts[k];
    said.push({turn, q: fill(t.en), raw: fill(o.en), model: fill(o.ok ? o.en : t.say[0]), st: o.ok ? "pick" : "wrong", notes: o.ok ? [] : [o.why], picked:true});
  }catch(err){}
  return _choose(k, btn);
};

/* điều cần sửa nhất: lỗi lặp lại nhiều nhất, nếu không thì lỗi đầu tiên */
function oneThing(){
  const bad = said.filter(x=>x.st === "wrong" || x.st === "near");
  if(!bad.length) return null;
  const cnt = {};
  bad.forEach(x=>x.notes.slice(0,1).forEach(n=>{ cnt[n] = (cnt[n]||0) + 1; }));
  const note = Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0] || "";
  const ex = bad.find(x=>x.notes[0] === note) || bad[0];
  return {note: note.replace(/^Câu em nói chưa đúng ý\.\s*/,""), model: ex.model, times: cnt[note] || 1};
}
function remember(fix){
  try{
    const K = "hmn-v1", S0 = JSON.parse(localStorage.getItem(K) || "{}");
    S0.fixes = (S0.fixes || []).slice(-29);
    const src = (document.querySelector(".eyebrow")||{}).textContent || document.title;
    S0.fixes.push({d: day(), src: src.replace(/ · Bài tập tình huống| · Nhập vai/,"") + " · " + SCENES[sceneIx].chip, t: fix ? fix.note : "", ex: fix ? fix.model : "", ok: !fix});
    S0.talks = (S0.talks || 0) + 1;
    localStorage.setItem(K, JSON.stringify(S0));
  }catch(err){}
}

window.finish = function(){
  _finish();
  const panel = document.getElementById("panel");
  // trang nhập vai có nhiều tình huống: nút sang tình huống tiếp theo
  if(sceneIx > 0 && sceneIx < SCENES.length - 1 && !document.getElementById("nx")){
    const row = panel.querySelector(".row");
    if(row){ const b = document.createElement("button"); b.className = "mini"; b.id = "nx"; b.textContent = "Sang tình huống tiếp: " + SCENES[sceneIx+1].chip; b.onclick = ()=>loadScene(sceneIx+1); row.appendChild(b); }
  }
  const fix = oneThing();
  remember(fix);
  const mine = said.filter(x=>x.st !== "empty");
  const box = document.createElement("div");
  box.className = "dt-review";
  box.innerHTML = `<h2 style="margin-top:6px">Xem lại câu em đã nói</h2>
    ${mine.length ? `<ol class="dt-list">${mine.map((x,i)=>`<li class="${x.st==="ok"||x.st==="pick" ? "ok" : x.st}">
      <span class="dt-ic">${x.st==="ok" ? "✅" : x.st==="pick" ? "☑️" : x.st==="near" ? "🟡" : "✏️"}</span>
      <span><span class="dt-said">${x.picked ? "Em chọn" : "Em nói"}: “${e(x.raw)}”</span>
      ${x.st==="ok"||x.st==="pick" ? "" : `<span class="dt-note">${e(tu(x.notes.join(" ")))}</span><span class="dt-good">Câu đúng: <b>${e(x.model)}</b></span>`}
      <button class="mini dt-say" data-i="${i}">🔊 Nghe câu đúng</button></span></li>`).join("")}</ol>`
      : `<p class="note">Em chưa nói câu nào.</p>`}
    <div class="dt-one"><b>🎯 Một điều cần sửa nhất</b><span id="dtOne"></span></div>`;
  panel.appendChild(box);
  const oneTxt = fix
    ? `${fix.times > 1 ? `Lỗi này em gặp ${fix.times} lần. ` : ""}${fix.note} Lần sau em nhớ nói: “${fix.model}”`
    : "Em không có lỗi nào cần sửa. Lần sau em thử tự nói, không chọn câu có sẵn, và nói nhanh hơn một chút nhé.";
  box.querySelector("#dtOne").textContent = tu(oneTxt);
  box.querySelectorAll(".dt-say").forEach(b=>b.onclick = ()=>{ const x = mine[+b.dataset.i]; speak(x.model, "me", null, null); });
  if(!document.getElementById("dt-css")){
    const st = document.createElement("style"); st.id = "dt-css";
    st.textContent = `.dt-list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px}
.dt-list li{display:flex;gap:8px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;padding:9px 10px;background:var(--bg)}
.dt-list li>span:last-child{display:flex;flex-direction:column;gap:4px;min-width:0}
.dt-ic{flex:none}.dt-said{font-size:14.5px}.dt-note{font-size:13.5px;color:var(--bad)}.dt-good{font-size:14.5px}
.dt-say{align-self:flex-start}
.dt-one{background:var(--sun-soft);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;font-size:14.5px;margin-top:8px}`;
    document.head.appendChild(st);
  }
  // Tân nói điều cần sửa nhất bằng tiếng Việt, sau lời chào cuối
  setTimeout(()=>{ if(document.getElementById("dtOne")) speak(tu(fix ? "Một điều cần sửa nhất: " + fix.note : "Hôm nay em nói rất tốt!"), "char", "open", null, "vi"); }, 4200);
};
// gắn nút cho tình huống thứ 3 trở đi
SCENES.forEach((sc,k)=>{ const b = document.getElementById("sc"+k); if(b && k > 1){ b.textContent = sc.chip; b.onclick = ()=>loadScene(k); } });
})();
