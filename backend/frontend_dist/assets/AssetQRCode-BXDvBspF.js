import{a as e,l as t,o as n,s as r}from"./api-DVjQ8yrN.js";import{o as i}from"./dist-Bc8Oh59Z.js";import{t as a}from"./copy-9Pq-utL6.js";import{t as o}from"./printer-EjfTHSct.js";import{a as s,i as c,n as l,o as u,r as d,t as f}from"./Dialog-DH7nT5in.js";import{U as p,d as m,ot as h,vt as g}from"./index-DA7B9_PF.js";var _=e(`circle-check-big`,[[`path`,{d:`M21.801 10A10 10 0 1 1 17 3.335`,key:`yps3ct`}],[`path`,{d:`m9 11 3 3L22 4`,key:`1pflzl`}]]),v=t(r(),1),y=n();function b(e){let t=Array.from({length:21},()=>Array(21).fill(!1));function n(e,n){for(let r=0;r<7;r++)for(let i=0;i<7;i++)(r===0||r===6||i===0||i===6||r>=2&&r<=4&&i>=2&&i<=4)&&(t[n+r][e+i]=!0)}n(0,0),n(14,0),n(0,14);for(let e=8;e<13;e++)e%2==0&&(t[6][e]=!0,t[e][6]=!0);let r=0;for(let t=0;t<e.length;t++)r=(r<<5)-r+e.charCodeAt(t),r|=0;let i=0;for(let e=0;e<21;e++)for(let n=0;n<21;n++){if(e<8&&n<8||e<8&&n>=13||e>=13&&n<8||e===6||n===6)continue;let a=Math.sin(r+i*13+e*7+n*3)>0;t[e][n]=a,i++}return t}function x({title:e,subtitle:t,code:n,type:r=`inventory`,open:_,onOpenChange:x}){let[S,C]=(0,v.useState)(!1),w=(0,v.useMemo)(()=>b(n||e||`NASF-ASSET`),[n,e]);return!n&&!e?null:(0,y.jsx)(f,{open:_,onOpenChange:x,children:(0,y.jsxs)(l,{className:`max-w-md p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 overflow-hidden`,children:[(0,y.jsx)(s,{className:`p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/5`,children:(0,y.jsxs)(`div`,{className:`space-y-1 text-start`,children:[(0,y.jsxs)(u,{className:`text-title font-bold text-slate-900 dark:text-white flex items-center gap-2`,children:[(0,y.jsx)(g,{className:`w-5 h-5 text-[#2B95E8]`}),(0,y.jsx)(`span`,{children:`ملصق ورمز الاستجابة السريعة (QR Tag)`})]}),(0,y.jsx)(d,{className:`text-caption`,children:`ملصق مشفر للتحقق الفوري وجرد الأصول والعهد الميدانية`})]})}),(0,y.jsx)(`div`,{className:`p-6 flex flex-col items-center justify-center space-y-4 bg-white text-slate-900`,id:`asset-qr-print`,children:(0,y.jsxs)(`div`,{className:`w-full max-w-[320px] p-5 rounded-2xl border-2 border-slate-900 bg-white shadow-sm space-y-4`,children:[(0,y.jsxs)(`div`,{className:`flex items-center justify-between border-b border-slate-200 pb-2.5`,children:[(0,y.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,y.jsx)(`img`,{src:p,alt:`شعار`,className:`w-8 h-8 object-contain rounded-full`}),(0,y.jsxs)(`div`,{className:`text-right`,children:[(0,y.jsx)(`p`,{className:`text-caption font-bold text-slate-900`,children:`القوى المساندة`}),(0,y.jsx)(`p`,{className:`text-caption text-slate-500 font-mono`,children:`NASF ASSET TAG`})]})]}),(0,y.jsx)(m,{variant:`primary`,className:`text-caption px-2 py-0.5 font-mono`,children:r===`vehicle`?`آلية / مركبة`:`عهدة / صنف`})]}),(0,y.jsx)(`div`,{className:`flex justify-center p-3 bg-white border border-slate-200 rounded-xl`,children:(0,y.jsx)(`svg`,{viewBox:`0 0 21 21`,className:`w-40 h-40 shape-rendering-crispEdges`,children:w.map((e,t)=>e.map((e,n)=>e?(0,y.jsx)(`rect`,{x:n,y:t,width:`1`,height:`1`,fill:`#0a0d14`},`${t}-${n}`):null))})}),(0,y.jsxs)(`div`,{className:`text-center space-y-1`,children:[(0,y.jsx)(`p`,{className:`font-bold text-body-sm text-slate-900`,children:e}),t&&(0,y.jsx)(`p`,{className:`text-caption text-slate-500`,children:t}),(0,y.jsx)(`div`,{className:`pt-2`,children:(0,y.jsx)(`span`,{className:`inline-block px-3 py-1 bg-slate-100 rounded-lg font-mono font-bold text-caption text-slate-900 border border-slate-300`,children:n})})]})]})}),(0,y.jsxs)(c,{className:`p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-between`,children:[(0,y.jsxs)(h,{variant:`outline`,size:`sm`,onClick:()=>{navigator.clipboard.writeText(n||``),C(!0),setTimeout(()=>C(!1),2e3)},className:`gap-1.5 rounded-xl font-mono`,children:[S?(0,y.jsx)(i,{className:`w-4 h-4 text-emerald-600`}):(0,y.jsx)(a,{className:`w-4 h-4`}),(0,y.jsx)(`span`,{children:S?`تم النسخ`:`نسخ الكود`})]}),(0,y.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,y.jsx)(h,{variant:`outline`,size:`sm`,onClick:()=>x(!1),className:`rounded-xl`,children:`إغلاق`}),(0,y.jsxs)(h,{variant:`primary`,size:`sm`,onClick:()=>{let t=document.getElementById(`asset-qr-print`);if(!t)return;let r=window.open(``,`_blank`,`width=650,height=750`);if(!r){showToast(`يرجى السماح بالنوافذ المنبثقة للطباعة`,`error`);return}r.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <title>ملصق QR - ${e||n}</title>
          <style>
            @page { size: auto; margin: 15mm; }
            body {
              font-family: Cairo, system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              min-height: 90vh;
              margin: 0;
              background: #fff;
              color: #0a2540;
            }
            .tag-container {
              width: 320px;
              padding: 24px;
              border: 2px solid #0f172a;
              border-radius: 20px;
              text-align: center;
              box-sizing: border-box;
            }
            table { margin: 16px auto; }
          </style>
        </head>
        <body>
          <div class="tag-container">
            ${t.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          <\/script>
        </body>
      </html>
    `),r.document.close()},className:`gap-1.5 rounded-xl font-bold`,children:[(0,y.jsx)(o,{className:`w-4 h-4`}),(0,y.jsx)(`span`,{children:`طباعة الملصق`})]})]})]})]})})}export{_ as n,x as t};