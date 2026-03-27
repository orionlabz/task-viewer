import{S as n,a as h,n as _,_ as k}from"./index-CXBWlaV6.js";function x({value:a="#000000",label:s="",onChange:o}={}){const l=document.createElement("div");l.className="color-picker-wrap",l.innerHTML=`
    <div class="color-picker-row">
      <label class="field-label" style="flex:1;">${I(s)}</label>
      <div class="color-swatch-wrap">
        <input type="color" class="color-native" value="${a}" title="${I(s)}">
        <div class="color-swatch" style="background:${a};"></div>
      </div>
      <input type="text" class="field-input color-hex" value="${a}" maxlength="7" style="width:80px;">
    </div>`;const r=l.querySelector(".color-native"),d=l.querySelector(".color-swatch"),c=l.querySelector(".color-hex");function m(t){/^#[0-9a-f]{6}$/i.test(t)&&(r.value=t,d.style.background=t,c.value=t,o==null||o(t))}return r.addEventListener("input",()=>m(r.value)),c.addEventListener("input",()=>m(c.value)),c.addEventListener("blur",()=>{/^#[0-9a-f]{6}$/i.test(c.value)||(c.value=a)}),{el:l,getValue:()=>c.value,setValue:t=>m(t)}}function I(a){return String(a||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const $=["Playfair Display","Cormorant Garamond","Libre Baskerville","Merriweather","Lora","Abril Fatface","DM Serif Display","Bodoni Moda","Fraunces","Spectral"],w=["Inter","DM Sans","Plus Jakarta Sans","Outfit","Nunito Sans","Source Sans 3","Karla","Mulish","Work Sans","Jost"],j=["JetBrains Mono","DM Mono","IBM Plex Mono","Space Mono","Fira Code","Roboto Mono","Space Grotesk","Syne","Barlow Condensed","Oswald"];function g({value:a="",fonts:s=w,label:o="",onChange:l}={}){const r=document.createElement("div");r.className="font-picker-wrap",r.innerHTML=`
    <div class="field-label">${String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
    <div class="font-picker-list"></div>`;const d=r.querySelector(".font-picker-list");function c(t){const i="gf-"+t.replace(/ /g,"-");if(!document.getElementById(i)){const p=document.createElement("link");p.id=i,p.rel="stylesheet",p.href=`https://fonts.googleapis.com/css2?family=${t.replace(/ /g,"+")}:wght@400;500&display=swap`,document.head.appendChild(p)}}function m(t){d.innerHTML=s.map(i=>`
      <button type="button" class="font-option ${i===t?"active":""}" data-font="${i}">
        <span class="font-preview" style="font-family:'${i}',serif;">${i}</span>
      </button>`).join(""),s.forEach(c),d.querySelectorAll(".font-option").forEach(i=>i.onclick=()=>{m(i.dataset.font),l==null||l(i.dataset.font)})}return m(a),{el:r,getValue:()=>{var t;return((t=d.querySelector(".active"))==null?void 0:t.dataset.font)||a}}}let e=null,y="home",S={},v={};async function P(){var m;y=n.screen==="project"?"project":"home",n.context==="project"&&n.projectId?e={...await h.projects.theme(n.projectId)}:e={...await h.themes.global()};const a=t=>String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");document.getElementById("app").innerHTML=`
    <div class="screen-theme">
      <header class="app-header">
        <button class="btn-text" id="btn-back-theme">← Voltar</button>
        <span class="app-logo">Tema</span>
        <div style="display:flex;gap:8px;align-items:center;">
          ${n.context==="project"?'<button class="btn-text" id="btn-use-global">Usar tema global</button>':""}
          <button class="btn-primary" id="btn-save-theme">Salvar</button>
        </div>
      </header>
      <main class="theme-main">
        <div class="theme-columns">
          <div class="theme-col">
            <section class="theme-section">
              <h3 class="theme-section-title">Identidade da marca</h3>
              <div class="form-group">
                <label class="form-label">Nome da marca</label>
                <input class="form-input" id="t-brand-name" value="${a(e.brand_name||"")}">
              </div>
              <div class="form-group">
                <label class="form-label">Símbolo (emoji/char)</label>
                <input class="form-input" id="t-brand-symbol" value="${a(e.brand_symbol||"⬥")}" style="width:80px;">
              </div>
              <div class="form-group">
                <label class="form-label">Logotipo escuro (PNG/SVG)</label>
                <div class="brand-upload-row">
                  ${e.brand_logo_dark?`<img src="${e.brand_logo_dark}" class="brand-preview" alt="Logo escuro">`:'<div class="brand-preview-empty">sem logo</div>'}
                  <input type="file" accept="image/png,image/svg+xml" id="upload-logo-dark" class="upload-input">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Logotipo claro (PNG/SVG)</label>
                <div class="brand-upload-row">
                  ${e.brand_logo_light?`<img src="${e.brand_logo_light}" class="brand-preview brand-preview-dark" alt="Logo claro">`:'<div class="brand-preview-empty">sem logo</div>'}
                  <input type="file" accept="image/png,image/svg+xml" id="upload-logo-light" class="upload-input">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Nav esquerdo</label>
                <input class="form-input" id="t-nav-left" value="${a(e.nav_left||"CATEGORIA")}">
              </div>
              <div class="form-group">
                <label class="form-label">Nav direito</label>
                <input class="form-input" id="t-nav-right" value="${a(e.nav_right||"SÉRIE")}">
              </div>
            </section>
          </div>

          <div class="theme-col">
            <section class="theme-section">
              <h3 class="theme-section-title">Fontes</h3>
              <div class="form-group" id="picker-font-display"></div>
              <div class="form-group" id="picker-font-body"></div>
              <div class="form-group" id="picker-font-ui"></div>
            </section>
            <section class="theme-section">
              <h3 class="theme-section-title">Tamanhos de texto</h3>
              <div class="form-group">
                <label class="form-label">Tamanho dos títulos (px)</label>
                <input class="form-input" type="number" id="t-font-size-headline" min="40" max="120" step="2" value="${e.font_size_headline??72}">
              </div>
              <div class="form-group">
                <label class="form-label">Tamanho do corpo (px)</label>
                <input class="form-input" type="number" id="t-font-size-body" min="18" max="60" step="1" value="${e.font_size_body??36}">
              </div>
              <div class="form-group">
                <label class="form-label">Line-height títulos</label>
                <input class="form-input" type="number" id="t-line-height-headline" min="0.9" max="1.8" step="0.05" value="${e.line_height_headline??1.05}">
              </div>
              <div class="form-group">
                <label class="form-label">Line-height corpo</label>
                <input class="form-input" type="number" id="t-line-height-body" min="1.2" max="2.2" step="0.05" value="${e.line_height_body??1.5}">
              </div>
            </section>
            <section class="theme-section">
              <h3 class="theme-section-title">Cores</h3>
              <div id="color-pickers" class="color-pickers-grid"></div>
            </section>
          </div>

          <div class="theme-col theme-preview-col">
            <section class="theme-section">
              <h3 class="theme-section-title">Prévia</h3>
              <iframe id="theme-preview-frame" class="theme-preview-frame"></iframe>
            </section>
          </div>
        </div>
      </main>
    </div>`;const s=g({value:e.font_display,fonts:$,label:"Fonte de títulos",onChange:t=>{e.font_display=t,u()}});document.getElementById("picker-font-display").appendChild(s.el),v.display=s;const o=g({value:e.font_body,fonts:w,label:"Fonte do corpo",onChange:t=>{e.font_body=t,u()}});document.getElementById("picker-font-body").appendChild(o.el),v.body=o;const l=g({value:e.font_ui||"JetBrains Mono",fonts:j,label:"Fonte UI (marca · nav · números)",onChange:t=>{e.font_ui=t,u()}});document.getElementById("picker-font-ui").appendChild(l.el),v.ui=l;const r=[{key:"color_bg",label:"Fundo"},{key:"color_text",label:"Texto principal"},{key:"color_emphasis",label:"Cor de destaque"},{key:"color_secondary",label:"Texto secundário"},{key:"color_detail",label:"Detalhes"},{key:"color_border",label:"Bordas"}],d=document.getElementById("color-pickers");r.forEach(({key:t,label:i})=>{const p=x({value:e[t]||"#000000",label:i,onChange:b=>{e[t]=b,u()}});d.appendChild(p.el),S[t]=p}),[{id:"t-font-size-headline",key:"font_size_headline",parse:Number},{id:"t-font-size-body",key:"font_size_body",parse:Number},{id:"t-line-height-headline",key:"line_height_headline",parse:Number},{id:"t-line-height-body",key:"line_height_body",parse:Number}].forEach(({id:t,key:i,parse:p})=>{var b;(b=document.getElementById(t))==null||b.addEventListener("input",B=>{const f=p(B.target.value);!isNaN(f)&&f>0&&(e[i]=f,u())})}),document.getElementById("upload-logo-dark").onchange=t=>E(t.target.files[0],"dark"),document.getElementById("upload-logo-light").onchange=t=>E(t.target.files[0],"light"),document.getElementById("btn-back-theme").onclick=()=>_(y,n.projectId?{projectId:n.projectId}:{}),document.getElementById("btn-save-theme").onclick=N,(m=document.getElementById("btn-use-global"))==null||m.addEventListener("click",T),u()}async function E(a,s){if(a)try{const{url:o}=await h.uploadBrand(a);s==="dark"?e.brand_logo_dark=o:e.brand_logo_light=o,u()}catch(o){alert("Erro ao fazer upload: "+o.message)}}async function u(){const a=document.getElementById("theme-preview-frame");if(!a)return;const[{themeStyleBlock:s},{RENDERERS:o}]=await Promise.all([k(()=>import("./theme-fxemBM4G.js"),[]),k(()=>import("./renderers-CwWWVjzg.js"),[])]),l={template:"dark",layout:"a",section_number:"01",section_title:"Prévia do tema",body_html:"Assim ficará o conteúdo dos seus slides.",list_items:["Item um","Item dois"],conclusion_html:"Sua conclusão aqui."},r=o.dark.a,d=r(l,null,e);a.srcdoc=`<!DOCTYPE html><html><head>${s(e)}</head><body style="margin:0;overflow:hidden;">${d}</body></html>`}async function N(){e.brand_name=document.getElementById("t-brand-name").value.trim(),e.brand_symbol=document.getElementById("t-brand-symbol").value.trim(),e.nav_left=document.getElementById("t-nav-left").value.trim(),e.nav_right=document.getElementById("t-nav-right").value.trim(),e.font_size_headline=Number(document.getElementById("t-font-size-headline").value)||72,e.font_size_body=Number(document.getElementById("t-font-size-body").value)||36,e.line_height_headline=Number(document.getElementById("t-line-height-headline").value)||1.05,e.line_height_body=Number(document.getElementById("t-line-height-body").value)||1.5;try{await h.themes.update(e.id,e),n.context==="project"&&n.projectId&&await h.projects.update(n.projectId,{theme_id:e.id}),_(y,n.projectId?{projectId:n.projectId}:{})}catch(a){alert("Erro ao salvar tema: "+a.message)}}async function T(){confirm("Remover tema personalizado do projeto e usar o tema global?")&&(await h.projects.update(n.projectId,{theme_id:null}),_("project",{projectId:n.projectId}))}function M(){S={},v={},e=null}export{P as mountThemeEditor,M as unmountThemeEditor};
