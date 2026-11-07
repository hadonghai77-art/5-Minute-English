/* Tra từ: bấm vào một từ tiếng Anh ở bất kỳ trang nào để xem nghĩa, cách dùng, ngữ pháp của câu.
   Chữ nằm trong nút bấm thì giữ lâu (nửa giây) để tra. Mọi thứ chạy trên máy, không cần mạng. */
(function(){
"use strict";
if(window.TraTu) return;
const AUTO_KEY = "tratu-tu-doc", ON_KEY = "tratu-bat";
const get = (k, d)=>{ try{ const v = localStorage.getItem(k); return v === null ? d : v === "1"; }catch(e){ return d; } };
const set = (k, v)=>{ try{ localStorage.setItem(k, v ? "1" : "0"); }catch(e){} };

/* ---------- Nạp dữ liệu khi cần ---------- */
let loading = null;
function loadData(){
  if(window.TD_DICT && window.TD_CAU && window.TD_AM) return Promise.resolve();
  if(loading) return loading;
  const one = src => new Promise(res=>{ const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = res; document.head.appendChild(s); });
  const am = ()=> (window.PhatAm ? Promise.resolve() : one("phat-am.js")).then(()=> window.PhatAm && PhatAm.load());
  loading = Promise.all([window.TD_DICT ? 0 : one("tu-dien.js"), window.TD_CAU ? 0 : one("cau-vi.js"), am()]);
  return loading;
}

/* ---------- Tìm từ gốc ---------- */
const IRR = {am:["be","be"],is:["be","be"],are:["be","be"],was:["be","qk"],were:["be","qk"],been:["be","v3"],being:["be","ing"],
 has:["have","s"],had:["have","qkv3"],does:["do","s"],did:["do","qk"],done:["do","v3"],went:["go","qk"],gone:["go","v3"],goes:["go","s"],
 saw:["see","qk"],seen:["see","v3"],ate:["eat","qk"],eaten:["eat","v3"],took:["take","qk"],taken:["take","v3"],gave:["give","qk"],given:["give","v3"],
 made:["make","qkv3"],came:["come","qk"],got:["get","qkv3"],bought:["buy","qkv3"],brought:["bring","qkv3"],thought:["think","qkv3"],taught:["teach","qkv3"],
 caught:["catch","qkv3"],felt:["feel","qkv3"],left:["leave","qkv3"],met:["meet","qkv3"],kept:["keep","qkv3"],slept:["sleep","qkv3"],spent:["spend","qkv3"],
 sent:["send","qkv3"],built:["build","qkv3"],told:["tell","qkv3"],sold:["sell","qkv3"],said:["say","qkv3"],paid:["pay","qkv3"],found:["find","qkv3"],
 heard:["hear","qkv3"],held:["hold","qkv3"],stood:["stand","qkv3"],understood:["understand","qkv3"],knew:["know","qk"],known:["know","v3"],
 grew:["grow","qk"],grown:["grow","v3"],threw:["throw","qk"],thrown:["throw","v3"],drew:["draw","qk"],drawn:["draw","v3"],flew:["fly","qk"],flown:["fly","v3"],
 wrote:["write","qk"],written:["write","v3"],rode:["ride","qk"],ridden:["ride","v3"],drove:["drive","qk"],driven:["drive","v3"],ran:["run","qk"],swam:["swim","qk"],
 sang:["sing","qk"],sung:["sing","v3"],began:["begin","qk"],begun:["begin","v3"],drank:["drink","qk"],drunk:["drink","v3"],became:["become","qk"],won:["win","qkv3"],
 lost:["lose","qkv3"],spoke:["speak","qk"],spoken:["speak","v3"],broke:["break","qk"],broken:["break","v3"],chose:["choose","qk"],chosen:["choose","v3"],
 forgot:["forget","qk"],forgotten:["forget","v3"],woke:["wake","qk"],woken:["wake","v3"],wore:["wear","qk"],worn:["wear","v3"],fell:["fall","qk"],fallen:["fall","v3"],
 fed:["feed","qkv3"],led:["lead","qkv3"],meant:["mean","qkv3"],learnt:["learn","qkv3"],blew:["blow","qk"],blown:["blow","v3"],shook:["shake","qk"],shaken:["shake","v3"],
 wove:["weave","qk"],woven:["weave","v3"],sat:["sit","qkv3"],hung:["hang","qkv3"],rose:["rise","qk"],risen:["rise","v3"],hid:["hide","qk"],hidden:["hide","v3"],
 children:["child","pl"],people:["person","pl"],men:["man","pl"],women:["woman","pl"],teeth:["tooth","pl"],feet:["foot","pl"],mice:["mouse","pl"],
 leaves:["leaf","pl"],lives:["life","pl"],knives:["knife","pl"],shelves:["shelf","pl"],scarves:["scarf","pl"],
 better:["good","cmp"],best:["good","sup"],worse:["bad","cmp"],worst:["bad","sup"],further:["far","cmp"],farther:["far","cmp"],
 me:["i","obj"],him:["he","obj"],us:["we","obj"],them:["they","obj"],an:["an",""],cannot:["cannot",""]};
const CONTR = {"i'm":["i","am"],"you're":["you","are"],"we're":["we","are"],"they're":["they","are"],"he's":["he","is"],"she's":["she","is"],"it's":["it","is"],
 "that's":["that","is"],"there's":["there","is"],"what's":["what","is"],"who's":["who","is"],"where's":["where","is"],"how's":["how","is"],"here's":["here","is"],
 "i'll":["i","will"],"you'll":["you","will"],"we'll":["we","will"],"they'll":["they","will"],"he'll":["he","will"],"she'll":["she","will"],"it'll":["it","will"],
 "i've":["i","have"],"you've":["you","have"],"we've":["we","have"],"they've":["they","have"],"i'd":["i","would"],"you'd":["you","would"],"we'd":["we","would"],
 "let's":["let","us"],"don't":["do","not"],"doesn't":["do","not"],"didn't":["do","not"],"can't":["can","not"],"won't":["will","not"],"isn't":["be","not"],
 "aren't":["be","not"],"wasn't":["be","not"],"weren't":["be","not"],"haven't":["have","not"],"hasn't":["have","not"],"shouldn't":["should","not"],
 "couldn't":["could","not"],"wouldn't":["would","not"],"mustn't":["must","not"]};
const FORM_VI = {be:"một dạng của động từ be",qk:"dạng quá khứ",v3:"dạng quá khứ phân từ (V3)",qkv3:"dạng quá khứ và quá khứ phân từ (V3)",s:"dạng dùng với he, she, it ở thì hiện tại đơn",
 pl:"dạng số nhiều",cmp:"dạng so sánh hơn",sup:"dạng so sánh nhất",ing:"dạng V-ing",obj:"dạng tân ngữ (đứng sau động từ hoặc giới từ)"};
function has(w){ return !!(window.TD_DICT && TD_DICT[w]); }
function lemma(raw){
  let w = raw.toLowerCase().replace(/[’`]/g,"'").replace(/^'+|'+$/g,"");
  if(CONTR[w]) return {lem:CONTR[w][0], form:"contr", extra:CONTR[w][1], w};
  if(/'s$/.test(w)){ const b = w.slice(0,-2); return {lem: has(b) ? b : b, form:"poss", w}; }
  if(IRR[w]) return {lem:IRR[w][0], form:IRR[w][1], w};
  if(has(w)) return {lem:w, form:"", w};
  const tries = [];
  if(/ies$/.test(w)) tries.push([w.slice(0,-3)+"y","s"]);
  if(/es$/.test(w)) tries.push([w.slice(0,-2),"s"]);
  if(/s$/.test(w)) tries.push([w.slice(0,-1),"s"]);
  if(/ied$/.test(w)) tries.push([w.slice(0,-3)+"y","ed"]);
  if(/ed$/.test(w)){ tries.push([w.slice(0,-2),"ed"],[w.slice(0,-1),"ed"]); if(w[w.length-3]===w[w.length-4]) tries.push([w.slice(0,-3),"ed"]); }
  if(/ying$/.test(w)) tries.push([w.slice(0,-4)+"ie","ing"]);
  if(/ing$/.test(w)){ tries.push([w.slice(0,-3),"ing"],[w.slice(0,-3)+"e","ing"]); if(w[w.length-4]===w[w.length-5]) tries.push([w.slice(0,-4),"ing"]); }
  if(/ier$/.test(w)) tries.push([w.slice(0,-3)+"y","cmp"]);
  if(/er$/.test(w)){ tries.push([w.slice(0,-2),"cmp"],[w.slice(0,-1),"cmp"]); if(w[w.length-3]===w[w.length-4]) tries.push([w.slice(0,-3),"cmp"]); }
  if(/iest$/.test(w)) tries.push([w.slice(0,-4)+"y","sup"]);
  if(/est$/.test(w)){ tries.push([w.slice(0,-3),"sup"],[w.slice(0,-2),"sup"]); if(w[w.length-4]===w[w.length-5]) tries.push([w.slice(0,-4),"sup"]); }
  if(/ly$/.test(w)) tries.push([w.slice(0,-2),"ly"],[w.slice(0,-3)+"y","ly"]);
  for(const [c,f] of tries){
    if(!has(c)) continue;
    const pos = TD_DICT[c][0];
    let form = f;
    if(f==="s") form = pos==="n" ? "pl" : "s";
    if(f==="ed") form = "ed";
    if((f==="cmp"||f==="sup") && pos!=="adj" && pos!=="adv") continue;
    return {lem:c, form, w};
  }
  return {lem:w, form:"", w, unknown:true};
}
const POS_VI = {n:"danh từ",v:"động từ",adj:"tính từ",adv:"trạng từ",prep:"giới từ",pron:"đại từ",det:"từ hạn định",conj:"liên từ",mod:"động từ khuyết thiếu",int:"thán từ",num:"số từ",name:"tên riêng"};

/* ---------- Ngữ pháp trong câu ---------- */
const BEP = /\b(am|is|are|was|were|be|been|being)\b/;
const MODALS = ["can","could","should","must","may","might","will","would","shall"];
const SUBJ3 = /^(he|she|it|this|that|my \w+|his \w+|her \w+|the \w+|[A-Z][a-z]+)$/;
function v3like(t){ if(IRR[t]) return /v3/.test(IRR[t][1]); if(!/ed$/.test(t)) return false; if(window.TD_DICT && TD_DICT[t] && TD_DICT[t][0]==="adj") return false; return true; }
function grammar(sentence, word){
  const raw = sentence.trim(), lw = (word||"").toLowerCase();
  const s = " " + raw.replace(/[’]/g,"'").toLowerCase().replace(/[^a-z0-9' ]/g," ").replace(/\s+/g," ").trim() + " ";
  const toks = s.trim().split(" ");
  const out = [];
  const add = (title, text, words)=>out.push({title, text, hit: words ? words.some(x=>x===lw) : false});
  const q = /\?\s*$/.test(raw);
  // Câu hỏi
  if(q){
    if(/^ (do|does|did) /.test(s)) add("Câu hỏi Yes/No với trợ động từ", `Câu bắt đầu bằng "${toks[0]}" là câu hỏi Có/Không. Cấu trúc: ${toks[0][0].toUpperCase()+toks[0].slice(1)} + chủ ngữ + động từ nguyên mẫu? Trả lời: Yes, ... ${toks[0]}. / No, ... ${toks[0]}n't.`, ["do","does","did"]);
    else if(/^ (am|is|are|was|were) /.test(s)) add("Câu hỏi Yes/No với be", `Đưa "${toks[0]}" lên đầu câu để hỏi. Trả lời: Yes, ... ${toks[0]}. / No, ... ${toks[0]} not.`, ["am","is","are","was","were"]);
    else if(MODALS.includes(toks[0])) add("Câu hỏi với động từ khuyết thiếu", `Đưa "${toks[0]}" lên đầu câu để hỏi, sau chủ ngữ là động từ nguyên mẫu.`, [toks[0]]);
    else if(/^ (have|has) \w+ (ever |\w+ed|been)/.test(s)) add("Câu hỏi thì hiện tại hoàn thành", "Have/Has + chủ ngữ + V3? dùng để hỏi về trải nghiệm hoặc việc đã làm.", ["have","has"]);
    const wh = toks.find(t=>/^(what|where|when|who|whom|whose|which|why|how)$/.test(t));
    if(wh) add("Câu hỏi có từ để hỏi", `"${wh}" là từ để hỏi. Thứ tự: Từ để hỏi + trợ động từ (do/does/did/be/can...) + chủ ngữ + động từ?`, [wh]);
  }
  // There is / are
  if(/ there (is|are|was|were) | there's | there (isn't|aren't) |^ (is|are|was|were) there /.test(s)) add("Cấu trúc There is / There are", "Dùng để nói ở đâu đó CÓ cái gì. There is (There's) + danh từ số ít hoặc không đếm được; There are + danh từ số nhiều. Quá khứ: There was / There were.", ["there","there's","is","are","was","were"]);
  // Thì
  if(/ (am|is|are|'m|'re|'s|i'm|you're|we're|they're|he's|she's|it's) (not )?\w+ing /.test(s) && !/ (is|are|am) (going) to /.test(s.replace(/going to \w+ /,"")) ) add("Thì hiện tại tiếp diễn", "am/is/are + V-ing: hành động đang xảy ra lúc nói hoặc quanh thời điểm hiện tại. Hay đi với now, at the moment, look!", ["am","is","are"].concat(toks.filter(t=>/ing$/.test(t))));
  if(q && / (am|is|are) (you|he|she|it|we|they|i|\w+) \w+ing /.test(s)) add("Thì hiện tại tiếp diễn (câu hỏi)", "(Từ để hỏi) + am/is/are + chủ ngữ + V-ing? hỏi về việc đang diễn ra.", ["am","is","are"].concat(toks.filter(t=>/ing$/.test(t))));
  if(q && / will (you|he|she|it|we|they|i|\w+) /.test(s)) add("Thì tương lai đơn (câu hỏi)", "(Từ để hỏi) + will + chủ ngữ + V nguyên mẫu? hỏi về việc sẽ làm.", ["will"]);
  if(/ (was|were) (not )?\w+ing /.test(s)) add("Thì quá khứ tiếp diễn", "was/were + V-ing: hành động đang xảy ra tại một thời điểm trong quá khứ.", ["was","were"].concat(toks.filter(t=>/ing$/.test(t))));
  if(/ (going to) /.test(s) && / (am|is|are|was|were|'m|'re|'s|i'm|you're|we're|they're|he's|she's|it's) going to /.test(s)) add("Cấu trúc be going to", "be going to + V nguyên mẫu: kế hoạch đã định trước hoặc điều chắc chắn sắp xảy ra.", ["going","to"]);
  const willIx = toks.findIndex(t=>/^(will|won't|i'll|you'll|we'll|they'll|he'll|she'll|it'll)$/.test(t));
  if(willIx>=0 && !q) add("Thì tương lai đơn", "will + V nguyên mẫu: điều sẽ xảy ra, dự đoán, lời hứa hoặc quyết định ngay lúc nói. Phủ định: will not = won't.", ["will","won't","i'll","we'll","you'll","they'll"]);
  const perf = toks.findIndex((t,i)=>/^(have|has|haven't|hasn't|i've|we've|you've|they've)$/.test(t) && toks[i+1] && (v3like(toks[i+1]) || (/^(just|already|never|ever|not)$/.test(toks[i+1]) && toks[i+2] && v3like(toks[i+2]))));
  if(perf>=0) add("Thì hiện tại hoàn thành", "have/has + V3: việc đã xảy ra nhưng còn liên quan tới hiện tại, hoặc trải nghiệm từ trước tới nay. Hay đi với just, already, yet, ever, never, for, since.", ["have","has"]);
  const passive = toks.findIndex((t,i)=>BEP.test(" "+t+" ") && toks[i+1] && v3like(toks[i+1]) && !/^(interested|excited|bored|tired|worried|scared|surprised|pleased|crowded|located|called|married|determined|embarrassed|addicted|amazed|balanced|covered)$/.test(toks[i+1]));
  if(passive>=0) add("Câu bị động", `be + V3 ("${toks[passive]} ${toks[passive+1]}"): chủ ngữ là người/vật CHỊU tác động của hành động. Người làm (nếu có) đứng sau "by".`, [toks[passive], toks[passive+1], "by"]);
  const isAdjOrN = t=>has(t) && /^(adj|n|adv|prep)$/.test(TD_DICT[t][0]);
  const pastWords = toks.filter((t,i)=>{
    if(IRR[t] && /qk/.test(IRR[t][1])){ const pv = toks[i-1]||""; if(t==="left" && /^(look|turn|on|the|to|and|is|are)$/.test(pv)) return false; if(t==="found" && /^(be|was|were|is|are|been)$/.test(pv)) return false;
      return !(IRR[t][1]==="qkv3" && /^(have|has|had|is|are|was|were|be|been|i've|we've|you've|they've|can|could|should|must|will|to)$/.test(pv)); }
    if(!/ed$/.test(t) || isAdjOrN(t)) return false;
    const L = lemma(t); return L.form==="ed" && has(L.lem) && /v/.test(TD_DICT[L.lem][0]) && !(i>0 && BEP.test(" "+toks[i-1]+" ")); });
  if(!q && passive<0 && perf<0 && (pastWords.length || / (yesterday|ago|last) /.test(s))) add("Thì quá khứ đơn", "Việc đã xảy ra và kết thúc trong quá khứ. Động từ có quy tắc thêm -ed (played, visited); bất quy tắc phải học thuộc (go → went, see → saw). Hay đi với yesterday, last week, ... ago.", pastWords.concat(["yesterday","ago","last"]));
  if(q && / did /.test(s)) add("Thì quá khứ đơn (câu hỏi)", "Did + chủ ngữ + V nguyên mẫu? Sau did động từ trở về dạng nguyên mẫu.", ["did"]);
  if(/ (didn't|did not) /.test(s)) add("Thì quá khứ đơn (phủ định)", "didn't + V nguyên mẫu. Ví dụ: I didn't go (không nói didn't went).", ["didn't","did"]);
  if(/ (don't|doesn't|do not|does not) /.test(s)) add("Thì hiện tại đơn (phủ định)", "don't / doesn't + V nguyên mẫu. Dùng doesn't với he, she, it; sau doesn't động từ không thêm -s.", ["don't","doesn't","do","does"]);
  const subjOK = i=>{ const p = toks[i-1]; if(!p) return false; if(/^(he|she|it|everyone|everybody|nobody|someone|this|that)$/.test(p)) return true;
    if(/^(i|you|we|they|the|a|an|my|your|our|their|to|of|in|on|at|for|with|and|or|some|many|two|three|these|those|all|very|more|most|can|will|should|must|do|does|did|not)$/.test(p)) return false;
    const lp = lemma(p); return (has(lp.lem) && /^(n|name)$/.test(TD_DICT[lp.lem][0]) && lp.form==="") || (!has(lp.lem) && i-1>0); };
  const s3 = toks.findIndex((t,i)=>i>0 && /[^s]s$|es$/.test(t) && !/ss$/.test(t) && subjOK(i) && (()=>{ const L = lemma(t); return has(L.lem) && /v/.test(TD_DICT[L.lem][0]+(TD_DICT[L.lem][1].includes("(v)")?"v":"")) && (L.form==="s"||L.form==="pl"); })());
  if(s3>=0) add("Thì hiện tại đơn (ngôi thứ ba số ít)", `Chủ ngữ là ${toks[s3-1]} nên động từ thêm -s/-es: "${toks[s3]}". Thì hiện tại đơn dùng cho thói quen, sự thật, việc lặp lại.`, [toks[s3]]);
  const freq = toks.find(t=>/^(always|usually|often|sometimes|rarely|never|every)$/.test(t));
  if(freq && s3<0 && willIx<0 && !pastWords.length) add("Thì hiện tại đơn", `Có "${freq}" nên câu nói về thói quen, việc lặp lại: dùng thì hiện tại đơn. Trạng từ tần suất đứng trước động từ thường, sau be.`, [freq]);
  // Động từ khuyết thiếu
  const md = toks.findIndex(t=>/^(can|could|should|must|may|might|can't|couldn't|shouldn't|mustn't|cannot)$/.test(t));
  if(md>=0){
    const m = toks[md].replace(/n't$/,"").replace("cannot","can");
    const mean = {can:"có thể, biết", could:"có thể (quá khứ hoặc lịch sự)", should:"nên (lời khuyên)", must:"phải (bắt buộc)", may:"có thể, được phép", might:"có lẽ", ca:"có thể"}[m] || "";
    add(`Động từ khuyết thiếu "${m}"`, `${m} + V nguyên mẫu: ${mean}. Động từ sau "${m}" không chia, không thêm -s, không có "to".`, [toks[md]]);
  }
  if(/ would like /.test(s) || / i'd like /.test(s)) add("Cấu trúc would like", "would like + danh từ / to V: muốn (cách nói lịch sự). Would you like...? dùng để mời.", ["would","like"]);
  if(/ used to /.test(s)) add("Cấu trúc used to", "used to + V nguyên mẫu: đã từng làm (thói quen trong quá khứ, nay không còn).", ["used","to"]);
  if(/ have to | has to | had to /.test(s)) add("Cấu trúc have to", "have/has to + V: phải làm gì (do hoàn cảnh bắt buộc). Quá khứ: had to.", ["have","has","had","to"]);
  // Động từ + V-ing / to V
  const ving = toks.findIndex((t,i)=>/^(like|likes|love|loves|enjoy|enjoys|enjoyed|hate|hates|prefer|finish|finished|practise|stop|mind|keep|spend|spent)$/.test(t) && toks[i+1] && /ing$/.test(toks[i+1]));
  if(ving>=0) add(`${toks[ving]} + V-ing`, `Sau "${toks[ving]}" động từ thêm -ing: "${toks[ving]} ${toks[ving+1]}".`, [toks[ving], toks[ving+1]]);
  const tov = toks.findIndex((t,i)=>/^(want|wants|wanted|need|needs|decide|decided|plan|plans|planned|hope|hopes|try|tries|tried|learn|learns|would|promise|agree|refuse|forget|remember|start|begin|like|love)$/.test(t) && toks[i+1]==="to" && toks[i+2] && has(lemma(toks[i+2]).lem) && TD_DICT[lemma(toks[i+2]).lem][0]==="v");
  if(tov>=0) add(`${toks[tov]} + to V`, `Sau "${toks[tov]}" dùng "to + động từ nguyên mẫu": "${toks.slice(tov, tov+3).join(" ")}".`, [toks[tov], "to"]);
  // So sánh
  const cmpIx = toks.indexOf("than");
  if(cmpIx>0) add("So sánh hơn", "Tính từ ngắn + -er + than (taller than); more + tính từ dài + than (more beautiful than). Bất quy tắc: good → better, bad → worse.", ["than","more", toks[cmpIx-1]]);
  const supIx = toks.findIndex((t,i)=>t==="the" && toks[i+1] && (/est$/.test(toks[i+1]) || toks[i+1]==="most" || toks[i+1]==="best"));
  if(supIx>=0) add("So sánh nhất", "the + tính từ ngắn + -est (the tallest); the most + tính từ dài (the most beautiful).", ["the","most",toks[supIx+1]]);
  // Câu điều kiện
  if(/^ if | if /.test(s)) add("Câu điều kiện", /would/.test(s) ? "Loại 2 (điều không có thật ở hiện tại): If + quá khứ đơn, ... would + V." : "Loại 1 (có thể xảy ra): If + hiện tại đơn, ... will / can / should + V.", ["if"]);
  // Câu mệnh lệnh, rủ rê
  if(/^ let's /.test(s)) add("Câu rủ rê Let's", "Let's + V nguyên mẫu = Chúng ta hãy cùng...", ["let's","let"]);
  else if(/^ (don't|please) /.test(s) || (!q && toks[0] && has(lemma(toks[0]).lem) && TD_DICT[lemma(toks[0]).lem][0]==="v" && lemma(toks[0]).form==="" && !/^(thank|hope|wish|love|like|see)$/.test(toks[0]))) add("Câu mệnh lệnh", "Bắt đầu bằng động từ nguyên mẫu (không có chủ ngữ) để yêu cầu, hướng dẫn. Phủ định: Don't + V. Thêm please cho lịch sự.", [toks[0],"don't","please"]);
  // Liên từ
  const cj = toks.find(t=>/^(because|so|but|although|when|while|until|before|after)$/.test(t) && t!==toks[0] || /^(although|when|because|after|before|while)$/.test(t));
  if(cj){ const cv = {because:"chỉ lý do (bởi vì)", so:"chỉ kết quả (vì vậy)", but:"nối hai ý trái ngược (nhưng)", although:"nối hai ý trái ngược (mặc dù)", when:"chỉ thời gian (khi)", while:"hai việc cùng lúc (trong khi)", until:"cho đến khi", before:"trước khi", after:"sau khi"}[cj];
    add(`Liên từ "${cj}"`, `"${cj}" nối hai mệnh đề, ${cv}.`, [cj]); }
  // Sở hữu cách
  const poss = toks.find(t=>/'s$/.test(t) && !CONTR[t]);
  if(poss) add("Sở hữu cách 's", `"${poss}" nghĩa là "của ${poss.slice(0,-2)}". Thêm 's sau danh từ chỉ người để nói sở hữu.`, [poss]);
  // Đưa quy tắc có liên quan đến từ được bấm lên đầu
  out.sort((a,b)=>b.hit - a.hit);
  return out;
}

/* ---------- Câu và nghĩa của câu ---------- */
const normS = s=>s.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]/g," ").replace(/\s+/g," ").trim();
function sentenceVi(sentence){
  if(!window.TD_CAU) return null;
  const k = normS(sentence);
  if(TD_CAU[k]) return TD_CAU[k][1];
  if(k.split(" ").length >= 3){ for(const c in TD_CAU) if(c.includes(k)) return TD_CAU[c][1]; }
  return null;
}
function examples(lem, w, sentence){
  if(!window.TD_CAU) return [];
  const k0 = normS(sentence), out = [];
  const forms = new RegExp("(^| )(" + [lem, w].filter(Boolean).map(x=>x.replace(/[^a-z']/g,"")).join("|") + ")(s|es|ed|d|ing)?( |$)");
  for(const k in TD_CAU){ if(k === k0) continue; if(forms.test(k)){ out.push(TD_CAU[k]); if(out.length >= 3) break; } }
  return out;
}

/* ---------- Giọng đọc ---------- */
const synth = window.speechSynthesis;
let enV = null, viV = null;
function pick(){ if(!synth) return; const a = synth.getVoices(); const en = a.filter(v=>/^en[-_]/i.test(v.lang)); enV = en.find(v=>/en[-_](GB|US)/i.test(v.lang) && /google|samantha|daniel|libby|sonia/i.test(v.name)) || en[0] || null; viV = a.find(v=>/^vi/i.test(v.lang)) || null; }
if(synth){ pick(); synth.addEventListener && synth.addEventListener("voiceschanged", pick); }
function speak(text, vi, queue, rate){
  if(!synth || !text) return;
  if(vi && !viV) return;
  try{ if(!queue) synth.cancel(); const u = new SpeechSynthesisUtterance(text);
    if(vi){ u.voice = viV; u.lang = viV.lang; u.rate = 1.05; } else { if(enV) u.voice = enV; u.lang = enV ? enV.lang : "en-GB"; u.rate = rate || 0.8; }
    synth.speak(u); }catch(e){}
}

/* ---------- Giao diện ---------- */
const CSS = `
.tt-back{position:fixed;inset:0;background:rgba(10,25,20,.35);z-index:9998}
.tt-sheet{position:fixed;left:0;right:0;bottom:0;z-index:9999;max-height:82vh;overflow-y:auto;background:var(--surface,#fff);color:var(--ink,#16302A);
  border-radius:20px 20px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.25);font:15.5px/1.55 "Be Vietnam Pro",system-ui,sans-serif;
  padding:8px max(16px,env(safe-area-inset-left,0px)) calc(16px + env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-right,0px))}
.tt-in{max-width:620px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
.tt-grab{width:44px;height:5px;border-radius:9px;background:rgba(127,127,127,.4);margin:2px auto 4px}
.tt-head{display:flex;align-items:flex-start;gap:10px}
.tt-w{font:800 30px/1.1 "Baloo 2","Be Vietnam Pro",system-ui,sans-serif;word-break:break-word}
.tt-ipa{color:var(--muted,#55706A);font-size:15px}
.tt-stress{font-size:15px;letter-spacing:.3px;margin-top:1px}
.tt-pos{display:inline-block;font-size:12.5px;font-weight:700;padding:2px 9px;border-radius:99px;background:var(--soft,#E7F0EA);margin-top:4px}
.tt-x{margin-left:auto;border:0;background:var(--soft,#E7F0EA);color:inherit;width:40px;height:40px;border-radius:50%;font-size:20px;cursor:pointer;flex:none}
.tt-mean{font-size:20px;font-weight:700;color:var(--board,#1F5C45)}
.tt-sec{border-top:1px solid var(--line,#D6E0DA);padding-top:10px}
.tt-sec h4{margin:0 0 6px;font-size:12.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#55706A)}
.tt-sec ul{margin:0;padding-left:18px}.tt-sec li{margin:4px 0}
.tt-sent{font-weight:600}.tt-sheet .tt-sent mark{background:#E8B931!important;color:#2A2206!important;border-radius:4px;padding:0 2px}
.tt-vi{color:var(--muted,#55706A)}
.tt-g{background:var(--soft,#E7F0EA);border-radius:12px;padding:10px 12px;margin-bottom:8px}
.tt-g b{display:block;margin-bottom:2px}.tt-g.hit{outline:2px solid var(--chalk,#E8B931)}
.tt-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.tt-btn{border:1px solid var(--line,#D6E0DA);background:var(--soft,#E7F0EA);color:inherit;font:600 14.5px "Be Vietnam Pro",system-ui,sans-serif;padding:9px 14px;border-radius:12px;cursor:pointer;min-height:42px}
.tt-btn.y{background:var(--chalk,#E8B931);color:var(--chalk-ink,#2A2206);border-color:transparent}
.tt-sw{display:flex;align-items:center;gap:8px;font-size:14px;cursor:pointer;margin-left:auto}
.tt-sw input{width:20px;height:20px;accent-color:var(--board,#1F5C45)}
.tt-note{font-size:13px;color:var(--muted,#55706A)}
.tt-btn:focus-visible,.tt-x:focus-visible{outline:3px solid var(--chalk,#E8B931);outline-offset:2px}
.tt-flash{background:var(--chalk,#E8B931)!important;color:var(--chalk-ink,#2A2206)!important;border-radius:3px}
@media (prefers-color-scheme: dark){.tt-sheet{background:var(--surface,#16291F);color:var(--ink,#E6EFE9)}.tt-mean{color:var(--chalk,#F0C849)}}
`;
let sheet = null, back = null;
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function close(){ if(sheet){ sheet.remove(); back.remove(); sheet = back = null; } if(synth) synth.cancel(); }
function saveWord(w, vi, sentence, svi){
  try{
    const S = JSON.parse(localStorage.getItem("hmn-v1") || "{}");
    S.custom = S.custom || {}; S.custom[w] = [vi, sentence || "", svi || ""];
    localStorage.setItem("hmn-v1", JSON.stringify(S)); return true;
  }catch(e){ return false; }
}
function phraseIn(sentence, word){
  if(!window.TD_PHR) return null;
  const n = " " + normS(sentence) + " ", lw = word.toLowerCase();
  for(const p in TD_PHR) if(p.split(" ").includes(lw) && n.includes(" " + p + " ")) return [p, TD_PHR[p]];
  return null;
}

async function open(word, sentence){
  word = String(word||"").replace(/^[^A-Za-z']+|[^A-Za-z']+$/g,"");
  if(!word) return;
  sentence = (sentence || word).trim();
  await loadData();
  if(!document.getElementById("tt-css")){ const st = document.createElement("style"); st.id = "tt-css"; st.textContent = CSS; document.head.appendChild(st); }
  close();
  const L = lemma(word), D = (window.TD_DICT||{})[L.lem], isName = !D && /^[A-Z]/.test(word);
  { const ws = sentence.split(/\s+/).map(x=>x.replace(/[^A-Za-z']/g,"").toLowerCase()); const i = ws.indexOf(L.w); const prev = i>0 ? ws[i-1] : "";
    if(L.form==="pl" && /^(he|she|it|this|that|everyone|nobody)$/.test(prev)) L.form = "s";
    if(L.form==="s" && D && D[0]==="n" && /^(the|a|an|my|your|his|her|our|their|two|three|many|some|these|those)$/.test(prev)) L.form = "pl"; }
  const PA = window.PhatAm;
  const ipa = (window.TD_IPA||{})[L.w] || (window.TD_IPA||{})[L.lem] || (PA ? PA.ipa(L.w) || PA.ipa(L.lem) : "");
  const stressH = PA ? PA.stressHTML(L.w) : "", paTips = PA ? PA.tips(L.w, 2) : [];
  if(PA) PA.css();
  const notes = D && D[2] ? D[2].split(";;").map(x=>x.trim()).filter(Boolean) : [];
  const phrases = D && D[3] ? D[3].split(";;").map(x=>x.trim()).filter(Boolean) : [];
  const svi = sentenceVi(sentence);
  const gr = sentence.split(/\s+/).length > 1 ? grammar(sentence, L.w) : [];
  const ex = examples(L.lem, L.w, sentence);
  const ph = phraseIn(sentence, word);
  let formNote = "";
  if(L.form === "contr") formNote = `"${word}" là cách viết tắt của "${L.lem} ${L.extra}".`;
  else if(L.form === "poss") formNote = `"${word}" là sở hữu cách: "của ${L.lem}".`;
  else if(L.form === "ed") formNote = `"${word}" là dạng quá khứ hoặc V3 của "${L.lem}" (thêm -ed).`;
  else if(L.form === "ly") formNote = `"${word}" là trạng từ, tạo từ "${L.lem}" bằng cách thêm -ly.`;
  else if(L.form && FORM_VI[L.form] && L.lem !== L.w) formNote = `"${word}" là ${FORM_VI[L.form]} của "${L.lem}".`;
  const re = new RegExp("\\b(" + word.replace(/[^A-Za-z']/g,"") + ")\\b", "i");
  const sentHTML = esc(sentence).replace(re, "<mark>$1</mark>");
  const auto = get(AUTO_KEY, true);
  const pos = D ? (POS_VI[D[0]] || "") : (isName ? "tên riêng" : "");
  const mean = D ? D[1] : (isName ? "Tên riêng (tên người, địa danh, dân tộc...)" : "Từ này chưa có trong từ điển của app.");

  back = document.createElement("div"); back.className = "tt-back"; back.onclick = close;
  sheet = document.createElement("div"); sheet.className = "tt-sheet"; sheet.setAttribute("role","dialog"); sheet.setAttribute("aria-label","Giải thích từ " + word);
  sheet.innerHTML = `<div class="tt-in"><div class="tt-grab"></div>
    <div class="tt-head"><div><div class="tt-w">${esc(L.lem !== L.w && L.form && L.form!=="poss" ? word : word)}</div>
      ${ipa ? `<div class="tt-ipa">${esc(ipa)}</div>` : ""}${stressH ? `<div class="tt-stress" title="Âm tiết in đậm là chỗ nhấn mạnh">${stressH}</div>` : ""}${pos ? `<span class="tt-pos">${esc(pos)}</span>` : ""}</div>
      <button class="tt-x" aria-label="Đóng">✕</button></div>
    <div class="tt-mean">${esc(mean)}</div>
    ${formNote ? `<p class="tt-note" style="margin:0">${esc(formNote)}${D && L.lem!==L.w ? ` Nghĩa của "${esc(L.lem)}": ${esc(D[1])}.` : ""}</p>` : ""}
    ${ph ? `<p style="margin:0">Trong câu này, <b>"${esc(ph[0])}"</b> là một cụm từ: <b>${esc(ph[1][1])}</b> ${ph[1][0] ? `<span class="tt-ipa">${esc(ph[1][0])}</span>` : ""}</p>` : ""}
    <div class="tt-row"><button class="tt-btn y" data-a="word">🔊 Nghe từ</button><button class="tt-btn" data-a="slow">🐢 Nghe chậm</button><button class="tt-btn" data-a="sent">🔊 Nghe câu</button><button class="tt-btn" data-a="vi">🗣 Đọc giải thích</button>
      <label class="tt-sw"><input type="checkbox" id="tt-auto"${auto ? " checked" : ""}> Tự đọc</label></div>
    ${sentence.split(/\s+/).length > 1 ? `<div class="tt-sec"><h4>Trong câu này</h4><p class="tt-sent" style="margin:0">${sentHTML}</p>${svi ? `<p class="tt-vi" style="margin:4px 0 0">${esc(svi)}</p>` : ""}</div>` : ""}
    ${paTips.length ? `<div class="tt-sec"><h4>Đọc cho đúng</h4>${paTips.map(t=>`<div class="pa-tip"><b>${esc(t.t)}</b>${esc(t.d)}</div>`).join("")}</div>` : ""}
    ${notes.length ? `<div class="tt-sec"><h4>Bản chất và cách dùng</h4><ul>${notes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}
    ${gr.length ? `<div class="tt-sec"><h4>Ngữ pháp trong câu</h4>${gr.slice(0,4).map(g=>`<div class="tt-g${g.hit ? " hit" : ""}"><b>${esc(g.title)}</b>${esc(g.text)}</div>`).join("")}</div>` : ""}
    ${phrases.length ? `<div class="tt-sec"><h4>Cụm hay gặp</h4><ul>${phrases.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>` : ""}
    ${ex.length ? `<div class="tt-sec"><h4>Câu khác có từ này</h4><ul>${ex.map(e=>`<li><span>${esc(e[0])}</span><br><span class="tt-vi">${esc(e[1])}</span></li>`).join("")}</ul></div>` : ""}
    <div class="tt-row">${D ? `<button class="tt-btn" data-a="save">＋ Lưu vào Sổ từ</button>` : ""}<span class="tt-note" id="tt-msg"></span></div>
    ${viV || !synth ? "" : `<p class="tt-note" style="margin:0">Điện thoại chưa có giọng đọc tiếng Việt nên chỉ đọc được tiếng Anh. Có thể cài thêm trong Cài đặt › Chuyển văn bản thành giọng nói › Google › Tiếng Việt.</p>`}
  </div>`;
  document.body.appendChild(back); document.body.appendChild(sheet);
  const viText = [
    `${L.lem}${pos ? ", " + pos : ""}. Nghĩa là: ${mean}.`,
    stressH ? PA.stressText(L.w) : "",
    formNote, ph ? `Trong câu này, ${ph[0]} là một cụm từ, nghĩa là ${ph[1][1]}.` : "",
    svi ? `Cả câu nghĩa là: ${svi}` : "",
    notes[0] || "", gr[0] ? `${gr[0].title}. ${gr[0].text}` : ""
  ].filter(Boolean).join(" ").replace(/[A-Za-z][A-Za-z' -]*[A-Za-z]/g, m=>m); // đọc nguyên văn
  const readAll = ()=>{ speak(word, false); setTimeout(()=>speak(viText, true, true), 50); };
  sheet.querySelector(".tt-x").onclick = close;
  sheet.querySelectorAll("[data-a]").forEach(b=>b.onclick = ()=>{
    const a = b.dataset.a;
    if(a === "word") speak(word, false);
    else if(a === "slow") speak(word, false, false, 0.45);
    else if(a === "sent") speak(sentence, false);
    else if(a === "vi"){ if(!viV){ sheet.querySelector("#tt-msg").textContent = "Máy chưa có giọng tiếng Việt."; } speak(viText, true); }
    else if(a === "save"){ const ok = saveWord(L.lem, D[1], sentence, svi); b.disabled = true; b.textContent = ok ? "✓ Đã lưu" : "Chưa lưu được"; }
  });
  sheet.querySelector("#tt-auto").onchange = e=>{ set(AUTO_KEY, e.target.checked); if(!e.target.checked && synth) synth.cancel(); };
  sheet.querySelector(".tt-x").focus();
  if(auto) readAll(); else speak(word, false);
}

/* ---------- Bấm vào chữ trên trang ---------- */
const SKIP = "button,a,input,select,textarea,label,summary,[role=button],[contenteditable],.tt-sheet,.tt-back,svg,audio,video,.no-tratu";
function wordAt(x, y){
  let node, off;
  if(document.caretRangeFromPoint){ const r = document.caretRangeFromPoint(x, y); if(!r) return null; node = r.startContainer; off = r.startOffset; }
  else if(document.caretPositionFromPoint){ const p = document.caretPositionFromPoint(x, y); if(!p) return null; node = p.offsetNode; off = p.offset; }
  if(!node || node.nodeType !== 3) return null;
  const t = node.textContent; let a = off, b = off;
  const isW = c=>/[A-Za-z'’-]/.test(c||"");
  while(a > 0 && isW(t[a-1])) a--; while(b < t.length && isW(t[b])) b++;
  let w = t.slice(a, b).replace(/^['’-]+|['’-]+$/g,"");
  if(!/[A-Za-z]/.test(w)) return null;
  // phải bấm đúng lên chữ, không phải khoảng trống bên cạnh
  try{ const r = document.createRange(); r.setStart(node, a); r.setEnd(node, b); const rc = r.getBoundingClientRect(); if(x < rc.left-4 || x > rc.right+4 || y < rc.top-4 || y > rc.bottom+4) return null; }catch(e){}
  return {w, node};
}
function sentenceAround(node, w){
  let el = node.parentElement;
  // lấy khối chữ chứa từ (đoạn, bong bóng lời, thẻ)
  while(el && el.parentElement && (el.textContent||"").trim().split(/\s+/).length < 3 && el.parentElement !== document.body) el = el.parentElement;
  const text = (el ? el.innerText || el.textContent : node.textContent).replace(/\s+/g," ").trim();
  const parts = text.split(/(?<=[.!?])\s+|\n/);
  const hit = parts.find(p=>new RegExp("\\b" + w.replace(/[^A-Za-z']/g,"") + "\\b","i").test(p)) || node.textContent;
  // chỉ giữ đoạn tiếng Anh có chứa từ, bỏ tên người nói ("Tân:") và phần tiếng Việt dính kèm
  const wre = new RegExp("\\b" + w.replace(/[^A-Za-z']/g,"") + "\\b","i");
  const runs = (hit.match(/[A-Za-z0-9'’",.!?;:()\- ]+/g) || []).filter(r=>wre.test(r)).sort((a,b)=>b.length-a.length);
  let out = (runs[0] || w).trim();
  const ci = out.indexOf(": "); if(ci > -1 && ci < 16 && !wre.test(out.slice(0, ci))) out = out.slice(ci+2);
  return out.trim();
}
function looksEnglish(node){
  const t = (node.textContent || "").trim();
  if(!t) return false;
  const vi = (t.match(/[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/gi) || []).length;
  return vi / t.length < 0.04;
}
function onEnabled(){ return get(ON_KEY, true); }
document.addEventListener("click", e=>{
  if(!onEnabled() || e.defaultPrevented) return;
  if(e.target.closest && e.target.closest(SKIP)) return;
  const sel = window.getSelection && String(window.getSelection()); if(sel && sel.length > 1) return;
  const hit = wordAt(e.clientX, e.clientY); if(!hit || !looksEnglish(hit.node)) return;
  open(hit.w, sentenceAround(hit.node, hit.w));
});
/* Giữ lâu để tra cả chữ trong nút bấm */
let lp = null;
document.addEventListener("pointerdown", e=>{
  if(!onEnabled() || e.button > 0) return;
  if(e.target.closest && e.target.closest(".tt-sheet,.tt-back,input,textarea,select")) return;
  const x = e.clientX, y = e.clientY;
  clearTimeout(lp && lp.t);
  lp = {x, y, t: setTimeout(()=>{
    const hit = wordAt(x, y); if(!hit || !looksEnglish(hit.node)) return;
    lp.fired = true;
    open(hit.w, sentenceAround(hit.node, hit.w));
  }, 550)};
}, {passive:true});
const cancelLP = e=>{ if(lp && (e.type !== "pointermove" || Math.hypot(e.clientX-lp.x, e.clientY-lp.y) > 10)) clearTimeout(lp.t); };
document.addEventListener("pointermove", cancelLP, {passive:true});
document.addEventListener("pointerup", cancelLP, {passive:true});
document.addEventListener("pointercancel", cancelLP, {passive:true});
document.addEventListener("click", e=>{ if(lp && lp.fired){ lp.fired = false; e.preventDefault(); e.stopPropagation(); } }, true);
document.addEventListener("contextmenu", e=>{ if(lp && lp.fired) e.preventDefault(); });
document.addEventListener("keydown", e=>{ if(e.key === "Escape") close(); });
// Nạp sẵn dữ liệu khi máy rảnh để lần bấm đầu tiên nhanh hơn
setTimeout(()=>loadData(), 2500);

window.TraTu = {open, close, lemma, grammar, setEnabled: v=>set(ON_KEY, v), isEnabled: onEnabled, setAuto: v=>set(AUTO_KEY, v), isAuto: ()=>get(AUTO_KEY, true)};
})();
