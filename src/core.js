// 塗り旅 LP 共通コア（全バリアント共通・build.mjs が <!--CORE_JS--> に注入する）
// 必須 DOM: #mapbox(中に地図SVG) #mapCaption #cnt #pct #gauge>i #rank #shareX
// 任意 DOM: #mapCta #joinLede
// 文言の上書き: ページ側で window.NURITABI_THEME = { rank(n), msg(n), demoCaption, share(n,pct,rank), joinLede(n) }
(function(){
  "use strict";
  var VARIANTS=__VARIANT_COUNT__; // build.mjs が実数に置換
  var NAMES={1:"北海道",2:"青森県",3:"岩手県",4:"宮城県",5:"秋田県",6:"山形県",7:"福島県",8:"茨城県",9:"栃木県",10:"群馬県",11:"埼玉県",12:"千葉県",13:"東京都",14:"神奈川県",15:"新潟県",16:"富山県",17:"石川県",18:"福井県",19:"山梨県",20:"長野県",21:"岐阜県",22:"静岡県",23:"愛知県",24:"三重県",25:"滋賀県",26:"京都府",27:"大阪府",28:"兵庫県",29:"奈良県",30:"和歌山県",31:"鳥取県",32:"島根県",33:"岡山県",34:"広島県",35:"山口県",36:"徳島県",37:"香川県",38:"愛媛県",39:"高知県",40:"福岡県",41:"佐賀県",42:"長崎県",43:"熊本県",44:"大分県",45:"宮崎県",46:"鹿児島県",47:"沖縄県"};

  // ── バリアント別の文言（未定義はデフォルト） ──
  var T=window.NURITABI_THEME||{};
  function defRank(n){
    var b;
    if(n===0)b="まっさら";
    else if(n<5)b="旅のたまご";
    else if(n<10)b="旅のはじまり";
    else if(n<20)b="週末の塗り師";
    else if(n<30)b="本格塗り師";
    else if(n<40)b="日本を巡る者";
    else if(n<47)b="制覇まであと"+(47-n)+"県";
    else b="全国制覇";
    return "称号: "+b;
  }
  function defMsg(n){
    if(n===0)return "行ったことのある県をタップ。あなたの地図は、まだ真っ白。";
    if(n<10)return "まだ日本は広い。";
    if(n<20)return "いい旅、してますね。";
    if(n<35)return "かなりの塗り師。";
    if(n<47)return "全国制覇が見えてきた。";
    return "全国制覇。次は市区町村単位で。";
  }
  function defShare(n,p,rank){
    return "私の日本制覇率は "+n+"/47（"+p+"%）、称号は「"+rank.replace(/^称号: /,"")+"」。あなたの地図は、どこまで塗れてる？ #塗り旅";
  }
  function defJoinLede(n){
    if(n===0)return "2026年内のβ公開を目指して開発中。事前登録いただいた方から順に招待します。";
    if(n<47)return "あなたの地図、残り "+(47-n)+" 県。ぜんぶ塗りに行こう——β公開の招待を受け取ってください。";
    return "47都道府県、制覇済みのあなたへ。次は市区町村、約1,700ピースの地図で。";
  }
  var rank=T.rank||defRank, msg=T.msg||defMsg, share=T.share||defShare,
      joinLedeText=T.joinLede||defJoinLede,
      demoCaption=T.demoCaption||"たとえば、東北一周 1,600km の旅。";

  // ── 要素 ──
  var box=document.getElementById("mapbox");
  var prefs=box?box.querySelectorAll(".prefecture"):[];
  var cnt=document.getElementById("cnt"),pct=document.getElementById("pct"),
      gauge=document.querySelector("#gauge i")||document.getElementById("gauge"),
      cap=document.getElementById("mapCaption"),
      cta=document.getElementById("mapCta"),rankEl=document.getElementById("rank"),
      shareEl=document.getElementById("shareX"),joinLede=document.getElementById("joinLede");
  var LP_URL=(function(){
    var m=document.querySelector('meta[property="og:url"]');
    return (m&&m.content)||location.href.split("#")[0];
  })();
  var KEY="nuritabi.painted"; // 全バリアント共通: デザインが変わっても塗りは引き継がれる
  var demoDone=false;

  function loadSaved(){
    try{
      var v=JSON.parse(localStorage.getItem(KEY)||"[]");
      return Array.isArray(v)?v:[];
    }catch(e){return []}
  }
  function save(){
    try{
      var codes=[].map.call(box.querySelectorAll(".prefecture.on"),function(g){
        return +g.getAttribute("data-code");
      });
      localStorage.setItem(KEY,JSON.stringify(codes));
    }catch(e){}
  }
  function painted(){return box.querySelectorAll(".prefecture.on").length}
  function update(){
    var n=painted(),p=(n/47*100).toFixed(1);
    if(cnt)cnt.textContent=(n<10?"0":"")+n;
    if(pct)pct.textContent=p+"%";
    if(gauge)gauge.style.width=(n/47*100)+"%";
    if(rankEl)rankEl.textContent=rank(n);
    if(shareEl)shareEl.href="https://x.com/intent/post?text="+encodeURIComponent(share(n,p,rank(n)))+"&url="+encodeURIComponent(LP_URL);
    if(demoDone){
      if(cap)cap.innerHTML="<b></b>",cap.firstChild.textContent=msg(n);
      if(shareEl)shareEl.classList.toggle("show",n>0);
      if(cta&&n>0)cta.classList.add("show");
      if(joinLede){var t=joinLedeText(n);if(t)joinLede.textContent=t}
    }
  }
  prefs.forEach(function(g){
    var code=+g.getAttribute("data-code");
    g.setAttribute("role","button");
    g.setAttribute("tabindex","0");
    g.setAttribute("aria-label",NAMES[code]||"");
    function toggle(){g.classList.toggle("on");demoDone=true;update();save()}
    g.addEventListener("click",toggle);
    g.addEventListener("keydown",function(e){
      if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle()}
    });
  });

  // 復元: 塗った地図は localStorage 共有。再訪・バリアント切替でもそのまま出る
  var saved=loadSaved();
  var reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function byCode(c){return box.querySelector('.prefecture[data-code="'+c+'"]')}
  if(!box||prefs.length===0){/* no map */}
  else if(saved.length>0){
    saved.forEach(function(c){var g=byCode(c);if(g)g.classList.add("on")});
    demoDone=true;
    update();
  }
  else if(reduced){
    demoDone=true;
    update();
  }else{
    // 初回デモ: 東北一周ドライブが塗られていく → 白紙に戻して「あなたの番」
    var route=[11,9,7,6,4,3,2]; // 埼玉→栃木→福島→山形→宮城→岩手→青森
    if(cap)cap.textContent=demoCaption;
    var i=0;
    var t=setInterval(function(){
      if(demoDone){clearInterval(t);return} // ユーザーが先に触ったら譲る
      if(i<route.length){
        var g=byCode(route[i++]);
        if(g)g.classList.add("on");
        update();
      }else{
        clearInterval(t);
        setTimeout(function(){
          if(demoDone)return;
          prefs.forEach(function(g){g.classList.remove("on")});
          demoDone=true;
          update();
        },1400);
      }
    },430);
  }
  update();

  // ── 🎲 シャッフル: 別デザインの同じLPへ（回遊・話題性）──
  if(VARIANTS>1){
    var cur=(function(){var m=location.pathname.match(/v(\d+)\.html$/);return m?+m[1]:0})();
    var st=document.createElement("style");
    st.textContent=
      ".nrt-shuffle{position:fixed;right:16px;bottom:16px;z-index:99;"+
      "font:600 13px/1 -apple-system,'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif;"+
      "background:rgba(16,16,20,.86);color:#fff;border:1px solid rgba(255,255,255,.28);"+
      "border-radius:999px;padding:11px 18px;cursor:pointer;letter-spacing:.04em;"+
      "box-shadow:0 2px 14px rgba(0,0,0,.3);backdrop-filter:blur(4px)}"+
      ".nrt-shuffle:hover{background:rgba(16,16,20,.96)}"+
      ".nrt-shuffle:focus-visible{outline:2px solid #fff;outline-offset:2px}"+
      "@media print{.nrt-shuffle{display:none}}";
    document.head.appendChild(st);
    var b=document.createElement("button");
    b.type="button";
    b.className="nrt-shuffle";
    b.textContent="🎲 別のデザインで見る";
    b.setAttribute("aria-label","別のデザインでこのページを見る");
    b.addEventListener("click",function(){
      var n;
      do{n=1+Math.floor(Math.random()*VARIANTS)}while(n===cur&&VARIANTS>1);
      try{localStorage.setItem("nuritabi.lastv",String(n))}catch(e){}
      location.href="v"+n+".html";
    });
    document.body.appendChild(b);
  }
})();
