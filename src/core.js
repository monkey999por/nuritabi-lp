// ミチップ LP 共通コア（全バリアント共通・build.mjs が <!--CORE_JS--> に注入する）
// 必須 DOM: #tripbox(中に Mock の trip-map.svg) #tmDay #tmSpots #tmKm #tmCaption
// バリアント側からのカスタマイズ:
//   window.MICHIP_TM = { startCaption, finalCaption, dayCaptions:{1:..}, dayLabel:fn(n), fallbackCaption:fn(n) }
//     … <!--CORE_JS--> より前の <script> で定義するとキャプション文言をテーマのトーンに差し替えられる
//   CSS 変数 --shuffle-bg / --shuffle-ink / --shuffle-border … 🎲ボタンの配色
//   data-reveal 属性 … ビューポート進入で .is-in が付く（動きの CSS はバリアント側で定義）
(function(){
  "use strict";

  var VARIANTS=__VARIANT_COUNT__; // build.mjs が実数に置換
  var TOTAL_KM=420;
  var cfg=window.MICHIP_TM||{};
  var FINAL_CAPTION=cfg.finalCaption||"5日間・15スポット・420km — サンプルの旅程が、一枚の記録になった。";
  var START_CAPTION=cfg.startCaption||"Mock旅程 5日間 — フロントエンドだけで描いたサンプル地図。";
  var DAY_CAPTIONS=cfg.dayCaptions||{
    1:"1日目、最初のピンを立てる。",
    2:"2日目、海沿いの寄り道をつなぐ。",
    3:"3日目、山あいの立ち寄りを追加する。",
    4:"4日目、戻り道にもピンを増やす。",
    5:"5日目、最後のスポットまでサンプルで記録する。"
  };
  var dayLabel=cfg.dayLabel||function(n){return n+"日目"};
  var fallbackCaption=cfg.fallbackCaption||function(n){return n+"日目を記録中。"};

  var reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var box=document.getElementById("tripbox");
  var dayEl=document.getElementById("tmDay");
  var spotsEl=document.getElementById("tmSpots");
  var kmEl=document.getElementById("tmKm");
  var capEl=document.getElementById("tmCaption");

  function setText(el,text){if(el)el.textContent=text}
  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms)})}
  function dayOf(el){return +(el&&el.getAttribute("data-day")||1)}

  function initTripPlayback(){
    if(!box)return;
    var pins=[].slice.call(box.querySelectorAll(".tm-pin"));
    var routes=[].slice.call(box.querySelectorAll(".tm-route"));
    if(!pins.length||!routes.length)return;

    var kmPerRoute=TOTAL_KM/routes.length;
    var maxDay=Math.max.apply(null,pins.map(dayOf).concat(routes.map(dayOf)));
    var token=0;

    function reset(){
      token++;
      pins.forEach(function(pin){pin.classList.remove("show")});
      routes.forEach(function(route){
        route.classList.remove("show");
        route.style.transition="none";
        try{
          var len=route.getTotalLength();
          route.style.strokeDasharray=String(len);
          route.style.strokeDashoffset=String(len);
        }catch(e){
          route.style.strokeDasharray="";
          route.style.strokeDashoffset="";
        }
      });
      setText(dayEl,dayLabel(1));
      setText(spotsEl,"0");
      setText(kmEl,"0");
      setText(capEl,START_CAPTION);
    }

    function showComplete(){
      pins.forEach(function(pin){pin.classList.add("show")});
      routes.forEach(function(route){
        route.classList.add("show");
        route.style.transition="none";
        route.style.strokeDasharray="";
        route.style.strokeDashoffset="0";
      });
      setText(dayEl,dayLabel(maxDay));
      setText(spotsEl,String(pins.length));
      setText(kmEl,String(TOTAL_KM));
      setText(capEl,FINAL_CAPTION);
    }

    function countKm(from,to,duration,myToken){
      var start=performance.now();
      return new Promise(function(resolve){
        function tick(now){
          if(myToken!==token){resolve();return}
          var p=Math.min(1,(now-start)/duration);
          var eased=1-Math.pow(1-p,3);
          setText(kmEl,Math.round(from+(to-from)*eased).toLocaleString("ja-JP"));
          if(p<1)requestAnimationFrame(tick);
          else resolve();
        }
        requestAnimationFrame(tick);
      });
    }

    async function play(){
      reset();
      var myToken=token;
      await sleep(260);
      var spotCount=0;
      var km=0;
      var routeIndex=0;

      for(var day=1;day<=maxDay;day++){
        if(myToken!==token)return;
        setText(dayEl,dayLabel(day));
        setText(capEl,DAY_CAPTIONS[day]||fallbackCaption(day));
        var dayPins=pins.filter(function(pin){return dayOf(pin)===day});
        var dayRoutes=routes.filter(function(route){return dayOf(route)===day});

        for(var i=0;i<dayPins.length;i++){
          if(myToken!==token)return;
          dayPins[i].classList.add("show");
          spotCount++;
          setText(spotsEl,String(spotCount));
          await sleep(i===0?360:180);

          var route=dayRoutes[i];
          if(route){
            var len=0;
            try{len=route.getTotalLength()}catch(e){}
            var duration=Math.max(600,Math.min(900,len?len*2.8:720));
            route.style.transition="none";
            if(len){
              route.style.strokeDasharray=String(len);
              route.style.strokeDashoffset=String(len);
            }
            route.getBoundingClientRect();
            route.classList.add("show");
            route.style.transition="stroke-dashoffset "+duration+"ms ease";
            route.style.strokeDashoffset="0";
            var nextKm=(routeIndex===routes.length-1)?TOTAL_KM:Math.round(kmPerRoute*(routeIndex+1));
            await countKm(km,nextKm,duration,myToken);
            km=nextKm;
            routeIndex++;
            await sleep(120);
          }
        }
      }

      setText(dayEl,dayLabel(maxDay));
      setText(spotsEl,String(pins.length));
      setText(kmEl,String(TOTAL_KM));
      setText(capEl,FINAL_CAPTION);
      await sleep(4000);
      if(myToken===token&&!document.hidden)play();
    }

    document.addEventListener("visibilitychange",function(){
      if(document.hidden)token++;
      else if(!reduced)play();
    });

    if(reduced)showComplete();
    else play();
  }

  initTripPlayback();

  // ── data-reveal: ビューポート進入で .is-in を付与（動きの CSS はバリアント側が定義）──
  (function(){
    var targets=[].slice.call(document.querySelectorAll("[data-reveal]"));
    if(!targets.length)return;
    targets.forEach(function(el){
      var delay=el.getAttribute("data-reveal-delay");
      if(delay)el.style.transitionDelay=delay+"ms";
    });
    if(reduced||!("IntersectionObserver" in window)){
      targets.forEach(function(el){el.classList.add("is-in")});
      return;
    }
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    },{threshold:.15,rootMargin:"0px 0px -8%"});
    targets.forEach(function(el){io.observe(el)});
  })();

  // ── フォーム未注入フォールバック: form-url.txt 未設定のプレビューで 404 iframe を見せない ──
  (function(){
    var frames=[].slice.call(document.querySelectorAll('iframe[src^="GOOGLE_FORM"]'));
    frames.forEach(function(frame){
      frame.style.display="none";
      var p=document.createElement("p");
      p.className="form-pending";
      p.textContent="登録フォームは準備中です。公開まで少しだけお待ちください。";
      if(!document.querySelector("style[data-form-pending]")){
        var st=document.createElement("style");
        st.setAttribute("data-form-pending","");
        st.textContent=".form-pending{display:grid;place-items:center;min-height:220px;padding:24px;text-align:center;font-weight:700;opacity:.75}";
        document.head.appendChild(st);
      }
      frame.parentNode.insertBefore(p,frame);
    });
  })();

  // ── 🎲 シャッフル: 別デザインの同じLPへ（回遊・話題性）──
  if(VARIANTS>1){
    var cur=(function(){var m=location.pathname.match(/v(\d+)\.html$/);return m?+m[1]:0})();
    var st=document.createElement("style");
    st.textContent=
      ".nrt-shuffle{position:fixed;right:16px;bottom:16px;z-index:99;"+
      "font:600 13px/1 -apple-system,'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif;"+
      "background:var(--shuffle-bg,rgba(16,16,20,.86));color:var(--shuffle-ink,#fff);border:1px solid var(--shuffle-border,rgba(255,255,255,.28));"+
      "border-radius:999px;padding:11px 18px;cursor:pointer;letter-spacing:.04em;"+
      "box-shadow:0 2px 14px rgba(0,0,0,.3);backdrop-filter:blur(4px)}"+
      ".nrt-shuffle:hover{filter:brightness(1.12)}"+
      ".nrt-shuffle:focus-visible{outline:2px solid currentColor;outline-offset:2px}"+
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
      try{localStorage.setItem("michip.lastv",String(n))}catch(e){}
      location.href="v"+n+".html";
    });
    document.body.appendChild(b);
  }
})();
