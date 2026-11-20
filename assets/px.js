/* Whop pixel (21 Nov 2026): page views + funnel events land in Whop → Websites / Analytics, next to trials and payments.
   Snippet from docs.whop.com/developer/ads/pixel, scoped to the Noodlecafé Sessions business. */
if (location.hostname !== "noodlecafe.github.io") { window.whop = { q: [], track: function () { window.whop.q.push([].slice.call(arguments)); console.log("[whop test]", [].slice.call(arguments)); }, setScope: function () {} }; }   /* local tests: log only, no fake data in Whop */
!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});a.q.push([+new Date,"setScope"].concat(a.s))},scope:function(){var c=[].slice.call(arguments);return{track:function(){a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};b=d.createElement(s);b.async=1;b.src=u+"/s.js";d.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}(window,document,"script","https://t.whop.tw","whop");
whop.setScope("biz_rpiqR0kuJZgleX");
whop.track("page");
