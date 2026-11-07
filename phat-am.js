/* Phát âm cho người Việt: phiên âm, trọng âm, mẹo sửa âm.
   Dữ liệu cách đọc ở phat-am-du-lieu.js (tải khi cần). Không cần mạng, không cần máy chủ. */
(function(){
if(window.PhatAm) return;
const VOW = /^(AA|AE|AH|AO|AW|AY|EH|ER|EY|IH|IY|OW|OY|UH|UW)/;
const IPA = {AA:"ɑː",AE:"æ",AH:"ʌ",AO:"ɔː",AW:"aʊ",AY:"aɪ",EH:"e",ER:"ɜːr",EY:"eɪ",IH:"ɪ",IY:"iː",OW:"oʊ",OY:"ɔɪ",UH:"ʊ",UW:"uː",
  B:"b",CH:"tʃ",D:"d",DH:"ð",F:"f",G:"g",HH:"h",JH:"dʒ",K:"k",L:"l",M:"m",N:"n",NG:"ŋ",P:"p",R:"r",S:"s",SH:"ʃ",T:"t",TH:"θ",V:"v",W:"w",Y:"j",Z:"z",ZH:"ʒ"};
const ONSET2 = /^(p r|t r|k r|b r|d r|g r|f r|th r|sh r|p l|k l|b l|g l|f l|s l|s p|s t|s k|s m|s n|s w|t w|k w|d w|p y|b y|k y|f y|m y|hh y|v y)$/;
const VOICELESS = /^(P|T|K|F|TH|S|SH|CH)$/;

let loading = null;
function src(name){
  const me = [...document.scripts].find(s=>/phat-am\.js/.test(s.src||""));
  return me ? me.src.replace(/phat-am\.js.*$/, name) : name;
}
function load(){
  if(window.TD_AM) return Promise.resolve();
  if(loading) return loading;
  loading = new Promise(res=>{ const s = document.createElement("script"); s.src = src("phat-am-du-lieu.js"); s.onload = res; s.onerror = res; document.head.appendChild(s); });
  return loading;
}

function clean(w){ return String(w||"").toLowerCase().replace(/[’`]/g,"'").replace(/^[^a-z']+|[^a-z']+$/g,""); }
function lookup(w){
  const D = window.TD_AM || {};
  if(D[w]) return D[w];
  const base = w.replace(/'s$/,"");
  return D[base] || "";
}
function info(word){
  const w = clean(word), raw = lookup(w);
  if(!raw) return {w, ipa:"", syl:[], st:-1, ph:[], known:false};
  const [p, sy] = raw.split("|"), ph = p.split(" ");
  const vowels = []; ph.forEach((x,i)=>{ if(VOW.test(x)) vowels.push(i); });
  let st = vowels.findIndex(i=>/1$/.test(ph[i])); if(st < 0) st = 0;
  // phiên âm IPA, có dấu trọng âm ˈ trước âm tiết được nhấn
  let mark = -1;
  if(vowels.length > 1){
    const vi = vowels[st], prev = st > 0 ? vowels[st-1] : -1;
    const cons = ph.slice(prev+1, vi).map(x=>x.replace(/\d/,""));
    if(prev < 0 || cons.length === 0) mark = prev < 0 ? 0 : vi;
    else if(cons.length === 1) mark = vi - 1;
    else mark = ONSET2.test(cons.slice(-2).join(" ").toLowerCase()) ? vi - 2 : vi - 1;
  }
  let ipa = "";
  ph.forEach((x,i)=>{
    if(i === mark) ipa += "ˈ";
    const b = x.replace(/\d/,""), s0 = /0$/.test(x);
    ipa += b==="AH" && s0 ? "ə" : b==="ER" && s0 ? "ər" : b==="IY" && s0 && i===ph.length-1 ? "i" : IPA[b] || "";
  });
  // fire, tired, our: hai nguyên âm liền nhau, người học nghe như một âm tiết, không cần nói trọng âm
  const glide = vowels.length === 2 && vowels[1] === vowels[0] + 1;
  return {w, ipa:"/" + ipa + "/", syl: sy ? sy.split("-") : [], st: vowels.length > 1 && !glide ? st : -1, ph, known:true, nv: vowels.length};
}
const esc = s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* veg·e·ta·bles với âm tiết nhấn in đậm, viết hoa */
function stressHTML(word){
  const I = info(word);
  if(I.st < 0) return "";
  if(I.syl.length) return I.syl.map((s,i)=> i===I.st ? `<b class="pa-st">${esc(s.toUpperCase())}</b>` : `<span>${esc(s)}</span>`).join('<i class="pa-dot">·</i>');
  return "";
}
function stressText(word){
  const I = info(word);
  if(I.st < 0) return "";
  if(I.syl.length) return `Nhấn mạnh âm tiết thứ ${I.st+1}: “${I.syl[I.st]}”.`;
  return `Nhấn mạnh âm tiết thứ ${I.st+1} (chỗ có dấu ˈ trong phiên âm).`;
}

/* Các lỗi phát âm người Việt hay gặp, xếp theo mức quan trọng */
const KINDS = {
  th:   {t:"Âm /θ/ (th không rung)", d:"Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi nhẹ. Không đọc thành “t” hay “th” tiếng Việt.", short:"âm th không rung"},
  dh:   {t:"Âm /ð/ (th có rung)", d:"Đặt đầu lưỡi giữa hai hàm răng, vừa thổi hơi vừa rung cổ họng. Không đọc thành “d” hay “đ”.", short:"âm th có rung"},
  ed:   {t:"Đuôi -ed", d:"", short:"đuôi -ed"},
  s:    {t:"Âm /s/, /z/ ở cuối", d:"Đừng bỏ âm “s” ở cuối từ. Nó cho biết số nhiều (two books) hoặc ngôi thứ ba (she likes).", short:"âm s ở cuối từ"},
  end:  {t:"Âm cuối", d:"Người Việt hay nuốt mất âm cuối, em nhớ đọc rõ ra. Nếu từ sau bắt đầu bằng nguyên âm thì nối âm cuối sang.", short:"âm cuối của từ"},
  cl:   {t:"Cụm phụ âm", d:"Đọc liền các phụ âm, không chèn “ơ” vào giữa. Ví dụ “school” là /skuːl/, không phải “sờ-cun”.", short:"cụm phụ âm"},
  st:   {t:"Trọng âm", d:"", short:"trọng âm của từ"},
  sh:   {t:"Âm /ʃ/", d:"Chu môi ra trước, đẩy hơi như khi bảo người khác “suỵt”. Khác với âm /s/ (see và she).", short:"âm sh"},
  z:    {t:"Âm /z/", d:"Giống /s/ nhưng rung cổ họng, như tiếng ong kêu “zzz”. Không đọc thành “d” tiếng Việt.", short:"âm z"},
  dj:   {t:"Âm /dʒ/", d:"Giống “ch” nhưng rung cổ họng (job, orange). Không đọc thành “gi” hay “d”.", short:"âm dʒ"},
  l:    {t:"Âm /l/ ở cuối", d:"Kết thúc bằng đầu lưỡi chạm lợi trên. Không đọc thành “u” và không bỏ đi.", short:"âm l ở cuối"},
  ae:   {t:"Âm /æ/", d:"Mở miệng rộng, kéo khóe miệng sang hai bên, đọc lai giữa “a” và “e” (cat, bag).", short:"âm æ"},
  ii:   {t:"Âm /iː/ dài và /ɪ/ ngắn", d:"", short:"âm i dài và i ngắn"},
  v:    {t:"Âm /v/", d:"Răng trên chạm nhẹ môi dưới, thổi hơi và rung cổ. Không đọc thành “b” hay “ph”.", short:"âm v"},
  r:    {t:"Âm /r/", d:"Cong lưỡi về phía sau, lưỡi không chạm vòm miệng, không rung lưỡi.", short:"âm r"}
};
const ORDER = ["th","dh","ed","s","end","cl","st","sh","z","dj","l","ae","ii","v","r"];
const VN_END_OK = /^(M|N|NG|R|IY|EY|AY|OW|AW|OY|UW)$/; // âm cuối tiếng Việt cũng có, ít khi sai

function tipsFor(word){
  const I = info(word), w = I.w, out = {};
  const add = (k, d)=>{ if(!out[k]) out[k] = Object.assign({k}, KINDS[k], d ? {d} : {}); };
  if(!I.known){
    if(/th/.test(w)) add("th", "Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi. Không đọc thành “t”, “th” hay “d” tiếng Việt.");
    if(/ed$/.test(w) && w.length > 4) add("ed", "Đọc rõ đuôi -ed: /t/, /d/ hoặc /ɪd/ (sau t, d).");
    else if(/[^aeiouy]s$/.test(w)) add("s");
    else if(/[bcdfgkptvxz]$/.test(w)) add("end", `Đọc rõ âm cuối “${w.slice(-1)}”. Người Việt hay nuốt mất âm cuối.`);
    return ORDER.filter(k=>out[k]).map(k=>out[k]);
  }
  const b = I.ph.map(x=>x.replace(/\d/,"")), n = b.length, last = b[n-1];
  if(b.includes("TH")) add("th");
  if(b.includes("DH")) add("dh");
  if(/ed$/.test(w) && w.length > 3 && (last==="D"||last==="T")){
    const prev = b[n-2];
    if(prev==="IH"||prev==="AH") add("ed", `Ở từ “${w}”, đuôi -ed đọc là /ɪd/ (thêm một âm tiết) vì trước nó là âm /t/ hoặc /d/.`);
    else if(last==="T") add("ed", `Ở từ “${w}”, đuôi -ed đọc là /t/ (gần như “t” nhẹ) vì trước nó là âm không rung. Không đọc thành “ét”.`);
    else add("ed", `Ở từ “${w}”, đuôi -ed đọc là /d/ (rung nhẹ) ở cuối. Không đọc thành “ét”, cũng đừng bỏ đi.`);
  }
  if((last==="S"||last==="Z") && n > 1 && !VOW.test(b[n-2])) add("s");
  else if((last==="S"||last==="Z") && /s$/.test(w)) add("s");
  if(!VN_END_OK.test(last) && !VOW.test(last) && !out.ed && !out.s){
    add(last==="L" ? "l" : "end", last==="L" ? null : `Đọc rõ âm cuối /${IPA[last]}/ của từ “${w}”. Người Việt hay nuốt mất âm cuối, em nhớ bật âm này ra.`);
  }
  const lead = []; for(const x of b){ if(VOW.test(x)) break; lead.push(x); }
  let tail = []; for(let i=n-1;i>=0;i--){ if(VOW.test(b[i])) break; tail.unshift(b[i]); }
  if(lead.length >= 2) add("cl", `Đọc liền /${lead.map(x=>IPA[x]).join("")}/ ở đầu từ “${w}”, không chèn “ơ” vào giữa.`);
  else if(tail.length >= 2 && !(tail.length===2 && /^(R|N|M|L)$/.test(tail[0]) && !out.s)) add("cl", `Đọc liền /${tail.map(x=>IPA[x]).join("")}/ ở cuối từ “${w}”, không bỏ âm nào.`);
  if(I.st >= 0){
    const s = I.syl.length ? `“${I.syl[I.st].toUpperCase()}”` : `thứ ${I.st+1}`;
    add("st", `Từ “${w}” có ${I.nv} âm tiết. Nhấn mạnh âm tiết ${s}: đọc to hơn, dài hơn. Các âm tiết khác đọc nhẹ và nhanh.`);
  }
  if(b.includes("SH")) add("sh");
  if(b.slice(0,-1).includes("Z") || (b.includes("Z") && !out.s)) add("z");
  if(b.includes("JH")) add("dj");
  const sv = I.ph.find(x=>/^(IY|IH)1/.test(x));
  if(sv) add("ii", sv.startsWith("IY") ? `Âm “i” trong “${w}” là /iː/ dài: kéo dài ra, miệng cười nhẹ (như sheep).` : `Âm “i” trong “${w}” là /ɪ/ ngắn: đọc gọn, nhanh, hơi giống “ê” (như ship).`);
  if(I.ph.some(x=>/^AE1/.test(x))) add("ae");
  if(b.includes("V")) add("v");
  if(b[0]==="R") add("r");
  return ORDER.filter(k=>out[k]).map(k=>out[k]);
}
function tips(word, max){ return tipsFor(word).slice(0, max || 2); }

/* Từ một danh sách từ đọc sai, chọn MỘT điều cần sửa nhất */
function top(words){
  const cnt = {}, ex = {};
  words.forEach(w=>{ tipsFor(w).slice(0,3).forEach((t,i)=>{ cnt[t.k] = (cnt[t.k]||0) + (3 - i); (ex[t.k] = ex[t.k] || []).push(clean(w)); }); });
  const ks = Object.keys(cnt).sort((a,b)=> cnt[b]-cnt[a] || ORDER.indexOf(a)-ORDER.indexOf(b));
  if(!ks.length) return null;
  const k = ks[0], words2 = [...new Set(ex[k])].slice(0,3);
  const first = tipsFor(words2[0]).find(t=>t.k===k);
  return {k, t:KINDS[k].t, short:KINDS[k].short, d:first ? first.d : KINDS[k].d, words:words2};
}

const CSS = `.pa-st{color:var(--bad,#C2452D);font-weight:800}.pa-dot{font-style:normal;opacity:.45;margin:0 1px}
.pa-tip{background:var(--sun-soft,#FFF1C9);border-radius:10px;padding:8px 10px;font-size:14px;line-height:1.45;margin-top:6px}
.pa-tip b{display:block;font-size:13.5px}`;
function css(){ if(!document.getElementById("pa-css")){ const s = document.createElement("style"); s.id = "pa-css"; s.textContent = CSS; document.head.appendChild(s); } }

window.PhatAm = {load, info, ipa: w=>info(w).ipa, stressHTML, stressText, tips, top, KINDS, css};
})();
