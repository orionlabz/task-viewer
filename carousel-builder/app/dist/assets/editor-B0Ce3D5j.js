import{a as k,S as i,n as _,s as v}from"./index-CvnXi3C-.js";import{themeStyleBlock as N}from"./theme-DPp7_AaX.js";import{LAYOUT_NAMES as M,getRenderer as H}from"./renderers-C_NC_ncQ.js";const R={dark:{template:"dark",layout:"a",section_number:"",section_title:"",body:"",list_items:[],conclusion:""}},P=[0,2e3,8e3,2e4],O=[12,30,55,80];let S=[];function p(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function L(t){const e=i.slides[t];if(!e)return'<!DOCTYPE html><html><body style="background:#111;width:1080px;height:1350px;"></body></html>';const l=H(e)(e,i.images[t]||null,i.theme);return`<!DOCTYPE html><html><head><meta charset="UTF-8">${N(i.theme)}</head><body style="margin:0;overflow:hidden;">${l}</body></html>`}function D(t){const e=document.getElementById("canvas-loading");if(!e)return;e.classList.remove("hidden");const a=document.getElementById("loading-topic");a&&(a.textContent=t||"");const l=document.getElementById("loading-bar");l&&(l.style.width="0%"),document.querySelectorAll(".loading-step").forEach(d=>{d.classList.remove("active","done");const s=d.querySelector(".step-icon");s&&(s.textContent="")});let o=0;const r=document.getElementById("loading-elapsed");r&&(r.textContent="0s");const c=setInterval(()=>{o++,r&&(r.textContent=o+"s")},1e3);S.push(c),P.forEach((d,s)=>{const u=setTimeout(()=>{if(s>0){const y=document.getElementById("step-"+(s-1));if(y){y.classList.remove("active"),y.classList.add("done");const g=y.querySelector(".step-icon");g&&(g.textContent="✓")}}const b=document.getElementById("step-"+s);b&&b.classList.add("active"),l&&(l.style.width=O[s]+"%")},d);S.push(u)})}function T(){S.forEach(e=>{clearInterval(e),clearTimeout(e)}),S=[];const t=document.getElementById("canvas-loading");t&&t.classList.add("hidden")}function E(){G(),f(),h()}function G(){const t=document.getElementById("sidebar");if(!t)return;t.innerHTML="",i.slides.forEach((a,l)=>{const o=document.createElement("div");o.className="thumb-item"+(l===i.active?" active":""),o.onclick=()=>j(l);const r=document.createElement("div");r.className="thumb-wrap";const c=document.createElement("iframe");c.srcdoc=L(l),c.title="Slide "+(l+1),r.appendChild(c);const d=document.createElement("div");d.className="thumb-label",d.textContent=l+1+" · "+a.template,o.appendChild(r),o.appendChild(d),t.appendChild(o)});const e=document.createElement("button");e.className="btn-add-slide",e.textContent="+ Slide",e.onclick=ae,t.appendChild(e)}function f(){const t=document.getElementById("preview-col"),e=document.getElementById("preview-wrap");if(!t||!e)return;const a=t.clientHeight-80,l=t.clientWidth-32,o=Math.min(a/1350,l/1080,1),r=Math.round(1080*o),c=Math.round(1350*o);e.style.width=r+"px",e.style.height=c+"px",e.style.overflow="hidden",e.style.flexShrink="0",e.innerHTML="";const d=document.createElement("iframe");d.style.width="1080px",d.style.height="1350px",d.style.transformOrigin="top left",d.style.transform=`scale(${o})`,d.style.border="none",d.style.display="block",d.srcdoc=L(i.active),d.title="Preview",e.appendChild(d);const s=i.slides[i.active],u=document.getElementById("layout-pills");if(s&&u){const b=M[s.template]||{},y=s.layout||"a";u.innerHTML=Object.entries(b).map(([g,x])=>`<button class="pill${g===y?" active":""}" data-layout="${p(g)}">${p(x)}</button>`).join(""),u.querySelectorAll(".pill").forEach(g=>{g.onclick=()=>se(g.dataset.layout)})}}function h(){const t=document.getElementById("edit-panel");if(!t)return;const e=i.slides[i.active];if(!e){t.innerHTML="";return}const a=e.template,l=["cover","split","overlay"].includes(a),o=i.images[i.active],r=i.slides.length>1;function c(n,m,$){return`<div class="field-group"><div class="field-label">${p(m)}</div>
      <input class="field-input" value="${p($||"")}" data-key="${p(n)}"></div>`}function d(n,m,$){return`<div class="field-group"><div class="field-label">${p(m)}</div>
      <textarea class="field-textarea" data-key="${p(n)}">${p($||"")}</textarea></div>`}let s=`<div class="panel-header">
    <div class="panel-title">Slide ${i.active+1} · ${p(a)}</div>
    ${r?'<button class="btn-delete" id="btn-delete-slide">Excluir</button>':""}
  </div>`;l&&(s+=`<div class="field-group"><div class="field-label">Imagem</div>
      ${o?`<div class="img-preview-wrap">
             <img class="img-preview" src="${o}">
             <button class="btn-remove-img" id="btn-remove-img">Remover</button>
           </div>`:`<div class="drop-zone">
             <input type="file" accept="image/*" id="inp-img">
             <div class="drop-zone-icon">⊕</div>
             <div class="drop-zone-text">Clique para fazer upload<br>JPG · PNG · WEBP</div>
           </div>`}
    </div>`),(a==="cover"||a==="split")&&(s+=c("headline","Headline",e.headline),s+=c("headline_italic","Headline (itálico)",e.headline_italic),s+=d("body","Corpo",e.body)),a==="dark"&&(s+=c("section_number","Número da seção",e.section_number),s+=c("section_title","Título da seção",e.section_title),s+=d("body","Corpo",e.body),s+=`<div class="field-group"><div class="field-label">Itens da lista</div>
      <div class="list-items-wrap" id="list-items-wrap">
        ${(e.list_items||[]).map((n,m)=>`<div class="list-item-row">
            <input class="field-input" value="${p(n)}" data-list-idx="${m}">
            <button class="btn-remove" data-list-remove="${m}">×</button>
          </div>`).join("")}
      </div>
      ${(e.list_items||[]).length<4?'<button class="btn-add-item" id="btn-add-list-item">+ Adicionar</button>':""}
    </div>`,s+=d("conclusion","Conclusão",e.conclusion)),a==="steps"&&(s+=c("section_title","Título (opcional)",e.section_title||""),s+=`<div class="field-group"><div class="field-label">Etapas</div>
      <div class="steps-wrap" id="steps-wrap">
        ${(e.steps||[]).map((n,m)=>`<div class="step-row">
            <div class="step-row-top">
              <input class="field-input step-label-input" value="${p(n.label)}" placeholder="Etapa ${m+1}" data-step-idx="${m}" data-step-field="label">
              <button class="btn-remove" data-step-remove="${m}">×</button>
            </div>
            <input class="field-input" value="${p(n.text)}" placeholder="Texto da etapa" data-step-idx="${m}" data-step-field="text">
            ${e.layout==="c"?F(m,(e.steps[m]||{}).icon):""}
          </div>`).join("")}
      </div>
      ${(e.steps||[]).length<4?'<button class="btn-add-item" id="btn-add-step">+ Etapa</button>':""}
    </div>`,s+=c("call_to_action","Chamada final",e.call_to_action),s+=c("call_to_action_italic","Chamada final (itálico)",e.call_to_action_italic)),a==="overlay"&&(s+=c("section_number","Número da seção",e.section_number),s+=c("section_title","Título",e.section_title),s+=c("headline","Headline",e.headline),s+=d("body","Corpo",e.body)),a==="cta"&&(s+=c("headline","Headline",e.headline),s+=c("headline_italic","Headline (itálico)",e.headline_italic),s+=d("body","Corpo",e.body),s+=c("cta_text","Texto do CTA",e.cta_text),s+=c("cta_word","Palavra em destaque",e.cta_word),s+=c("cta_suffix","Sufixo do CTA",e.cta_suffix)),s+=`<div class="refine-section">
    <button class="btn-refine" id="btn-refine-toggle">✦ Refinar com IA</button>
    <div id="refine-wrap" class="refine-input-wrap">
      <textarea id="refine-instr" class="field-textarea" placeholder="O que você quer mudar neste slide?" rows="3"></textarea>
      <div class="refine-actions">
        <button id="btn-refine-ok" class="btn-confirm">Refinar</button>
        <button id="btn-refine-cancel" class="btn-cancel">Cancelar</button>
      </div>
    </div>
  </div>`,t.innerHTML=s,t.querySelectorAll("input[data-key], textarea[data-key]").forEach(n=>{n.addEventListener("input",()=>J(n.dataset.key,n.value))});const u=t.querySelector("#btn-delete-slide");u&&(u.onclick=ie);const b=t.querySelector("#btn-remove-img");b&&(b.onclick=ne);const y=t.querySelector("#inp-img");y&&(y.onchange=n=>le(n)),t.querySelectorAll("input[data-list-idx]").forEach(n=>{n.addEventListener("input",()=>K(Number(n.dataset.listIdx),n.value))}),t.querySelectorAll("[data-list-remove]").forEach(n=>{n.onclick=()=>X(Number(n.dataset.listRemove))});const g=t.querySelector("#btn-add-list-item");g&&(g.onclick=Q),t.querySelectorAll("input[data-step-idx]").forEach(n=>{n.addEventListener("input",()=>Z(Number(n.dataset.stepIdx),n.dataset.stepField,n.value))}),t.querySelectorAll("[data-step-remove]").forEach(n=>{n.onclick=()=>te(Number(n.dataset.stepRemove))});const x=t.querySelector("#btn-add-step");x&&(x.onclick=ee);const C=t.querySelector("#btn-refine-toggle");C&&(C.onclick=()=>{const n=document.getElementById("refine-wrap");n&&n.classList.toggle("open")});const q=t.querySelector("#btn-refine-ok");q&&(q.onclick=oe);const I=t.querySelector("#btn-refine-cancel");I&&(I.onclick=()=>{const n=document.getElementById("refine-wrap");n&&n.classList.remove("open")}),z()}function B(t,e=48,a="#333"){if(!window.lucide||!lucide.icons[t])return null;const[,,l]=lucide.icons[t],o=l.map(([r,c])=>{const d=Object.entries(c).map(([s,u])=>`${s}="${u}"`).join(" ");return`<${r} ${d}/>`}).join("");return`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="${a}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${o}</svg>`}function U(t){return window.lucide?Object.keys(lucide.icons).filter(e=>e.includes(t.toLowerCase().replace(/\s+/g,"-"))).slice(0,30):[]}function F(t,e){const a=(e==null?void 0:e.type)==="lucide"&&e.svg?e.svg:null,l=(e==null?void 0:e.type)==="upload"?e.src:null,o=a||(l?`<img src="${l}" style="width:18px;height:18px;object-fit:contain;">`:'<div style="width:18px;height:18px;border:1px dashed #333;border-radius:3px;"></div>');return`<div class="icon-picker" id="icon-picker-${t}">
    <div class="field-label">Ícone</div>
    <div class="icon-current">${o}<span style="font-size:11px;color:#555;">${p((e==null?void 0:e.name)||"nenhum")}</span></div>
    <div class="icon-search-wrap">
      <input class="field-input icon-search-input" placeholder="buscar ícone…" data-icon-search="${t}">
    </div>
    <div id="icon-grid-${t}" class="icon-grid"></div>
    <div style="display:flex;align-items:center;gap:6px;">
      <span class="field-label" style="margin:0;">ou upload</span>
      <input type="file" accept="image/png,image/svg+xml" style="font-size:11px;color:#666;flex:1;" data-icon-upload="${t}">
    </div>
  </div>`}function z(){const t=document.getElementById("edit-panel");t&&(t.querySelectorAll("[data-icon-search]").forEach(e=>{const a=Number(e.dataset.iconSearch);e.addEventListener("input",()=>Y(a,e.value))}),t.querySelectorAll("[data-icon-upload]").forEach(e=>{const a=Number(e.dataset.iconUpload);e.onchange=()=>V(a,e)}))}function Y(t,e){var c,d,s;const a=document.getElementById("icon-grid-"+t);if(!a||!e){a&&(a.innerHTML="");return}const l=U(e),o=i.slides[i.active],r=(s=(d=(c=o==null?void 0:o.steps)==null?void 0:c[t])==null?void 0:d.icon)==null?void 0:s.name;a.innerHTML=l.map(u=>{const b=B(u,14,"#888");return b?`<button class="icon-btn${u===r?" selected":""}" title="${p(u)}" data-icon-name="${p(u)}" data-step-idx="${t}">${b}</button>`:""}).join(""),a.querySelectorAll(".icon-btn").forEach(u=>{u.onclick=()=>W(Number(u.dataset.stepIdx),u.dataset.iconName)})}function W(t,e){const a=B(e,48,"#333");a&&A(t,{type:"lucide",name:e,svg:a})}function V(t,e){const a=e.files[0];if(!a||!["image/png","image/svg+xml"].includes(a.type))return;const l=new FileReader;l.onload=o=>{let r=o.target.result;a.type==="image/svg+xml"&&(r="data:image/svg+xml;base64,"+btoa(atob(r.split(",")[1]).replace(/<script[\s\S]*?<\/script>/gi,""))),A(t,{type:"upload",src:r})},l.readAsDataURL(a)}function A(t,e){const a=i.slides[i.active];!a||!a.steps||!a.steps[t]||(a.steps[t].icon=e,w(i.active),f(),h(),v())}function j(t){i.active=t,E()}function J(t,e){i.slides[i.active][t]=e,w(i.active),f(),v()}function K(t,e){i.slides[i.active].list_items[t]=e,w(i.active),f(),v()}function Q(){(i.slides[i.active].list_items||[]).length>=4||(i.slides[i.active].list_items=[...i.slides[i.active].list_items||[],""],h(),f(),v())}function X(t){i.slides[i.active].list_items.splice(t,1),h(),f(),v()}function Z(t,e,a){i.slides[i.active].steps[t][e]=a,w(i.active),f(),v()}function ee(){const t=i.slides[i.active].steps||[];t.length>=4||(t.push({label:"Etapa "+(t.length+1),text:""}),i.slides[i.active].steps=t,h(),f(),v())}function te(t){i.slides[i.active].steps.splice(t,1),h(),f(),v()}function ie(){if(i.slides.length<=1)return;i.slides.splice(i.active,1);const t={};Object.keys(i.images).forEach(e=>{const a=Number(e);a<i.active?t[a]=i.images[a]:a>i.active&&(t[a-1]=i.images[a])}),i.images=t,i.active=Math.min(i.active,i.slides.length-1),E(),v()}function ae(){i.slides.splice(i.active+1,0,{...R.dark}),j(i.active+1),v()}function se(t){i.slides[i.active]&&(i.slides[i.active].layout=t,w(i.active),f(),h(),v())}function le(t){const e=t.target.files[0];if(!e)return;const a=new FileReader;a.onload=l=>{i.images[i.active]=l.target.result,h(),w(i.active),f(),v()},a.readAsDataURL(e)}function ne(){delete i.images[i.active],h(),w(i.active),f(),v()}function w(t){const a=document.querySelectorAll(".thumb-item")[t];if(!a)return;const l=a.querySelector("iframe");l&&(l.srcdoc=L(t))}async function oe(){const t=document.getElementById("refine-instr"),e=t==null?void 0:t.value.trim();if(!e)return;const a=document.getElementById("btn-refine-ok");a&&(a.textContent="…",a.disabled=!0);try{const l=await k.refine(i.slides[i.active],e),o=i.slides[i.active].layout;i.slides[i.active]=l,o&&!i.slides[i.active].layout&&(i.slides[i.active].layout=o),E(),v()}catch(l){alert("Erro ao refinar: "+l.message)}finally{a&&(a.textContent="Refinar",a.disabled=!1)}}function pe(){const t=document.getElementById("app");t&&(t.innerHTML=`
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
    </div>`,document.getElementById("btn-back").onclick=()=>_("project",{projectId:i.projectId}),i.carousel&&(document.getElementById("editor-topic").textContent=i.carousel.title||""),i.slides.length>0&&E())}function ve(){T()}function me(){var a;(a=document.getElementById("new-carousel-modal"))==null||a.remove();let t=8;const e=document.createElement("div");e.className="modal-overlay",e.id="new-carousel-modal",e.innerHTML=`
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
    </div>`,document.body.appendChild(e),e.querySelector("#modal-close").onclick=()=>e.remove(),e.addEventListener("click",l=>{l.target===e&&e.remove()}),e.querySelector("#modal-count-dec").onclick=()=>{t=Math.max(3,t-1),e.querySelector("#modal-count-val").textContent=t},e.querySelector("#modal-count-inc").onclick=()=>{t=Math.min(15,t+1),e.querySelector("#modal-count-val").textContent=t},e.querySelector("#modal-submit").onclick=async()=>{const l=e.querySelector("#modal-topic").value.trim();if(!l){e.querySelector("#modal-topic").focus();return}const o={topic:l,audience:e.querySelector("#modal-audience").value.trim(),cta:e.querySelector("#modal-cta").value.trim(),slideCount:t};e.remove(),await de(o)}}async function de(t){const e=await k.carousels.create(i.projectId,t.topic);i.carouselId=e.id,await _("editor",{projectId:i.projectId,carouselId:e.id}),D(t.topic);try{const a=await k.generate(t);i.slides=a.slides||[],i.images={},E(),v()}catch(a){alert("Erro ao gerar: "+a.message),_("project",{projectId:i.projectId})}finally{T()}}export{de as generateAndOpen,pe as mountEditor,me as showNewCarouselModal,ve as unmountEditor};
