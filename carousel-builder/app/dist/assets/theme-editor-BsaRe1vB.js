import{S as i,a as m,n as f,_ as h}from"./index-CNGE2Q7e.js";function w({value:a="#000000",label:n="",onChange:o}={}){const r=document.createElement("div");r.className="color-picker-wrap",r.innerHTML=`
    <div class="color-picker-row">
      <label class="field-label" style="flex:1;">${y(n)}</label>
      <div class="color-swatch-wrap">
        <input type="color" class="color-native" value="${a}" title="${y(n)}">
        <div class="color-swatch" style="background:${a};"></div>
      </div>
      <input type="text" class="field-input color-hex" value="${a}" maxlength="7" style="width:80px;">
    </div>`;const c=r.querySelector(".color-native"),d=r.querySelector(".color-swatch"),t=r.querySelector(".color-hex");function p(l){/^#[0-9a-f]{6}$/i.test(l)&&(c.value=l,d.style.background=l,t.value=l,o==null||o(l))}return c.addEventListener("input",()=>p(c.value)),t.addEventListener("input",()=>p(t.value)),t.addEventListener("blur",()=>{/^#[0-9a-f]{6}$/i.test(t.value)||(t.value=a)}),{el:r,getValue:()=>t.value,setValue:l=>p(l)}}function y(a){return String(a||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const S=["Playfair Display","Cormorant Garamond","Libre Baskerville","Merriweather","Lora","Abril Fatface","DM Serif Display","Bodoni Moda","Fraunces","Spectral"],E=["Inter","DM Sans","Plus Jakarta Sans","Outfit","Nunito Sans","Source Sans 3","Karla","Mulish","Work Sans","Jost"];function _({value:a="",fonts:n=E,label:o="",onChange:r}={}){const c=document.createElement("div");c.className="font-picker-wrap",c.innerHTML=`
    <div class="field-label">${String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
    <div class="font-picker-list"></div>`;const d=c.querySelector(".font-picker-list");function t(l){const s="gf-"+l.replace(/ /g,"-");if(!document.getElementById(s)){const v=document.createElement("link");v.id=s,v.rel="stylesheet",v.href=`https://fonts.googleapis.com/css2?family=${l.replace(/ /g,"+")}:wght@400;500&display=swap`,document.head.appendChild(v)}}function p(l){d.innerHTML=n.map(s=>`
      <button type="button" class="font-option ${s===l?"active":""}" data-font="${s}">
        <span class="font-preview" style="font-family:'${s}',serif;">${s}</span>
      </button>`).join(""),n.forEach(t),d.querySelectorAll(".font-option").forEach(s=>s.onclick=()=>{p(s.dataset.font),r==null||r(s.dataset.font)})}return p(a),{el:c,getValue:()=>{var l;return((l=d.querySelector(".active"))==null?void 0:l.dataset.font)||a}}}let e=null,g="home",I={},b={};async function x(){var d;g=i.screen==="project"?"project":"home",i.context==="project"&&i.projectId?e={...await m.projects.theme(i.projectId)}:e={...await m.themes.global()};const a=t=>String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");document.getElementById("app").innerHTML=`
    <div class="screen-theme">
      <header class="app-header">
        <button class="btn-text" id="btn-back-theme">← Voltar</button>
        <span class="app-logo">Tema</span>
        <div style="display:flex;gap:8px;align-items:center;">
          ${i.context==="project"?'<button class="btn-text" id="btn-use-global">Usar tema global</button>':""}
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
    </div>`;const n=_({value:e.font_display,fonts:S,label:"Fonte de títulos",onChange:t=>{e.font_display=t,u()}});document.getElementById("picker-font-display").appendChild(n.el),b.display=n;const o=_({value:e.font_body,fonts:E,label:"Fonte do corpo",onChange:t=>{e.font_body=t,u()}});document.getElementById("picker-font-body").appendChild(o.el),b.body=o;const r=[{key:"color_bg",label:"Fundo"},{key:"color_text",label:"Texto principal"},{key:"color_emphasis",label:"Cor de destaque"},{key:"color_secondary",label:"Texto secundário"},{key:"color_detail",label:"Detalhes"},{key:"color_border",label:"Bordas"}],c=document.getElementById("color-pickers");r.forEach(({key:t,label:p})=>{const l=w({value:e[t]||"#000000",label:p,onChange:s=>{e[t]=s,u()}});c.appendChild(l.el),I[t]=l}),document.getElementById("upload-logo-dark").onchange=t=>k(t.target.files[0],"dark"),document.getElementById("upload-logo-light").onchange=t=>k(t.target.files[0],"light"),document.getElementById("btn-back-theme").onclick=()=>f(g,i.projectId?{projectId:i.projectId}:{}),document.getElementById("btn-save-theme").onclick=j,(d=document.getElementById("btn-use-global"))==null||d.addEventListener("click",$),u()}async function k(a,n){if(a)try{const{url:o}=await m.uploadBrand(a);n==="dark"?e.brand_logo_dark=o:e.brand_logo_light=o,u()}catch(o){alert("Erro ao fazer upload: "+o.message)}}async function u(){const a=document.getElementById("theme-preview-frame");if(!a)return;const[{themeStyleBlock:n},{RENDERERS:o}]=await Promise.all([h(()=>import("./theme-DPp7_AaX.js"),[]),h(()=>import("./renderers-C9qDyqKT.js"),[])]),r={template:"dark",layout:"a",section_number:"01",section_title:"Prévia do tema",body_html:"Assim ficará o conteúdo dos seus slides.",list_items:["Item um","Item dois"],conclusion_html:"Sua conclusão aqui."},c=o.dark.a,d=c(r,null,e);a.srcdoc=`<!DOCTYPE html><html><head>${n(e)}</head><body style="margin:0;overflow:hidden;">${d}</body></html>`}async function j(){e.brand_name=document.getElementById("t-brand-name").value.trim(),e.brand_symbol=document.getElementById("t-brand-symbol").value.trim(),e.nav_left=document.getElementById("t-nav-left").value.trim(),e.nav_right=document.getElementById("t-nav-right").value.trim();try{await m.themes.update(e.id,e),i.context==="project"&&i.projectId&&await m.projects.update(i.projectId,{theme_id:e.id}),f(g,i.projectId?{projectId:i.projectId}:{})}catch(a){alert("Erro ao salvar tema: "+a.message)}}async function $(){confirm("Remover tema personalizado do projeto e usar o tema global?")&&(await m.projects.update(i.projectId,{theme_id:null}),f("project",{projectId:i.projectId}))}function L(){I={},b={},e=null}export{x as mountThemeEditor,L as unmountThemeEditor};
