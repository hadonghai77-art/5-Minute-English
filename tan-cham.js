/* Tân tự chấm câu trả lời mở của học sinh, chạy ngay trên điện thoại, không cần mạng, không dùng AI.
   Dựa trên luật ngữ pháp hay gặp của học sinh Việt Nam + từ khóa của câu hỏi.
   TanCham.check(câu em nói, câu hỏi, từ mới của bài) → {status, notes[], fixed, model, praise, tip} */
(function(root){
"use strict";

/* ---------- động từ ---------- */
const BASE = ("like love enjoy hate prefer play watch listen live want need help go do have get make take eat drink read write study learn work visit use cook clean wash walk ride swim run sing dance draw collect grow plant buy sell speak talk think know see come sleep wake start finish stay spend practise practice try call send feel look wear keep save recycle reuse reduce protect travel meet bring carry teach say tell give open close leave become celebrate decorate raise feed sweep harvest pick fly catch climb fish surf hang chat share believe admire hope remember forget understand improve cause happen change build invent communicate join perform prepare check turn switch move sit stand find fall win lose begin break choose hear put cut let agree arrive borrow lend pray miss ask answer explain plan stop shop weave sew relax rest argue argue respect support donate volunteer manage cry laugh smile fix paint replace develop provide encourage treat include create destroy pollute damage affect increase decrease disappear melt rise cure discover translate search apply admire overcome migrate preserve promote accept behave sort ban hunt report ignore earn grill bake boil fry wrap return enter connect text download post protect order pay cost brush exercise jog cycle drive dress research arrive depend look turn")
  .split(" ");
const BASESET = new Set(BASE);
const IRR = {go:"went",do:"did",have:"had",get:"got",make:"made",take:"took",eat:"ate",drink:"drank",read:"read",write:"wrote",see:"saw",come:"came",buy:"bought",sing:"sang",swim:"swam",run:"ran",ride:"rode",draw:"drew",grow:"grew",give:"gave",speak:"spoke",think:"thought",know:"knew",sleep:"slept",wake:"woke",spend:"spent",feel:"felt",wear:"wore",keep:"kept",meet:"met",bring:"brought",teach:"taught",say:"said",tell:"told",leave:"left",become:"became",feed:"fed",fly:"flew",catch:"caught",sit:"sat",stand:"stood",build:"built",sell:"sold",forget:"forgot",understand:"understood",find:"found",fall:"fell",win:"won",lose:"lost",begin:"began",break:"broke",choose:"chose",hear:"heard",put:"put",cut:"cut",let:"let",send:"sent",sweep:"swept",lend:"lent",weave:"wove",hang:"hung"};
const PP = {go:"gone",do:"done",eat:"eaten",drink:"drunk",write:"written",see:"seen",come:"come",sing:"sung",swim:"swum",run:"run",ride:"ridden",draw:"drawn",grow:"grown",give:"given",speak:"spoken",know:"known",wake:"woken",wear:"worn",take:"taken",become:"become",fly:"flown",fall:"fallen",begin:"begun",break:"broken",choose:"chosen",forget:"forgotten",weave:"woven",be:"been"};
const DOUBLE = new Set(["swim","run","sit","get","shop","stop","put","cut","begin","plan","chat","travel","win","let"]);
function third(v){ if(v==="have") return "has"; if(/(s|sh|ch|x|o|z)$/.test(v)) return v+"es"; if(/[^aeiou]y$/.test(v)) return v.slice(0,-1)+"ies"; return v+"s"; }
function ing(v){ if(v==="lie") return "lying"; if(/ie$/.test(v)) return v.slice(0,-2)+"ying"; if(DOUBLE.has(v)) return v+v.slice(-1)+"ing"; if(/[^e]e$/.test(v) && v!=="see" && v!=="agree") return v.slice(0,-1)+"ing"; return v+"ing"; }
function past(v){ if(IRR[v]) return IRR[v]; if(DOUBLE.has(v)) return v+v.slice(-1)+"ed"; if(/e$/.test(v)) return v+"d"; if(/[^aeiou]y$/.test(v)) return v.slice(0,-1)+"ied"; return v+"ed"; }
function pp(v){ return PP[v] || past(v); }
/* tra ngược: từ đã chia → động từ gốc */
const FROM3 = {}, FROMPAST = {}, FROMING = {}, FROMPP = {};
for(const v of BASE){ FROM3[third(v)] = v; FROMPAST[past(v)] = v; FROMING[ing(v)] = v; FROMPP[pp(v)] = v; }
FROMPAST.goed = "go"; FROMPAST.eated = "eat"; FROMPAST.buyed = "buy"; FROMPAST.runned = "run"; FROMPAST.swimmed = "swim"; FROMPAST.teached = "teach"; FROMPAST.thinked = "think"; FROMPAST.catched = "catch"; FROMPAST.writed = "write"; FROMPAST.maked = "make"; FROMPAST.taked = "take"; FROMPAST.seed = "see"; FROMPAST.singed = "sing"; FROMPAST.drinked = "drink"; FROMPAST.comed = "come"; FROMPAST.gived = "give"; FROMPAST.speaked = "speak"; FROMPAST.sleeped = "sleep"; FROMPAST.feeled = "feel"; FROMPAST.weared = "wear"; FROMPAST.meeted = "meet"; FROMPAST.bringed = "bring"; FROMPAST.telled = "tell"; FROMPAST.leaved = "leave"; FROMPAST.flyed = "fly"; FROMPAST.builded = "build"; FROMPAST.selled = "sell"; FROMPAST.finded = "find"; FROMPAST.falled = "fall"; FROMPAST.winned = "win"; FROMPAST.losed = "lose"; FROMPAST.breaked = "break"; FROMPAST.choosed = "choose"; FROMPAST.heared = "hear"; FROMPAST.sended = "send"; FROMPAST.drawed = "draw"; FROMPAST.growed = "grow"; FROMPAST.knowed = "know"; FROMPAST.rided = "ride"; FROMPAST.spended = "spend";
const WRONGPAST = new Set(["goed","eated","buyed","runned","swimmed","teached","thinked","catched","writed","maked","taked","seed","singed","drinked","comed","gived","speaked","sleeped","feeled","weared","meeted","bringed","telled","leaved","flyed","builded","selled","finded","falled","winned","losed","breaked","choosed","heared","sended","drawed","growed","knowed","rided","spended"]);
const baseOf = w => BASESET.has(w) ? w : FROM3[w] || FROMPAST[w] || FROMING[w] || FROMPP[w] || null;
const isPast = w => (FROMPAST[w] && !BASESET.has(w)) || ["was","were","did","had","used"].includes(w) || (w==="read");

/* ---------- chủ ngữ ---------- */
const P_SING = new Set(["he","she","it"]);
const P_PLUR = new Set(["i","you","we","they"]);
const N_SING = "mother|father|mum|mom|dad|brother|sister|friend|teacher|grandmother|grandfather|grandma|grandpa|uncle|aunt|family|school|village|class|town|city|house|cousin|son|daughter|best friend|neighbour|neighbor";
const ADV = "(?:always |usually |often |sometimes |never |also |really |still |just |only |even )?";
const SHORTADJ = {big:"bigger",small:"smaller",quiet:"quieter",cheap:"cheaper",fast:"faster",tall:"taller",short:"shorter",old:"older",new:"newer",hot:"hotter",cold:"colder",busy:"busier",noisy:"noisier",easy:"easier",happy:"happier",clean:"cleaner",safe:"safer",nice:"nicer",large:"larger",long:"longer",high:"higher",young:"younger",fresh:"fresher",cool:"cooler",good:"better",bad:"worse",hard:"harder",strong:"stronger",cheap2:"cheaper",green:"greener",smart:"smarter",warm:"warmer",slow:"slower",healthy:"healthier",early:"earlier",late:"later",near:"nearer",far:"farther",friendly:"friendlier"};
const ADVC = "((?:always |usually |often |sometimes |never |also |really |still |just |only |even )?)";
const ADJ = "interesting|boring|fun|funny|beautiful|big|small|good|bad|kind|clever|friendly|happy|sad|easy|difficult|hard|important|useful|quiet|noisy|delicious|tired|busy|hot|cold|new|old|modern|convenient|expensive|cheap|safe|dangerous|healthy|helpful|tall|short|famous|great|nice|crowded|peaceful|polluted|exciting|excited|bored|scared|afraid|hungry|thirsty|ready|large";
const NOUNS = {room:"rooms",friend:"friends",book:"books",pen:"pens",job:"jobs",tree:"trees",year:"years",hour:"hours",day:"days",student:"students",child:"children",person:"people",animal:"animals",bird:"birds",house:"houses",city:"cities",country:"countries",language:"languages",subject:"subjects",brother:"brothers",sister:"sisters",game:"games",film:"films",song:"songs",place:"places",thing:"things",week:"weeks",minute:"minutes",cave:"caves",island:"islands",festival:"festivals",field:"fields",family:"families",bag:"bags",apple:"apples",egg:"eggs",robot:"robots",car:"cars",flower:"flowers",teacher:"teachers",classmate:"classmates",month:"months",time:"times",lesson:"lessons",word:"words",bedroom:"bedrooms",chair:"chairs",table:"tables",computer:"computers",phone:"phones",factory:"factories",skill:"skills",member:"members",planet:"planets",ruler:"rulers",notebook:"notebooks",cow:"cows",buffalo:"buffaloes",pig:"pigs",chicken:"chickens",dog:"dogs",cat:"cats",kid:"kids",village:"villages",park:"parks",shop:"shops",market:"markets"};
const NOT_ADJ_ER = new Set(Object.values(SHORTADJ));

/* ---------- tiện ích ---------- */
const VI_CHARS = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹàáèéìíòóùúýãõĩũ]/i;
const VI_WORDS = /\b(la|cua|em|toi|minh|thich|khong|nhung|vi|va|rat|lam|dang|duoc|nha|truong|ban|co|di|hoc|choi|an|ngu|thay|co giao|bo|me|anh|chi)\b/;
function stripAccents(s){ return s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D"); }
function normSent(raw){
  let s = " " + raw.toLowerCase().replace(/[’`´]/g,"'").replace(/[“”"]/g," ").replace(/([.,!?;:()])/g," $1 ").replace(/\s+/g," ").trim() + " ";
  s = s.replace(/ i'm /g," i am ").replace(/ (he|she|it|that|there|what|who)'s /g," $1 is ").replace(/ (you|we|they)'re /g," $1 are ")
       .replace(/ (i|you|we|they)'ve /g," $1 have ").replace(/ (i|you|we|they|he|she|it)'ll /g," $1 will ").replace(/ (i|you|we|they|he|she)'d (like|love|prefer) /g," $1 would $2 ");
  return s;
}
function wordsOf(s){ return s.trim().split(/\s+/).filter(w=>w && !/^[.,!?;:()]$/.test(w)); }

/* ---------- các luật sửa ----------
   mỗi luật: re (trên câu đã chuẩn hóa, có dấu cách hai đầu), to, vi: giải thích. Luật chỉ chạy khi điều kiện "when" đúng. */
function rules(q){
  const R = [];
  const add = (re, to, vi, when)=>R.push({re, to, vi, when});
  // 1. am/is/are đi với chủ ngữ
  add(/ i (is|are) /g, " i am ", m=>`Với “I” em dùng “am”: “I am”, không nói “I ${m[1]}”.`);
  add(/ (he|she|it) are /g, " $1 is ", m=>`Với “${m[1]}” em dùng “is”: “${m[1]} is”.`);
  add(/ (you|we|they) is /g, " $1 are ", m=>`Với “${m[1]}” em dùng “are”: “${m[1]} are”.`);
  add(/ (people|children|students|parents|my parents|my friends|they|we) (is) /g, " $1 are ", m=>`“${m[1]}” là số nhiều nên dùng “are”, không dùng “is”.`);
  add(/ (people|children|students) (was) /g, " $1 were ", m=>`“${m[1]}” là số nhiều nên dùng “were”, không dùng “was”.`);
  add(/ i has /g, " i have ", ()=>`Với “I” em dùng “have”, không dùng “has”.`);
  add(/ i am (agree|disagree) /g, " i $1 ", m=>`“${m[1]}” đã là động từ, không thêm “am”. Nói “I ${m[1]}”.`);
  // 1b. thiếu am/is/are trước tính từ
  add(new RegExp(" (i|it|he|she|they|we|you) ((?:very |so |really |quite |too )?)("+ADJ+") ","g"), (m)=>{ const sj = m[1]; const be = sj==="i" ? "am" : P_SING.has(sj) ? "is" : "are"; return ` ${sj} ${be} ${m[2]}${m[3]} `; },
    m=>{ const sj = m[1]; const be = sj==="i" ? "am" : P_SING.has(sj) ? "is" : "are"; return `Câu thiếu động từ “${be}”. Trước tính từ “${m[3]}” cần có “am/is/are”: “${sj==="i"?"I":sj} ${be} ${m[3]}”.`; });
  add(new RegExp("(^ | and | because | but | so )((?:my|our|his|her|the|this|that) [a-z]+) ((?:very |so |really |quite |too )?)("+ADJ+") ","g"), (m)=>{ const n = m[2].split(" ")[1]; if(BASESET.has(n) || /^(very|so|is|are|was|were)$/.test(n)) return null; const be = /s$/.test(n) && !/ss$/.test(n) ? "are" : "is"; return `${m[1]}${m[2]} ${be} ${m[3]}${m[4]} `; },
    m=>{ const n = m[2].split(" ")[1]; const be = /s$/.test(n) && !/ss$/.test(n) ? "are" : "is"; return `Câu thiếu động từ “${be}”. Trước tính từ “${m[4]}” cần có “${be}”: “${m[2]} ${be} ${m[4]}”.`; });
  // 1c. số nhiều sau số đếm, many
  add(/ (two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|many|some|a lot of|lots of|these|those|several|\d+) ((?:big |small |new |old |good |beautiful |different |other |young )?)([a-z]+) /g, (m)=>{ if(m[1]==="some" || !NOUNS[m[3]]) return null; return ` ${m[1]} ${m[2]}${NOUNS[m[3]]} `; },
    m=>`Sau “${m[1]}” danh từ phải ở số nhiều: “${m[3]}” → “${NOUNS[m[3]]}”.`);
  add(/ (many|some|the|my|our|these|those|all|their) ([a-z]+s) (is|was) /g, (m)=>{ if(/(ss|us|is|ics|news|series)$/.test(m[2]) || !Object.values(NOUNS).includes(m[2]) && !/^(people|children)$/.test(m[2])) return null; return ` ${m[1]} ${m[2]} ${m[3]==="is" ? "are" : "were"} `; },
    m=>`“${m[2]}” là số nhiều nên dùng “${m[3]==="is" ? "are" : "were"}”, không dùng “${m[3]}”.`);
  // 2. am/is/are + động từ thường
  add(/ (i am|you are|we are|they are|he is|she is|it is) ((?:always |usually |often |sometimes |also |really |very )?)(like|love|enjoy|want|live|play|go|have|eat|watch|help|study|learn|think|know|need|prefer|use|work|visit|cook|do|make|get|read|ride|swim|sing|dance|draw|collect|grow|hate|wear|speak|walk) /g,
    (m)=>{ const subj = m[1].split(" ")[0]; let adv = m[2].replace("very ","really "); let v = m[3];
      if(q.type==="prog") return ` ${m[1]} ${adv}${ing(v)} `;
      if(q.type==="fut" || q.type==="going") return ` ${subj} will ${adv}${v} `;
      return ` ${subj} ${adv}${P_SING.has(subj) ? third(v) : v} `; },
    m=> q.type==="prog" ? `Sau “${m[1].split(" ")[1]}” em dùng động từ thêm “-ing”: “${ing(m[3])}”.` : `Không dùng “${m[1].split(" ")[1]}” trước động từ thường “${m[3]}”. Nói “${m[1].split(" ")[0]} ${m[3]}…”.`);
  // 3. I/you/we/they + V-s
  add(new RegExp(" (i|you|we|they) "+ADV+"([a-z]+) ","g"), (m, full)=>{
      const w = m[2], b = FROM3[w]; if(!b || BASESET.has(w)) return null;
      return full.replace(new RegExp(w+" $"), b+" "); },
    m=>`Chủ ngữ “${m[1]==="i"?"I":m[1]}” thì động từ giữ nguyên, không thêm s/es: “${m[2]}” → “${FROM3[m[2]]}”.`);
  // 4. he/she/it/danh từ số ít + động từ nguyên mẫu (thì hiện tại)
  add(new RegExp("( he | she |(?:^| and | because | but | so | when | if | think | that | know )(?:it|(?:my|our|his|her) (?:"+N_SING+")) )"+ADVC+"([a-z]+) ","g"), (m)=>{
      const w = m[3]; if(!BASESET.has(w)) return null;
      if(q.type==="past" || q.type==="fut" || q.type==="cond") return null;
      return `${m[1]}${m[2]}${third(w)} `; },
    m=>`Chủ ngữ số ít “${m[1].trim().replace(/^(and|because|but|so|when|if|think|that|know) /,"")}” ở thì hiện tại thì động từ thêm s/es: “${m[3]}” → “${third(m[3])}”.`);
  // 5. don't/doesn't/didn't/can/will... + động từ đã chia
  add(/ (he|she|it) (don't|do not) /g, " $1 doesn't ", m=>`Với “${m[1]}” em dùng “doesn't”, không dùng “don't”.`);
  add(/ (i|you|we|they) (doesn't|does not) /g, " $1 don't ", m=>`Với “${m[1]==="i"?"I":m[1]}” em dùng “don't”, không dùng “doesn't”.`);
  add(/ (don't|doesn't|didn't|do not|does not|did not|can|can't|cannot|will|won't|should|shouldn't|must|could|would|may|might) (to )?([a-z]+) /g, (m, full)=>{
      const w = m[3]; let b = BASESET.has(w) ? null : baseOf(w);
      if(m[1]==="would" && /^(like|love|prefer)$/.test(w)) return null;
      if(!b && !m[2]) return null; if(!b) b = w;
      return ` ${m[1]} ${b} `; },
    m=>{ const b = BASESET.has(m[3]) ? m[3] : baseOf(m[3]) || m[3]; return m[2] ? `Sau “${m[1]}” em dùng động từ nguyên mẫu, không có “to”: “${m[1]} ${b}”.` : `Sau “${m[1]}” động từ giữ nguyên mẫu: “${m[3]}” → “${b}”.`; });
  // 6. like/love/enjoy + động từ nguyên mẫu → V-ing
  add(/ (like|likes|love|loves|enjoy|enjoys|hate|hates|prefer|prefers|liked|enjoyed|loved|finish|finished|spend time|good at|interested in|fond of|keen on|bored with|tired of) ([a-z]+) /g, (m)=>{
      const w = m[2]; if(!BASESET.has(w) || w==="to") return null;
      if(/^(like|likes|love|loves|hate|hates|prefer|prefers|liked|loved)$/.test(m[1]) && /^(it|this|that|them|him|her|me|you|us)$/.test(w)) return null;
      // like + danh từ trùng động từ (like fish, like music…)
      if(/^(fish|walk|swim|dance|run|ride|drink|work|study|change|plant|help|harvest|surf|chat|draw|rest|exercise|text|order|report|research|support)$/.test(w) && /^(like|likes|love|loves|hate|hates|liked|loved)$/.test(m[1])) return null;
      return ` ${m[1]} ${ing(w)} `; },
    m=>`Sau “${m[1]}” em dùng động từ thêm “-ing”: “${m[1]} ${ing(m[2])}”.`);
  // 7. want/need/would like + động từ thiếu "to"
  add(/ (want|wants|wanted|need|needs|would like|hope|decide|plan|try|learn how|going) ((?:really )?)([a-z]+) /g, (m)=>{
      const w = m[3]; if(!BASESET.has(w) || w==="to") return null;
      if(/^(want|need)/.test(m[1]) && /^(help)$/.test(w)) return null;
      return ` ${m[1]} ${m[2]}to ${w} `; },
    m=>`Sau “${m[1]}” em cần thêm “to” trước động từ: “${m[1]} to ${m[3]}”.`);
  // 8. there have / there has
  add(/ there (have|has) ((?:a|an|one|many|some|lots of|a lot of|two|three|four|five|six|seven|eight|nine|ten|[a-z]+) )/g, (m)=>{
      const nx = m[2].trim(); const plural = /^(many|some|lots|a lot of|two|three|four|five|six|seven|eight|nine|ten)$/.test(nx) || /s$/.test(nx) && !/^(is|was|bus|class|glass)$/.test(nx);
      return ` there ${plural ? "are" : "is"} ${m[2]}`; },
    ()=>`Muốn nói “có” (cái gì ở đâu), em dùng “There is / There are”, không dùng “there have”.`);
  add(/ there is (many|some (?:[a-z]+s)|two|three|four|five|six|seven|eight|nine|ten|lots of|a lot of [a-z]+s) /g, " there are $1 ", m=>`Sau “There” mà danh từ số nhiều (${m[1]}…) thì dùng “are”: “There are…”.`);
  // 9. a / an
  add(/ a ([aeio][a-z]+) /g, (m)=>{ if(/^(one|once|eu|uni|use|usu|euro)/.test(m[1])) return null; return ` an ${m[1]} `; }, m=>`Trước từ bắt đầu bằng nguyên âm (“${m[1]}”) em dùng “an”, không dùng “a”.`);
  add(/ an ([bcdfgjklmnpqrstvwxyz][a-z]+) /g, (m)=>{ if(/^(hour|honest|honour|honor|heir)/.test(m[1])) return null; return ` a ${m[1]} `; }, m=>`Trước từ bắt đầu bằng phụ âm (“${m[1]}”) em dùng “a”, không dùng “an”.`);
  // 10. very like
  add(/ (i|we|they|you|he|she) very (like|likes|love|loves|enjoy|enjoys) /g, " $1 really $2 ", m=>`Tiếng Anh không nói “very ${m[2]}”. Nói “really ${m[2]}” hoặc “${m[2]} … very much”.`);
  // 11. giới từ hay sai
  add(/ listen (music|songs?|the radio|the teacher|my teacher|him|her|them|me) /g, " listen to $1 ", ()=>`“listen” cần “to”: “listen to music”.`);
  add(/ listening (music|songs?) /g, " listening to $1 ", ()=>`“listen” cần “to”: “listening to music”.`);
  add(/ (go|goes|went|come|comes|came|get|gets|got|going|coming) to home /g, " $1 home ", m=>`Không dùng “to” trước “home”: nói “${m[1]} home”.`);
  add(/ (in|at) (monday|tuesday|wednesday|thursday|friday|saturday|sunday|my birthday|weekends?) /g, (m)=>/weekend/.test(m[2]) ? ` at the ${m[2]} ` : ` on ${m[2]} `, m=>/weekend/.test(m[2]) ? `Nói “at the weekend” (hoặc “on weekends”).` : `Trước thứ trong tuần em dùng “on”: “on ${m[2]}”.`, null);
  add(/ (on|at) the (morning|afternoon|evening) /g, " in the $2 ", m=>`Nói “in the ${m[2]}”, không nói “${m[1]} the ${m[2]}”.`);
  add(/ in (the )?night /g, " at night ", ()=>`Nói “at night”, không nói “in night”.`);
  add(/ discuss about /g, " discuss ", ()=>`“discuss” không đi với “about”.`);
  add(/ (married) with /g, " $1 to ", ()=>`Nói “married to”, không nói “married with”.`);
  add(/ (afraid|scared) with /g, " $1 of ", m=>`Nói “${m[1]} of”, không nói “${m[1]} with”.`);
  add(/ (good|bad) in /g, " $1 at ", m=>`Nói “${m[1]} at” (giỏi/kém môn gì), không nói “${m[1]} in”.`);
  add(/ (interested|interesting) (about|with|on) /g, " interested in ", ()=>`Nói “interested in”.`);
  add(/ (play) (the )?(football|volleyball|badminton|basketball|chess|table tennis|soccer|tennis) /g, (m)=>m[2] ? ` ${m[1]} ${m[3]} ` : null, m=>`Không dùng “the” trước môn thể thao: “play ${m[3]}”.`);
  add(/ (play) (piano|guitar|gong|drum|violin|flute|t'rung) /g, " $1 the $2 ", m=>`Trước nhạc cụ em dùng “the”: “play the ${m[2]}”.`);
  // 12. so sánh
  add(/ more ([a-z]+er) /g, (m)=>NOT_ADJ_ER.has(m[1]) ? ` ${m[1]} ` : null, m=>`“${m[1]}” đã là so sánh hơn, không thêm “more”.`);
  add(/ more (big|small|quiet|cheap|fast|tall|short|old|new|hot|cold|busy|noisy|easy|happy|clean|safe|nice|large|long|high|young|fresh|cool|good|bad|hard|strong|green|smart|warm|slow|early|late) /g, m=>` ${SHORTADJ[m[1]]} `, m=>`Tính từ ngắn so sánh hơn thêm “-er”: “${SHORTADJ[m[1]]}”, không nói “more ${m[1]}”.`);
  add(/ (gooder|more good) /g, " better ", ()=>`So sánh hơn của “good” là “better”.`);
  add(/ (badder|more bad) /g, " worse ", ()=>`So sánh hơn của “bad” là “worse”.`);
  // 13. động từ quá khứ sai
  add(/ ([a-z]+ed) /g, (m)=>WRONGPAST.has(m[1]) ? ` ${IRR[FROMPAST[m[1]]]} ` : null, m=>`“${FROMPAST[m[1]]}” là động từ bất quy tắc, quá khứ là “${IRR[FROMPAST[m[1]]]}”, không phải “${m[1]}”.`);
  // 14. did + quá khứ
  add(/ (did|didn't|did not) (you |i |we |they |he |she )?([a-z]+) /g, (m)=>{ const w = m[3]; if(BASESET.has(w)) return null; const b = FROMPAST[w]; if(!b) return null; return ` ${m[1]} ${m[2]||""}${b} `; }, m=>`Sau “${m[1]}” động từ giữ nguyên mẫu: “${FROMPAST[m[3]]}”, không dùng “${m[3]}”.`);
  // 15. hiện tại hoàn thành: have/has + nguyên mẫu
  add(/ (i|you|we|they|he|she) (have|has) (ever |never |just |already )?([a-z]+) /g, (m)=>{
      const w = m[4]; if(!BASESET.has(w) || /^(have|to|a|an|the|got)$/.test(w)) return null;
      if(!m[3] && q.type!=="perf") return null;
      if(/^(fish|work|help|change|plant|drink|cook|walk|swim|dance|run|ride|read|cut|put|let|hit|study|rest|chat|surf|harvest)$/.test(w) && !m[3]) return null;
      return ` ${m[1]} ${m[2]} ${m[3]||""}${pp(w)} `; },
    m=>`Thì hiện tại hoàn thành: “have/has + quá khứ phân từ”: “${m[2]} ${pp(m[4])}”.`);
  return R;
}

/* thì quá khứ: câu hỏi về quá khứ mà em dùng hiện tại → đổi động từ sau chủ ngữ */
function pastFix(s){
  const re = new RegExp(" (i|we|they|he|she|it|my [a-z]+|people|children|students|you) "+ADVC+"([a-z]+) ","g");
  let changed = null;
  const out = s.replace(re, (all, subj, adv, v)=>{
    if(changed && changed.n > 2) return all;
    if(!(BASESET.has(v) || FROM3[v] || /^(am|is|are)$/.test(v))) return all;
    if(/^(read|put|cut|let)$/.test(v)) return all;
    let b = BASESET.has(v) ? v : FROM3[v];
    let p = v==="am"||v==="is" ? "was" : v==="are" ? "were" : past(b);
    changed = changed ? {from: changed.from+", "+v, to: changed.to+", "+p, n: changed.n+1} : {from:v, to:p, n:1};
    return ` ${subj} ${adv||""}${p} `;
  });
  return changed ? {s: out, changed} : null;
}
/* tương lai: câu hỏi "will" mà em dùng hiện tại */
function futFix(s){
  if(/ (will|won't|'ll|going to|gonna|would|want to|wants to|hope to|plan to|might|may) /.test(s)) return null;
  let changed = null;
  const out = s.replace(new RegExp(" (i|we|they|he|she|it|people|my [a-z]+|cities|robots|scientists) "+ADVC+"(am|is|are|[a-z]+) ","g"), (all, subj, adv, v)=>{
    if(changed) return all;
    if(v==="am"||v==="is"||v==="are"){ changed = {from:v, to:"will be"}; return ` ${subj} will ${adv||""}be `; }
    const b = BASESET.has(v) ? v : FROM3[v]; if(!b) return all;
    changed = {from:v, to:"will "+b}; return ` ${subj} will ${adv||""}${b} `;
  });
  return changed ? {s: out, changed} : null;
}
/* trả lời ngắn Yes/No phải hợp với trợ động từ của câu hỏi */
function shortAnswerFix(s, q){
  const m0 = q.q.match(/^(Do|Does|Did|Can|Will|Would|Is|Are|Have|Has|Was|Were|Should)\b/);
  if(!m0) return null;
  const aux = m0[1].toLowerCase();
  if(aux==="would" && /^Would you like/i.test(q.q)){
    const w = s.match(/^ (yes|no) ,? ?i (want|like|do|don't|do not)( it)? /);
    if(w) return {s: s.replace(w[0], ` ${w[1]}, i ${w[1]==="yes" ? "would" : "wouldn't"} `), vi:`Tân hỏi “Would you like …?” nên em đáp “${w[1]==="yes" ? "Yes, I would" : "No, I wouldn't"}”.`};
  }
  const m = s.match(/^ (yes|no) ,? ?(i|it|they|we|he|she|you|there) (do|does|did|am|is|are|can|will|was|were|have|has|would|should)( not|n't)? /);
  if(!m) return null;
  const subjMap = {you:"i"};
  const qSubj = (q.q.match(/^\w+ (you|it|they|he|she|there|people|life|your [a-z]+|[a-z]+)\b/i)||[])[1];
  if(m[2]==="there" && !/^(is|are|was|were)$/.test(aux)) return null;
  let want = aux;
  if(subjMap[(qSubj||"").toLowerCase()]==="i"){ if(aux==="are") want = "am"; if(aux==="were") want = "was"; if(aux==="does") want = "do"; if(aux==="has") want = "have"; }
  if(m[3]===want) return null;
  const neg = m[1]==="no" ? (want==="am" ? " not" : "n't") : "";
  const subj = m[2];
  const neww = want==="will" && neg ? "won't" : want==="can" && neg ? "can't" : want + neg;
  return {s: s.replace(m[0], ` ${m[1]}, ${subj} ${neww} `), vi:`Tân hỏi “${m0[1]} …?” nên em đáp “${m[1]==="yes"?"Yes":"No"}, ${subj==="i"?"I":subj} ${neww}”, không dùng “${m[3]}”.`};
}

/* ---------- in câu cho đẹp ---------- */
const PROPER = ["english","vietnamese","monday","tuesday","wednesday","thursday","friday","saturday","sunday","viet nam","vietnam","ha noi","hanoi","ho chi minh city","ho chi minh","gia lai","pleiku","vinh thanh","quy nhon","da lat","da nang","hue","tet","london","paris","tokyo","sydney","singapore","bangkok","seoul","new york","australia","england","canada","america","new zealand","ireland","britain","thailand","laos","cambodia","malaysia","indonesia","philippines","myanmar","brunei","japan","korea","china","korean","japanese","chinese","thai","american","asean","unicef","unesco","un","who","wto","mars","venus","jupiter","saturn","mercury","earth","bahnar","jrai","kinh","ede","bien ho","kon ka kinh","chu dang ya","ha long bay","halong bay","ha long","phong nha","son doong","mid-autumn","christmas","youtube","facebook","zalo","tiktok","google","messenger","instagram","duolingo","gemini","chatgpt","ai","tv","ict","pe","uk","usa","k-pop","tran thanh","lan","minh","nam","mai","hoa","an"];
function pretty(s, orig){
  let t = s.trim().replace(/ ([.,!?;:])/g,"$1").replace(/\(\s/g,"(").replace(/\s\)/g,")");
  t = t.replace(/\bi\b/g,"I").replace(/\bi'(m|ve|ll|d)\b/g,"I'$1");
  for(const p of PROPER){
    if(p==="an" || p==="who" || p==="un" || p==="ai" || p==="pe") { if(!new RegExp("\\b"+p.toUpperCase()+"\\b").test(orig)) continue; }
    if(p==="earth" && !/Earth/.test(orig) && !/the earth/.test(t)) continue;
    t = t.replace(new RegExp("\\b"+p.replace(/[-]/g,"\\-")+"\\b","g"), w=>{
      if(/^(uk|usa|un|asean|unicef|unesco|who|wto|ai|tv|ict|pe)$/.test(w)) return w.toUpperCase();
      return w.split(/([ -])/).map(x=>x.length>1 ? x[0].toUpperCase()+x.slice(1) : x).join(""); });
  }
  t = t.replace(/\bK-Pop\b/g,"K-pop").replace(/\bTv\b/g,"TV");
  // giữ chữ hoa em đã viết (tên riêng)
  (orig.match(/\b[A-ZĐ][\wÀ-ỹ'-]*/g)||[]).forEach((w,i)=>{ if(w.length>1 && w!=="I"){ const lw = w.toLowerCase(); t = t.replace(new RegExp("(^|[^\\wÀ-ỹ])"+lw.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"(?![\\wÀ-ỹ])","g"), "$1"+w); } });
  t = t.replace(/(^|[.!?] )([a-zà-ỹ])/g,(m,a,c)=>a+c.toUpperCase());
  t = t.replace(/^(Yes|No) (?!,)(?=(I|it|they|we|he|she|you|there)\b)/,"$1, ");
  if(!/[.!?]$/.test(t)) t += /^(what|where|when|why|how|who|which|do|does|did|can|could|will|would|is|are)\b/i.test(t) ? "?" : ".";
  return t[0].toUpperCase() + t.slice(1);
}

/* ---------- chấm ---------- */
function check(raw, q, unitWords){
  const out = {status:"ok", notes:[], fixed:"", model:q.a, praise:"", tip:"", used:[]};
  const text = String(raw||"").trim();
  if(!text){ out.status = "empty"; return out; }
  const plain = stripAccents(text.toLowerCase());
  const ws0 = text.split(/\s+/);
  const viCount = ws0.filter(w=>VI_CHARS.test(w)).length;
  if(viCount >= Math.max(2, ws0.length*0.4) || (ws0.length>=3 && (plain.match(new RegExp(VI_WORDS.source,"g"))||[]).length >= Math.ceil(ws0.length*0.5) && !/\b(i|you|the|is|are|my|it)\b/.test(plain))){
    out.status = "vi"; out.notes.push("Em đang nói tiếng Việt. Hãy thử nói bằng tiếng Anh nhé, nói ngắn cũng được."); return out;
  }
  let s = normSent(text);
  const before = s;
  // luật sửa
  const sa = shortAnswerFix(s, q); if(sa){ s = sa.s; out.notes.push(sa.vi); }
  // câu thiếu chủ ngữ: bắt đầu bằng động từ
  {
    const w0 = wordsOf(s), fw = w0[0] || "", nx = w0[1] || "";
    const verbStart = (BASESET.has(fw) || FROM3[fw]) && w0.length >= 2 && !/^(please|let)$/.test(fw) && !/^(and|is|are|was|or)$/.test(nx) && !/ , /.test(" "+w0.slice(0,2).join(" ")+" ,");
    if(verbStart){
      const subj = /\b(they|people|children|students|teenagers|tourists|visitors|robots|scientists|parents|individuals|ecotourists|schools)\b/i.test(q.q) && !/\byou\b/i.test(q.q) ? "they" : "i";
      const b = FROM3[fw] && !BASESET.has(fw) ? FROM3[fw] : fw;
      let rep;
      if(q.type==="can" && /\bcan\b/i.test(q.q)) rep = `${subj} can ${b}`;
      else if(q.type==="should") rep = `${subj} should ${b}`;
      else if(q.type==="fut") rep = `${subj} will ${b}`;
      else if(q.type==="past") rep = `${subj} ${past(b)}`;
      else rep = `${subj} ${b}`;
      s = s.replace(" "+fw+" ", " "+rep+" ");
      out.notes.push(`Câu tiếng Anh cần có chủ ngữ. Em thêm “${subj==="i"?"I":"They"}” ở đầu câu.`);
    } else if(/^(is|are|was|were) /.test(s.trim())){
      s = " it" + s; out.notes.push("Câu tiếng Anh cần có chủ ngữ. Em thêm “It” ở đầu câu.");
    }
  }
  for(const r of rules(q)){
    if(r.when && !r.when()) continue;
    s = s.replace(r.re, function(){
      const args = Array.prototype.slice.call(arguments);
      const m = args.slice(0, -2); // [full, g1, g2...]
      let rep = typeof r.to === "function" ? r.to(m, m[0]) : m[0].replace(new RegExp(r.re.source), r.to);
      if(rep == null || rep === m[0]) return m[0];
      const note = typeof r.vi === "function" ? r.vi(m) : r.vi;
      if(note && !out.notes.includes(note)) out.notes.push(note);
      return rep;
    });
  }
  // thì của câu hỏi
  const ws = wordsOf(s);
  const pre = (s.match(/^ (yes|no) ?,? ?[a-z]+ (did|was|were|didn't|wasn't|weren't|did not|was not|were not|have|has|haven't|hasn't) ?[.,]?/)||[""])[0];
  const body = " " + s.slice(pre.length).replace(/^ +/,"");
  const wantPast = q.type==="past" || / (yesterday|ago|last (week|year|month|night|summer|sunday|monday|time|weekend|saturday)) /.test(s);
  if(wantPast && !wordsOf(body).some(isPast) && !/ (have|has) (been|[a-z]+ed) /.test(s) && !/ used to /.test(s)){
    const pf = pastFix(body);
    if(pf){ s = (pre + pf.s).replace(/\s{2,}/g," "); out.notes.push(`Tân hỏi về chuyện đã qua nên em dùng thì quá khứ: “${pf.changed.from}” → “${pf.changed.to}”.`); }
  }
  if(q.type==="fut"){
    const ff = futFix(s);
    if(ff){ s = ff.s; out.notes.push(`Tân hỏi về tương lai nên em dùng “will”: “${ff.changed.from}” → “${ff.changed.to}”.`); }
  }
  if(q.type==="cond" && /^if /i.test(q.q) && / will /i.test(q.a) && / (would) /.test(s) && !/ would /i.test(q.q)){
    s = s.replace(/ would /, " will "); out.notes.push("Câu điều kiện loại 1 (If + hiện tại) thì vế sau dùng “will”, không dùng “would”.");
  }
  if(q.type==="cond" && /\b(were|could|met|joined|got|lived)\b/.test(q.q) && / will /.test(s) && !/ would /.test(s)){
    s = s.replace(/ will /, " would "); out.notes.push("Câu hỏi dùng “If … were/could …” (điều không có thật) nên em trả lời bằng “would”.");
  }
  out.fixed = pretty(s, text);
  out.notes = out.notes.map(n=>n.replace(/“i\b/g,"“I").replace(/“(\w)/g,(m,c)=>m));
  const changed = out.notes.length > 0;
  // độ dài, đúng ý, từ mới
  const n = ws.length;
  const keys = (q.k||[]);
  const ss = " " + stripAccents(s).replace(/[^a-z0-9' -]/g," ").replace(/\s+/g," ") + " ";
  const hit = !keys.length || keys.some(k=>ss.includes(" " + stripAccents(k).toLowerCase()));
  const uw = (unitWords||[]).filter(w=>w.length>2 && ss.includes(" " + w.toLowerCase() + (w.length>4 ? "" : " ")));
  out.used = uw.slice(0,3);
  if(changed){ out.status = "fixed"; }
  else if(n <= 2){ out.status = "short"; out.notes.push("Ý của em đúng hướng nhưng câu còn ngắn quá. Em hãy nói thành một câu đầy đủ có chủ ngữ và động từ."); }
  else if(!hit){ out.status = "off"; out.notes.push("Câu của em có vẻ chưa trả lời đúng câu hỏi của Tân. Em đọc lại câu hỏi và thử lại nhé."); }
  // khen và gợi ý
  if(out.status==="ok"){
    out.praise = n >= 8 ? "Câu dài, ý rõ ràng, đúng ngữ pháp. Giỏi lắm!" : "Đúng rồi! Câu của em rất tốt.";
    if(/\bwhy\b/i.test(q.q) && !/\b(because|so|since|as|to)\b/.test(ss)) out.tip = "Tân hỏi “Why?”, em nhớ thêm lý do bằng “because …” nhé.";
    else if(n < 6) out.tip = "Lần sau em thử nói dài hơn, thêm lý do bằng “because …”.";
  }
  if(out.used.length) out.praise = (out.praise ? out.praise + " " : "") + `Em dùng được từ của bài: “${out.used.join("”, “")}”.`;
  return out;
}

const api = {check, pretty, third, ing, past, pp, normSent};
if(typeof module !== "undefined" && module.exports) module.exports = api; else root.TanCham = api;
})(typeof window !== "undefined" ? window : this);
