import{a as q,S as i,n as I,s as v}from"./index-CzwiutNf.js";import{themeStyleBlock as U}from"./theme-DPp7_AaX.js";import{LAYOUT_NAMES as F,getRenderer as z}from"./renderers-C_NC_ncQ.js";function W({value:t="",onChange:e,placeholder:a=""}={}){const n=document.createElement("div");n.className="rt-toolbar",n.innerHTML=`
    <button type="button" class="rt-btn" data-cmd="bold" title="Negrito (Ctrl+B)"><strong>B</strong></button>
    <button type="button" class="rt-btn" data-cmd="italic" title="Itálico (Ctrl+I)"><em>I</em></button>
    <button type="button" class="rt-btn rt-btn-accent" data-cmd="accent" title="Cor de destaque">A</button>`;const s=document.createElement("div");s.className="rt-editor field-input",s.contentEditable="true",s.setAttribute("data-placeholder",a),s.innerHTML=f(t);const d=document.createElement("div");d.className="rt-wrap",d.appendChild(n),d.appendChild(s);function r(c){s.focus(),c==="bold"?document.execCommand("bold",!1):c==="italic"?document.execCommand("italic",!1):c==="accent"&&l(),m(),e==null||e(u())}function l(){var L;const c=window.getSelection();if(!c.rangeCount||c.isCollapsed)return;const y=c.getRangeAt(0),_=(L=c.anchorNode)==null?void 0:L.parentElement;if(_!=null&&_.classList.contains("accent")){const E=_,k=document.createDocumentFragment();for(;E.firstChild;)k.appendChild(E.firstChild);E.replaceWith(k)}else{const E=document.createElement("span");E.className="accent";try{y.surroundContents(E)}catch{}}}function m(){s.innerHTML=s.innerHTML.replace(/<b>/gi,"<strong>").replace(/<\/b>/gi,"</strong>").replace(/<i>/gi,"<em>").replace(/<\/i>/gi,"</em>")}function u(){return f(s.innerHTML)}function b(c){s.innerHTML=f(c)}function f(c){return(c||"").replace(/<(?!\/?(?:em|strong|span)[^>]*>)[^>]+>/gi,"").replace(/<span(?!\s+class="accent")[^>]*>/gi,'<span class="accent">')}return n.addEventListener("mousedown",c=>{const y=c.target.closest("[data-cmd]");y&&(c.preventDefault(),r(y.dataset.cmd))}),s.addEventListener("input",()=>e==null?void 0:e(u())),s.addEventListener("keydown",c=>{(c.ctrlKey||c.metaKey)&&c.key==="b"&&(c.preventDefault(),r("bold")),(c.ctrlKey||c.metaKey)&&c.key==="i"&&(c.preventDefault(),r("italic"))}),{el:d,getValue:u,setValue:b}}function K(t,e){var s;const a=d=>String(d??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),n={headline_html:()=>t.headline?a(t.headline)+(t.headline_italic?" <em>"+a(t.headline_italic)+"</em>":""):"",body_html:()=>a(t.body||""),conclusion_html:()=>a(t.conclusion||""),call_to_action_html:()=>t.call_to_action?a(t.call_to_action)+(t.call_to_action_italic?" <em>"+a(t.call_to_action_italic)+"</em>":""):""};return((s=n[e])==null?void 0:s.call(n))||""}function N(t,e,a,n){const s=document.createElement("div");s.className="form-group";const d=document.createElement("div");d.className="field-label",d.textContent=a,s.appendChild(d);const r=W({value:t[e]||K(t,e)||"",placeholder:a,onChange:l=>{t[e]=l,n()}});return s.appendChild(r.el),s}const V={dark:{template:"dark",layout:"a",section_number:"",section_title:"",body:"",list_items:[],conclusion:""}},Y=[0,2e3,8e3,2e4],J=[12,30,55,80];let T=[];function h(t){return String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function A(t){const e=i.slides[t];if(!e)return'<!DOCTYPE html><html><body style="background:#111;width:1080px;height:1350px;"></body></html>';const n=z(e)(e,i.images[t]||null,i.theme);return`<!DOCTYPE html><html><head><meta charset="UTF-8">${U(i.theme)}</head><body style="margin:0;overflow:hidden;">${n}</body></html>`}function Q(t){const e=document.getElementById("canvas-loading");if(!e)return;e.classList.remove("hidden");const a=document.getElementById("loading-topic");a&&(a.textContent=t||"");const n=document.getElementById("loading-bar");n&&(n.style.width="0%"),document.querySelectorAll(".loading-step").forEach(l=>{l.classList.remove("active","done");const m=l.querySelector(".step-icon");m&&(m.textContent="")});let s=0;const d=document.getElementById("loading-elapsed");d&&(d.textContent="0s");const r=setInterval(()=>{s++,d&&(d.textContent=s+"s")},1e3);T.push(r),Y.forEach((l,m)=>{const u=setTimeout(()=>{if(m>0){const f=document.getElementById("step-"+(m-1));if(f){f.classList.remove("active"),f.classList.add("done");const c=f.querySelector(".step-icon");c&&(c.textContent="✓")}}const b=document.getElementById("step-"+m);b&&b.classList.add("active"),n&&(n.style.width=J[m]+"%")},l);T.push(u)})}function M(){T.forEach(e=>{clearInterval(e),clearTimeout(e)}),T=[];const t=document.getElementById("canvas-loading");t&&t.classList.add("hidden")}function $(){X(),g(),w()}function X(){const t=document.getElementById("sidebar");if(!t)return;t.innerHTML="",i.slides.forEach((a,n)=>{const s=document.createElement("div");s.className="thumb-item"+(n===i.active?" active":""),s.onclick=()=>R(n);const d=document.createElement("div");d.className="thumb-wrap";const r=document.createElement("iframe");r.srcdoc=A(n),r.title="Slide "+(n+1),d.appendChild(r);const l=document.createElement("div");l.className="thumb-label",l.textContent=n+1+" · "+a.template,s.appendChild(d),s.appendChild(l),t.appendChild(s)});const e=document.createElement("button");e.className="btn-add-slide",e.textContent="+ Slide",e.onclick=pe,t.appendChild(e)}function g(){const t=document.getElementById("preview-col"),e=document.getElementById("preview-wrap");if(!t||!e)return;const a=t.clientHeight-80,n=t.clientWidth-32,s=Math.min(a/1350,n/1080,1),d=Math.round(1080*s),r=Math.round(1350*s);e.style.width=d+"px",e.style.height=r+"px",e.style.overflow="hidden",e.style.flexShrink="0",e.innerHTML="";const l=document.createElement("iframe");l.style.width="1080px",l.style.height="1350px",l.style.transformOrigin="top left",l.style.transform=`scale(${s})`,l.style.border="none",l.style.display="block",l.srcdoc=A(i.active),l.title="Preview",e.appendChild(l);const m=i.slides[i.active],u=document.getElementById("layout-pills");if(m&&u){const b=F[m.template]||{},f=m.layout||"a";u.innerHTML=Object.entries(b).map(([c,y])=>`<button class="pill${c===f?" active":""}" data-layout="${h(c)}">${h(y)}</button>`).join(""),u.querySelectorAll(".pill").forEach(c=>{c.onclick=()=>ve(c.dataset.layout)})}}function w(){const t=document.getElementById("edit-panel");if(!t)return;const e=i.slides[i.active];if(!e){t.innerHTML="";return}const a=e.template,n=["cover","split","overlay"].includes(a),s=i.images[i.active],d=i.slides.length>1;function r(o,p,C){return`<div class="field-group"><div class="field-label">${h(p)}</div>
      <input class="field-input" value="${h(C||"")}" data-key="${h(o)}"></div>`}let l=`<div class="panel-header">
    <div class="panel-title">Slide ${i.active+1} · ${h(a)}</div>
    ${d?'<button class="btn-delete" id="btn-delete-slide">Excluir</button>':""}
  </div>`;n&&(l+=`<div class="field-group"><div class="field-label">Imagem</div>
      ${s?`<div class="img-preview-wrap">
             <img class="img-preview" src="${s}">
             <button class="btn-remove-img" id="btn-remove-img">Remover</button>
           </div>`:`<div class="drop-zone">
             <input type="file" accept="image/*" id="inp-img">
             <div class="drop-zone-icon">⊕</div>
             <div class="drop-zone-text">Clique para fazer upload<br>JPG · PNG · WEBP</div>
           </div>`}
    </div>`),(a==="cover"||a==="split")&&(l+='<div data-rich="headline_html"></div>',l+='<div data-rich="body_html"></div>'),a==="dark"&&(l+=r("section_number","Número da seção",e.section_number),l+=r("section_title","Título da seção",e.section_title),l+='<div data-rich="body_html"></div>',l+=`<div class="field-group"><div class="field-label">Itens da lista</div>
      <div class="list-items-wrap" id="list-items-wrap">
        ${(e.list_items||[]).map((o,p)=>`<div class="list-item-row">
            <input class="field-input" value="${h(o)}" data-list-idx="${p}">
            <button class="btn-remove" data-list-remove="${p}">×</button>
          </div>`).join("")}
      </div>
      ${(e.list_items||[]).length<4?'<button class="btn-add-item" id="btn-add-list-item">+ Adicionar</button>':""}
    </div>`,l+='<div data-rich="conclusion_html"></div>'),a==="steps"&&(l+=r("section_title","Título (opcional)",e.section_title||""),l+=`<div class="field-group"><div class="field-label">Etapas</div>
      <div class="steps-wrap" id="steps-wrap">
        ${(e.steps||[]).map((o,p)=>`<div class="step-row">
            <div class="step-row-top">
              <input class="field-input step-label-input" value="${h(o.label)}" placeholder="Etapa ${p+1}" data-step-idx="${p}" data-step-field="label">
              <button class="btn-remove" data-step-remove="${p}">×</button>
            </div>
            <div data-rich="step_text_html_${p}"></div>
            ${e.layout==="c"?ee(p,(e.steps[p]||{}).icon):""}
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
  </div>`,t.innerHTML=l;const m=()=>{x(i.active),g(),v()},u={headline_html:"Headline",body_html:"Corpo",conclusion_html:"Conclusão",call_to_action_html:"Chamada final"};t.querySelectorAll("[data-rich]").forEach(o=>{var B;const p=o.dataset.rich,C=p.match(/^step_text_html_(\d+)$/);if(C){const O=Number(C[1]),S=(B=e.steps)==null?void 0:B[O];if(!S)return;!S.text_html&&S.text&&(S.text_html=String(S.text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"));const G=N(S,"text_html","Texto da etapa",m);o.replaceWith(G);return}const P=u[p]||p,D=N(e,p,P,m);o.replaceWith(D)}),t.querySelectorAll("input[data-key], textarea[data-key]").forEach(o=>{o.addEventListener("input",()=>se(o.dataset.key,o.value))});const b=t.querySelector("#btn-delete-slide");b&&(b.onclick=me);const f=t.querySelector("#btn-remove-img");f&&(f.onclick=ge);const c=t.querySelector("#inp-img");c&&(c.onchange=o=>fe(o)),t.querySelectorAll("input[data-list-idx]").forEach(o=>{o.addEventListener("input",()=>le(Number(o.dataset.listIdx),o.value))}),t.querySelectorAll("[data-list-remove]").forEach(o=>{o.onclick=()=>oe(Number(o.dataset.listRemove))});const y=t.querySelector("#btn-add-list-item");y&&(y.onclick=ce),t.querySelectorAll("input[data-step-idx]").forEach(o=>{o.addEventListener("input",()=>de(Number(o.dataset.stepIdx),o.dataset.stepField,o.value))}),t.querySelectorAll("[data-step-remove]").forEach(o=>{o.onclick=()=>ue(Number(o.dataset.stepRemove))});const _=t.querySelector("#btn-add-step");_&&(_.onclick=re);const L=t.querySelector("#btn-refine-toggle");L&&(L.onclick=()=>{const o=document.getElementById("refine-wrap");o&&o.classList.toggle("open")});const E=t.querySelector("#btn-refine-ok");E&&(E.onclick=be);const k=t.querySelector("#btn-refine-cancel");k&&(k.onclick=()=>{const o=document.getElementById("refine-wrap");o&&o.classList.remove("open")}),te()}function j(t,e=48,a="#333"){if(!window.lucide||!lucide.icons[t])return null;const[,,n]=lucide.icons[t],s=n.map(([d,r])=>{const l=Object.entries(r).map(([m,u])=>`${m}="${u}"`).join(" ");return`<${d} ${l}/>`}).join("");return`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="${a}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${s}</svg>`}function Z(t){return window.lucide?Object.keys(lucide.icons).filter(e=>e.includes(t.toLowerCase().replace(/\s+/g,"-"))).slice(0,30):[]}function ee(t,e){const a=(e==null?void 0:e.type)==="lucide"&&e.svg?e.svg:null,n=(e==null?void 0:e.type)==="upload"?e.src:null,s=a||(n?`<img src="${n}" style="width:18px;height:18px;object-fit:contain;">`:'<div style="width:18px;height:18px;border:1px dashed #333;border-radius:3px;"></div>');return`<div class="icon-picker" id="icon-picker-${t}">
    <div class="field-label">Ícone</div>
    <div class="icon-current">${s}<span style="font-size:11px;color:#555;">${h((e==null?void 0:e.name)||"nenhum")}</span></div>
    <div class="icon-search-wrap">
      <input class="field-input icon-search-input" placeholder="buscar ícone…" data-icon-search="${t}">
    </div>
    <div id="icon-grid-${t}" class="icon-grid"></div>
    <div style="display:flex;align-items:center;gap:6px;">
      <span class="field-label" style="margin:0;">ou upload</span>
      <input type="file" accept="image/png,image/svg+xml" style="font-size:11px;color:#666;flex:1;" data-icon-upload="${t}">
    </div>
  </div>`}function te(){const t=document.getElementById("edit-panel");t&&(t.querySelectorAll("[data-icon-search]").forEach(e=>{const a=Number(e.dataset.iconSearch);e.addEventListener("input",()=>ie(a,e.value))}),t.querySelectorAll("[data-icon-upload]").forEach(e=>{const a=Number(e.dataset.iconUpload);e.onchange=()=>ne(a,e)}))}function ie(t,e){var r,l,m;const a=document.getElementById("icon-grid-"+t);if(!a||!e){a&&(a.innerHTML="");return}const n=Z(e),s=i.slides[i.active],d=(m=(l=(r=s==null?void 0:s.steps)==null?void 0:r[t])==null?void 0:l.icon)==null?void 0:m.name;a.innerHTML=n.map(u=>{const b=j(u,14,"#888");return b?`<button class="icon-btn${u===d?" selected":""}" title="${h(u)}" data-icon-name="${h(u)}" data-step-idx="${t}">${b}</button>`:""}).join(""),a.querySelectorAll(".icon-btn").forEach(u=>{u.onclick=()=>ae(Number(u.dataset.stepIdx),u.dataset.iconName)})}function ae(t,e){const a=j(e,48,"#333");a&&H(t,{type:"lucide",name:e,svg:a})}function ne(t,e){const a=e.files[0];if(!a||!["image/png","image/svg+xml"].includes(a.type))return;const n=new FileReader;n.onload=s=>{let d=s.target.result;a.type==="image/svg+xml"&&(d="data:image/svg+xml;base64,"+btoa(atob(d.split(",")[1]).replace(/<script[\s\S]*?<\/script>/gi,""))),H(t,{type:"upload",src:d})},n.readAsDataURL(a)}function H(t,e){const a=i.slides[i.active];!a||!a.steps||!a.steps[t]||(a.steps[t].icon=e,x(i.active),g(),w(),v())}function R(t){i.active=t,$()}function se(t,e){i.slides[i.active][t]=e,x(i.active),g(),v()}function le(t,e){i.slides[i.active].list_items[t]=e,x(i.active),g(),v()}function ce(){(i.slides[i.active].list_items||[]).length>=4||(i.slides[i.active].list_items=[...i.slides[i.active].list_items||[],""],w(),g(),v())}function oe(t){i.slides[i.active].list_items.splice(t,1),w(),g(),v()}function de(t,e,a){i.slides[i.active].steps[t][e]=a,x(i.active),g(),v()}function re(){const t=i.slides[i.active].steps||[];t.length>=4||(t.push({label:"Etapa "+(t.length+1),text:""}),i.slides[i.active].steps=t,w(),g(),v())}function ue(t){i.slides[i.active].steps.splice(t,1),w(),g(),v()}function me(){if(i.slides.length<=1)return;i.slides.splice(i.active,1);const t={};Object.keys(i.images).forEach(e=>{const a=Number(e);a<i.active?t[a]=i.images[a]:a>i.active&&(t[a-1]=i.images[a])}),i.images=t,i.active=Math.min(i.active,i.slides.length-1),$(),v()}function pe(){i.slides.splice(i.active+1,0,{...V.dark}),R(i.active+1),v()}function ve(t){i.slides[i.active]&&(i.slides[i.active].layout=t,x(i.active),g(),w(),v())}function fe(t){const e=t.target.files[0];if(!e)return;const a=new FileReader;a.onload=n=>{i.images[i.active]=n.target.result,w(),x(i.active),g(),v()},a.readAsDataURL(e)}function ge(){delete i.images[i.active],w(),x(i.active),g(),v()}function x(t){const a=document.querySelectorAll(".thumb-item")[t];if(!a)return;const n=a.querySelector("iframe");n&&(n.srcdoc=A(t))}async function be(){const t=document.getElementById("refine-instr"),e=t==null?void 0:t.value.trim();if(!e)return;const a=document.getElementById("btn-refine-ok");a&&(a.textContent="…",a.disabled=!0);try{const n=await q.refine(i.slides[i.active],e),s=i.slides[i.active].layout;i.slides[i.active]=n,s&&!i.slides[i.active].layout&&(i.slides[i.active].layout=s),$(),v()}catch(n){alert("Erro ao refinar: "+n.message)}finally{a&&(a.textContent="Refinar",a.disabled=!1)}}function xe(){const t=document.getElementById("app");t&&(t.innerHTML=`
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
    </div>`,document.getElementById("btn-back").onclick=()=>I("project",{projectId:i.projectId}),i.carousel&&(document.getElementById("editor-topic").textContent=i.carousel.title||""),i.slides.length>0&&$())}function _e(){M()}function Se(){var a;(a=document.getElementById("new-carousel-modal"))==null||a.remove();let t=8;const e=document.createElement("div");e.className="modal-overlay",e.id="new-carousel-modal",e.innerHTML=`
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
    </div>`,document.body.appendChild(e),e.querySelector("#modal-close").onclick=()=>e.remove(),e.addEventListener("click",n=>{n.target===e&&e.remove()}),e.querySelector("#modal-count-dec").onclick=()=>{t=Math.max(3,t-1),e.querySelector("#modal-count-val").textContent=t},e.querySelector("#modal-count-inc").onclick=()=>{t=Math.min(15,t+1),e.querySelector("#modal-count-val").textContent=t},e.querySelector("#modal-submit").onclick=async()=>{const n=e.querySelector("#modal-topic").value.trim();if(!n){e.querySelector("#modal-topic").focus();return}const s={topic:n,audience:e.querySelector("#modal-audience").value.trim(),cta:e.querySelector("#modal-cta").value.trim(),slideCount:t};e.remove(),await he(s)}}async function he(t){const e=await q.carousels.create(i.projectId,t.topic);i.carouselId=e.id,await I("editor",{projectId:i.projectId,carouselId:e.id}),Q(t.topic);try{const a=await q.generate(t);i.slides=a.slides||[],i.images={},$(),v()}catch(a){alert("Erro ao gerar: "+a.message),I("project",{projectId:i.projectId})}finally{M()}}export{he as generateAndOpen,xe as mountEditor,Se as showNewCarouselModal,_e as unmountEditor};
