if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const f=e||("document"in self?document.currentScript.src:"")||location.href;if(s[f])return;let o={};const t=e=>i(e,f),l={module:{uri:f},exports:o,require:t};s[f]=Promise.all(n.map((e=>l[e]||t(e)))).then((e=>(r(...e),o)))}}define(["./workbox-e3490c72"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"404.html",revision:"cbed2a0a9e10f643d6ecdca07fa8b6a2"},{url:"assets/browser-KRBzhmzy.js",revision:null},{url:"assets/index-D-Xodb0M.css",revision:null},{url:"assets/index-DCIR4-ac.js",revision:null},{url:"index.html",revision:"f6bcdb0f38a8f6d0024efb3b6ef7f092"},{url:"manifest.webmanifest",revision:"4fb9e023f0f8b9573dd509269e467ed2"},{url:"pwa-192x192.png",revision:"37d797d802ec35eb08bb8a00ea272600"},{url:"pwa-512x512.png",revision:"1f5893634f785195f2d866a8080757a7"},{url:"registerSW.js",revision:"402b66900e731ca748771b6fc5e7a068"},{url:"pwa-192x192.png",revision:"37d797d802ec35eb08bb8a00ea272600"},{url:"pwa-512x512.png",revision:"1f5893634f785195f2d866a8080757a7"},{url:"manifest.webmanifest",revision:"4fb9e023f0f8b9573dd509269e467ed2"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
