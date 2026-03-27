import{a as B,S as i,n as N,s as p}from"./index-CNGE2Q7e.js";import{themeStyleBlock as J}from"./theme-DPp7_AaX.js";import{LAYOUT_NAMES as Q,getRenderer as X}from"./renderers-C9qDyqKT.js";function ee({value:t="",onChange:e,placeholder:a=""}={}){const n=document.createElement("div");n.className="rt-toolbar",n.innerHTML=`
    <button type="button" class="rt-btn" data-cmd="bold" title="Negrito (Ctrl+B)"><strong>B</strong></button>
    <button type="button" class="rt-btn" data-cmd="italic" title="Itálico (Ctrl+I)"><em>I</em></button>
    <button type="button" class="rt-btn rt-btn-accent" data-cmd="accent" title="Cor de destaque">A</button>`;const s=document.createElement("div");s.className="rt-editor field-input",s.contentEditable="true",s.setAttribute("data-placeholder",a),s.innerHTML=$(t);const d=document.createElement("div");d.className="rt-wrap",d.appendChild(n),d.appendChild(s);function r(c){s.focus(),c==="bold"?document.execCommand("bold",!1):c==="italic"?document.execCommand("italic",!1):c==="accent"&&l(),g(),e==null||e(m())}function l(){var T;const c=window.getSelection();if(!c.rangeCount||c.isCollapsed)return;const E=c.getRangeAt(0),L=(T=c.anchorNode)==null?void 0:T.parentElement;if(L!=null&&L.classList.contains("accent")){const w=L,I=document.createDocumentFragment();for(;w.firstChild;)I.appendChild(w.firstChild);w.replaceWith(I)}else{const w=document.createElement("span");w.className="accent";try{E.surroundContents(w)}catch{}}}function g(){s.innerHTML=s.innerHTML.replace(/<b>/gi,"<strong>").replace(/<\/b>/gi,"</strong>").replace(/<i>/gi,"<em>").replace(/<\/i>/gi,"</em>")}function m(){return $(s.innerHTML)}function y(c){s.innerHTML=$(c)}function $(c){return(c||"").replace(/<(?!\/?(?:em|strong|span)[^>]*>)[^>]+>/gi,"").replace(/<span(?!\s+class="accent")[^>]*>/gi,'<span class="accent">')}return n.addEventListener("mousedown",c=>{const E=c.target.closest("[data-cmd]");E&&(c.preventDefault(),r(E.dataset.cmd))}),s.addEventListener("input",()=>e==null?void 0:e(m())),s.addEventListener("keydown",c=>{(c.ctrlKey||c.metaKey)&&c.key==="b"&&(c.preventDefault(),r("bold")),(c.ctrlKey||c.metaKey)&&c.key==="i"&&(c.preventDefault(),r("italic"))}),{el:d,getValue:m,setValue:y}}function te(t,e){var s;const a=d=>String(d??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),n={headline_html:()=>t.headline?a(t.headline)+(t.headline_italic?" <em>"+a(t.headline_italic)+"</em>":""):"",body_html:()=>a(t.body||""),conclusion_html:()=>a(t.conclusion||""),call_to_action_html:()=>t.call_to_action?a(t.call_to_action)+(t.call_to_action_italic?" <em>"+a(t.call_to_action_italic)+"</em>":""):""};return((s=n[e])==null?void 0:s.call(n))||""}function D(t,e,a,n){const s=document.createElement("div");s.className="form-group";const d=document.createElement("div");d.className="field-label",d.textContent=a,s.appendChild(d);const r=ee({value:t[e]||te(t,e)||"",placeholder:a,onChange:l=>{t[e]=l,n()}});return s.appendChild(r.el),s}const ie={dark:{template:"dark",layout:"a",section_number:"",section_title:"",body:"",list_items:[],conclusion:""}};let G=[],A=null,U=0;function ae(t){clearInterval(A),U=0,document.getElementById("app").innerHTML=`
    <div class="generating-screen">
      <div class="generating-inner">
        <div class="generating-label">Gerando carrossel</div>
        <div class="generating-topic">${f(t)}</div>
        <div class="gen-bar-wrap"><div id="gen-bar" class="gen-bar"></div></div>
        <div id="gen-log" class="gen-log"></div>
        <div id="gen-elapsed" class="gen-elapsed">0s</div>
      </div>
    </div>`;let e=0;A=setInterval(()=>{e++;const a=document.getElementById("gen-elapsed");a&&(a.textContent=e+"s")},1e3)}function _(t,e="pending"){const a=document.getElementById("gen-log");if(!a)return null;const n="ge"+U++,s=document.createElement("div");return s.className=`gen-entry gen-${e}`,s.id=n,s.innerHTML=`<span class="gen-dot"></span><span class="gen-msg">${f(t)}</span>`,a.appendChild(s),requestAnimationFrame(()=>requestAnimationFrame(()=>s.classList.add("in"))),a.scrollTop=a.scrollHeight,n}function O(t){var e;(e=document.getElementById(t))==null||e.classList.replace("gen-pending","gen-done")}function h(t){const e=document.getElementById("gen-bar");e&&(e.style.width=t+"%")}function F(){clearInterval(A),A=null}function f(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function M(t){const e=i.slides[t];if(!e)return'<!DOCTYPE html><html><body style="background:#111;width:1080px;height:1350px;"></body></html>';const n=X(e)(e,i.images[t]||null,i.theme);return`<!DOCTYPE html><html><head><meta charset="UTF-8">${J(i.theme)}</head><body style="margin:0;overflow:hidden;">${n}</body></html>`}function se(){G.forEach(e=>{clearInterval(e),clearTimeout(e)}),G=[];const t=document.getElementById("canvas-loading");t&&t.classList.add("hidden")}function q(){ne(),v(),S()}function ne(){const t=document.getElementById("sidebar");if(!t)return;t.innerHTML="",i.slides.forEach((a,n)=>{const s=document.createElement("div");s.className="thumb-item"+(n===i.active?" active":""),s.onclick=()=>V(n);const d=document.createElement("div");d.className="thumb-wrap";const r=document.createElement("iframe");r.srcdoc=M(n),r.title="Slide "+(n+1),d.appendChild(r);const l=document.createElement("div");l.className="thumb-label",l.textContent=n+1+" · "+a.template,s.appendChild(d),s.appendChild(l),t.appendChild(s)});const e=document.createElement("button");e.className="btn-add-slide",e.textContent="+ Slide",e.onclick=Ee,t.appendChild(e)}function v(){const t=document.getElementById("preview-col"),e=document.getElementById("preview-wrap");if(!t||!e)return;const a=t.clientHeight-80,n=t.clientWidth-32,s=Math.min(a/1350,n/1080,1),d=Math.round(1080*s),r=Math.round(1350*s);e.style.width=d+"px",e.style.height=r+"px",e.style.overflow="hidden",e.style.flexShrink="0",e.innerHTML="";const l=document.createElement("iframe");l.style.width="1080px",l.style.height="1350px",l.style.transformOrigin="top left",l.style.transform=`scale(${s})`,l.style.border="none",l.style.display="block",l.srcdoc=M(i.active),l.title="Preview",e.appendChild(l);const g=i.slides[i.active],m=document.getElementById("layout-pills");if(g&&m){const y=Q[g.template]||{},$=g.layout||"a";m.innerHTML=Object.entries(y).map(([c,E])=>`<button class="pill${c===$?" active":""}" data-layout="${f(c)}">${f(E)}</button>`).join(""),m.querySelectorAll(".pill").forEach(c=>{c.onclick=()=>we(c.dataset.layout)})}}function S(){var H,j,R;const t=document.getElementById("edit-panel");if(!t)return;const e=i.slides[i.active];if(!e){t.innerHTML="";return}const a=e.template,n=["cover","split","overlay"].includes(a),s=i.images[i.active],d=i.slides.length>1;function r(o,u,b){return`<div class="field-group"><div class="field-label">${f(u)}</div>
      <input class="field-input" value="${f(b||"")}" data-key="${f(o)}"></div>`}let l=`<div class="panel-header">
    <div class="panel-title">Slide ${i.active+1} · ${f(a)}</div>
    ${d?'<button class="btn-delete" id="btn-delete-slide">Excluir</button>':""}
  </div>`;if(n&&(l+=`<div class="field-group"><div class="field-label">Imagem</div>
      ${s?`<div class="img-preview-wrap">
             <img class="img-preview" src="${s}">
             <button class="btn-remove-img" id="btn-remove-img">Remover</button>
           </div>`:`<div class="drop-zone">
             <input type="file" accept="image/*" id="inp-img">
             <div class="drop-zone-icon">⊕</div>
             <div class="drop-zone-text">Clique para fazer upload<br>JPG · PNG · WEBP</div>
           </div>`}
    </div>`,s)){const o=((H=e.img_position)==null?void 0:H.x)??50,u=((j=e.img_position)==null?void 0:j.y)??50,b=Math.round((((R=e.img_position)==null?void 0:R.scale)??1)*100);l+=`<div class="field-group">
        <div class="field-label">Posição &amp; Zoom</div>
        <div class="img-pos-row"><span class="img-pos-lbl">H</span><input type="range" class="img-pos-slider" data-img-pos="x" min="0" max="100" value="${o}"><span class="img-pos-val" id="img-pos-x-val">${o}%</span></div>
        <div class="img-pos-row"><span class="img-pos-lbl">V</span><input type="range" class="img-pos-slider" data-img-pos="y" min="0" max="100" value="${u}"><span class="img-pos-val" id="img-pos-y-val">${u}%</span></div>
        <div class="img-pos-row"><span class="img-pos-lbl">Zoom</span><input type="range" class="img-pos-slider" data-img-pos="scale" min="100" max="300" step="5" value="${b}"><span class="img-pos-val" id="img-pos-s-val">${b}%</span></div>
      </div>`}(a==="cover"||a==="split")&&(l+='<div data-rich="headline_html"></div>',l+='<div data-rich="body_html"></div>'),a==="dark"&&(l+=r("section_number","Número da seção",e.section_number),l+=r("section_title","Título da seção",e.section_title),l+='<div data-rich="body_html"></div>',l+=`<div class="field-group"><div class="field-label">Itens da lista</div>
      <div class="list-items-wrap" id="list-items-wrap">
        ${(e.list_items||[]).map((o,u)=>`<div class="list-item-row">
            <input class="field-input" value="${f(o)}" data-list-idx="${u}">
            <button class="btn-remove" data-list-remove="${u}">×</button>
          </div>`).join("")}
      </div>
      ${(e.list_items||[]).length<4?'<button class="btn-add-item" id="btn-add-list-item">+ Adicionar</button>':""}
    </div>`,l+='<div data-rich="conclusion_html"></div>'),a==="steps"&&(l+=r("section_title","Título (opcional)",e.section_title||""),l+=`<div class="field-group"><div class="field-label">Etapas</div>
      <div class="steps-wrap" id="steps-wrap">
        ${(e.steps||[]).map((o,u)=>`<div class="step-row">
            <div class="step-row-top">
              <input class="field-input step-label-input" value="${f(o.label)}" placeholder="Etapa ${u+1}" data-step-idx="${u}" data-step-field="label">
              <button class="btn-remove" data-step-remove="${u}">×</button>
            </div>
            <div data-rich="step_text_html_${u}"></div>
            ${e.layout==="c"?oe(u,(e.steps[u]||{}).icon):""}
          </div>`).join("")}
      </div>
      ${(e.steps||[]).length<4?'<button class="btn-add-item" id="btn-add-step">+ Etapa</button>':""}
    </div>`,l+='<div data-rich="call_to_action_html"></div>'),a==="overlay"&&(l+=r("section_number","Número da seção",e.section_number),l+=r("section_title","Título",e.section_title),l+='<div data-rich="headline_html"></div>',l+='<div data-rich="body_html"></div>'),a==="cta"&&(l+='<div data-rich="headline_html"></div>',l+='<div data-rich="body_html"></div>',l+=r("cta_text","Texto do CTA",e.cta_text),l+=r("cta_word","Palavra em destaque",e.cta_word),l+=r("cta_suffix","Sufixo do CTA",e.cta_suffix)),l+=`<div class="refine-section">
    <button class="btn-refine" id="btn-refine-toggle">✦ Refinar com IA</button>
    <div id="refine-wrap" class="refine-input-wrap">
      <textarea id="refine-instr" class="field-textarea" placeholder="O que você quer mudar neste slide?" rows="3"></textarea>
      <div class="refine-actions">
        <button id="btn-refine-ok" class="btn-confirm">Refinar</button>
        <button id="btn-refine-cancel" class="btn-cancel">Cancelar</button>
      </div>
    </div>
  </div>`,t.innerHTML=l;const g=()=>{x(i.active),v(),p()},m={headline_html:"Headline",body_html:"Corpo",conclusion_html:"Conclusão",call_to_action_html:"Chamada final"};t.querySelectorAll("[data-rich]").forEach(o=>{var P;const u=o.dataset.rich,b=u.match(/^step_text_html_(\d+)$/);if(b){const Y=Number(b[1]),C=(P=e.steps)==null?void 0:P[Y];if(!C)return;!C.text_html&&C.text&&(C.text_html=String(C.text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"));const Z=D(C,"text_html","Texto da etapa",g);o.replaceWith(Z);return}const k=m[u]||u,K=D(e,u,k,g);o.replaceWith(K)}),t.querySelectorAll("input[data-key], textarea[data-key]").forEach(o=>{o.addEventListener("input",()=>me(o.dataset.key,o.value))});const y=t.querySelector("#btn-delete-slide");y&&(y.onclick=ye);const $=t.querySelector("#btn-remove-img");$&&($.onclick=xe);const c=t.querySelector("#inp-img");c&&(c.onchange=o=>_e(o)),t.querySelectorAll(".img-pos-slider").forEach(o=>{o.addEventListener("input",()=>{const u=i.slides[i.active];u.img_position||(u.img_position={x:50,y:50,scale:1});const b=o.dataset.imgPos;if(b==="scale"){u.img_position.scale=Number(o.value)/100;const k=document.getElementById("img-pos-s-val");k&&(k.textContent=o.value+"%")}else{u.img_position[b]=Number(o.value);const k=document.getElementById(`img-pos-${b}-val`);k&&(k.textContent=o.value+"%")}x(i.active),v(),p()})}),t.querySelectorAll("input[data-list-idx]").forEach(o=>{o.addEventListener("input",()=>pe(Number(o.dataset.listIdx),o.value))}),t.querySelectorAll("[data-list-remove]").forEach(o=>{o.onclick=()=>ge(Number(o.dataset.listRemove))});const E=t.querySelector("#btn-add-list-item");E&&(E.onclick=ve),t.querySelectorAll("input[data-step-idx]").forEach(o=>{o.addEventListener("input",()=>fe(Number(o.dataset.stepIdx),o.dataset.stepField,o.value))}),t.querySelectorAll("[data-step-remove]").forEach(o=>{o.onclick=()=>he(Number(o.dataset.stepRemove))});const L=t.querySelector("#btn-add-step");L&&(L.onclick=be);const T=t.querySelector("#btn-refine-toggle");T&&(T.onclick=()=>{const o=document.getElementById("refine-wrap");o&&o.classList.toggle("open")});const w=t.querySelector("#btn-refine-ok");w&&(w.onclick=Se);const I=t.querySelector("#btn-refine-cancel");I&&(I.onclick=()=>{const o=document.getElementById("refine-wrap");o&&o.classList.remove("open")}),ce()}function z(t,e=48,a="#333"){if(!window.lucide||!lucide.icons[t])return null;const[,,n]=lucide.icons[t],s=n.map(([d,r])=>{const l=Object.entries(r).map(([g,m])=>`${g}="${m}"`).join(" ");return`<${d} ${l}/>`}).join("");return`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="${a}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${s}</svg>`}function le(t){return window.lucide?Object.keys(lucide.icons).filter(e=>e.includes(t.toLowerCase().replace(/\s+/g,"-"))).slice(0,30):[]}function oe(t,e){const a=(e==null?void 0:e.type)==="lucide"&&e.svg?e.svg:null,n=(e==null?void 0:e.type)==="upload"?e.src:null,s=a||(n?`<img src="${n}" style="width:18px;height:18px;object-fit:contain;">`:'<div style="width:18px;height:18px;border:1px dashed #333;border-radius:3px;"></div>');return`<div class="icon-picker" id="icon-picker-${t}">
    <div class="field-label">Ícone</div>
    <div class="icon-current">${s}<span style="font-size:11px;color:#555;">${f((e==null?void 0:e.name)||"nenhum")}</span></div>
    <div class="icon-search-wrap">
      <input class="field-input icon-search-input" placeholder="buscar ícone…" data-icon-search="${t}">
    </div>
    <div id="icon-grid-${t}" class="icon-grid"></div>
    <div style="display:flex;align-items:center;gap:6px;">
      <span class="field-label" style="margin:0;">ou upload</span>
      <input type="file" accept="image/png,image/svg+xml" style="font-size:11px;color:#666;flex:1;" data-icon-upload="${t}">
    </div>
  </div>`}function ce(){const t=document.getElementById("edit-panel");t&&(t.querySelectorAll("[data-icon-search]").forEach(e=>{const a=Number(e.dataset.iconSearch);e.addEventListener("input",()=>de(a,e.value))}),t.querySelectorAll("[data-icon-upload]").forEach(e=>{const a=Number(e.dataset.iconUpload);e.onchange=()=>ue(a,e)}))}function de(t,e){var r,l,g;const a=document.getElementById("icon-grid-"+t);if(!a||!e){a&&(a.innerHTML="");return}const n=le(e),s=i.slides[i.active],d=(g=(l=(r=s==null?void 0:s.steps)==null?void 0:r[t])==null?void 0:l.icon)==null?void 0:g.name;a.innerHTML=n.map(m=>{const y=z(m,14,"#888");return y?`<button class="icon-btn${m===d?" selected":""}" title="${f(m)}" data-icon-name="${f(m)}" data-step-idx="${t}">${y}</button>`:""}).join(""),a.querySelectorAll(".icon-btn").forEach(m=>{m.onclick=()=>re(Number(m.dataset.stepIdx),m.dataset.iconName)})}function re(t,e){const a=z(e,48,"#333");a&&W(t,{type:"lucide",name:e,svg:a})}function ue(t,e){const a=e.files[0];if(!a||!["image/png","image/svg+xml"].includes(a.type))return;const n=new FileReader;n.onload=s=>{let d=s.target.result;a.type==="image/svg+xml"&&(d="data:image/svg+xml;base64,"+btoa(atob(d.split(",")[1]).replace(/<script[\s\S]*?<\/script>/gi,""))),W(t,{type:"upload",src:d})},n.readAsDataURL(a)}function W(t,e){const a=i.slides[i.active];!a||!a.steps||!a.steps[t]||(a.steps[t].icon=e,x(i.active),v(),S(),p())}function V(t){i.active=t,q()}function me(t,e){i.slides[i.active][t]=e,x(i.active),v(),p()}function pe(t,e){i.slides[i.active].list_items[t]=e,x(i.active),v(),p()}function ve(){(i.slides[i.active].list_items||[]).length>=4||(i.slides[i.active].list_items=[...i.slides[i.active].list_items||[],""],S(),v(),p())}function ge(t){i.slides[i.active].list_items.splice(t,1),S(),v(),p()}function fe(t,e,a){i.slides[i.active].steps[t][e]=a,x(i.active),v(),p()}function be(){const t=i.slides[i.active].steps||[];t.length>=4||(t.push({label:"Etapa "+(t.length+1),text:""}),i.slides[i.active].steps=t,S(),v(),p())}function he(t){i.slides[i.active].steps.splice(t,1),S(),v(),p()}function ye(){if(i.slides.length<=1)return;i.slides.splice(i.active,1);const t={};Object.keys(i.images).forEach(e=>{const a=Number(e);a<i.active?t[a]=i.images[a]:a>i.active&&(t[a-1]=i.images[a])}),i.images=t,i.active=Math.min(i.active,i.slides.length-1),q(),p()}function Ee(){i.slides.splice(i.active+1,0,{...ie.dark}),V(i.active+1),p()}function we(t){i.slides[i.active]&&(i.slides[i.active].layout=t,x(i.active),v(),S(),p())}function _e(t){const e=t.target.files[0];if(!e)return;const a=new FileReader;a.onload=n=>{i.images[i.active]=n.target.result,S(),x(i.active),v(),p()},a.readAsDataURL(e)}function xe(){delete i.images[i.active],S(),x(i.active),v(),p()}function x(t){const a=document.querySelectorAll(".thumb-item")[t];if(!a)return;const n=a.querySelector("iframe");n&&(n.srcdoc=M(t))}async function Se(){const t=document.getElementById("refine-instr"),e=t==null?void 0:t.value.trim();if(!e)return;const a=document.getElementById("btn-refine-ok");a&&(a.textContent="…",a.disabled=!0);try{const n=await B.refine(i.slides[i.active],e),s=i.slides[i.active].layout,d=i.slides[i.active].img_position;i.slides[i.active]=n,s&&!i.slides[i.active].layout&&(i.slides[i.active].layout=s),d&&(i.slides[i.active].img_position=d),q(),p()}catch(n){alert("Erro ao refinar: "+n.message)}finally{a&&(a.textContent="Refinar",a.disabled=!1)}}function Te(){const t=document.getElementById("app");t&&(t.innerHTML=`
    <div class="screen-editor">
      <header class="editor-header">
        <button class="header-btn" id="btn-back">← Projetos</button>
        <div id="editor-topic" class="editor-topic"></div>
        <div id="saved-dot" class="saved-dot"></div>
      </header>
      <div class="editor-body">
        <div class="sidebar" id="sidebar"></div>
        <div class="preview-col" id="preview-col">
          <div id="canvas-loading" class="canvas-loading hidden">
            <div class="loading-card">
              <div class="loading-header">
                <div class="loading-title">Gerando carrossel</div>
                <div id="loading-topic" class="loading-topic"></div>
              </div>
              <div class="loading-bar-wrap">
                <div id="loading-bar" class="loading-bar"></div>
              </div>
              <div class="loading-steps">
                <div class="loading-step" id="step-0"><div class="step-icon"></div><div class="step-label">Analisando tema</div></div>
                <div class="loading-step" id="step-1"><div class="step-icon"></div><div class="step-label">Estruturando narrativa</div></div>
                <div class="loading-step" id="step-2"><div class="step-icon"></div><div class="step-label">Criando os slides</div></div>
                <div class="loading-step" id="step-3"><div class="step-icon"></div><div class="step-label">Refinando conteúdo</div></div>
              </div>
              <div id="loading-elapsed" class="loading-elapsed">0s</div>
            </div>
          </div>
          <div id="preview-wrap" class="preview-frame-wrap"></div>
          <div id="layout-pills" class="template-pills"></div>
        </div>
        <div class="edit-panel" id="edit-panel"></div>
      </div>
    </div>`,document.getElementById("btn-back").onclick=()=>N("project",{projectId:i.projectId}),i.carousel&&(document.getElementById("editor-topic").textContent=i.carousel.title||""),i.slides.length>0&&q())}function Ie(){se()}function qe(){var a;(a=document.getElementById("new-carousel-modal"))==null||a.remove();let t=8;const e=document.createElement("div");e.className="modal-overlay",e.id="new-carousel-modal",e.innerHTML=`
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">Novo carrossel</div>
        <button class="header-btn" id="modal-close">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Tema / assunto</label>
          <input id="modal-topic" class="form-input" type="text" placeholder="Ex: Por que criadores digitais fracassam nos primeiros 90 dias">
        </div>
        <div class="form-group">
          <label class="form-label">Audiência</label>
          <input id="modal-audience" class="form-input" type="text" placeholder="Ex: Criadores digitais brasileiros">
        </div>
        <div class="form-group">
          <label class="form-label">CTA final</label>
          <input id="modal-cta" class="form-input" type="text" placeholder="Ex: Salve este post e aplique hoje">
        </div>
        <div class="form-group">
          <label class="form-label">Número de slides</label>
          <div class="counter-row">
            <button type="button" class="counter-btn" id="modal-count-dec">−</button>
            <span id="modal-count-val" class="counter-val">${t}</span>
            <button type="button" class="counter-btn" id="modal-count-inc">+</button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" id="modal-submit">Gerar carrossel</button>
      </div>
    </div>`,document.body.appendChild(e),e.querySelector("#modal-close").onclick=()=>e.remove(),e.addEventListener("click",n=>{n.target===e&&e.remove()}),e.querySelector("#modal-count-dec").onclick=()=>{t=Math.max(3,t-1),e.querySelector("#modal-count-val").textContent=t},e.querySelector("#modal-count-inc").onclick=()=>{t=Math.min(15,t+1),e.querySelector("#modal-count-val").textContent=t},e.querySelector("#modal-submit").onclick=async()=>{const n=e.querySelector("#modal-topic").value.trim();if(!n){e.querySelector("#modal-topic").focus();return}const s={topic:n,audience:e.querySelector("#modal-audience").value.trim(),cta:e.querySelector("#modal-cta").value.trim(),slideCount:t};e.remove(),await $e(s)}}async function $e(t){var a;ae(t.topic),h(5);const e=[];try{const n=_("Criando carrossel…"),s=await B.carousels.create(i.projectId,t.topic);i.carouselId=s.id,O(n),h(15);const d=_("Conectando ao Claude…");h(18),e.push(setTimeout(()=>{O(d),_("Analisando tema…"),h(30)},3e3)),e.push(setTimeout(()=>{_("Estruturando narrativa…"),h(45)},9e3)),e.push(setTimeout(()=>{_("Criando os slides…"),h(60)},2e4)),e.push(setTimeout(()=>{_("Refinando conteúdo…"),h(72)},35e3));const r=await B.generate(t);e.forEach(clearTimeout),h(85),_(`${((a=r.slides)==null?void 0:a.length)||0} slides gerados`,"done"),_("Carregando editor…"),h(92);const l=r.slides||[];i.slides=l,i.images={},await N("editor",{projectId:i.projectId,carouselId:s.id}),i.slides=l,i.images={},F(),h(100),q(),p()}catch(n){e.forEach(clearTimeout),_("Erro: "+n.message,"error"),F(),setTimeout(()=>N("project",{projectId:i.projectId}),2500)}}export{$e as generateAndOpen,Te as mountEditor,qe as showNewCarouselModal,Ie as unmountEditor};
