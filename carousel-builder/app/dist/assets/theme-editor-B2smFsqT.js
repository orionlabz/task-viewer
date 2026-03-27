import{S as i,a as v,n as h,_ as y}from"./index-CCpCI3Dn.js";function w({value:t="#000000",label:s="",onChange:l}={}){const n=document.createElement("div");n.className="color-picker-wrap",n.innerHTML=`
    <div class="color-picker-row">
      <label class="field-label" style="flex:1;">${_(s)}</label>
      <div class="color-swatch-wrap">
        <input type="color" class="color-native" value="${t}" title="${_(s)}">
        <div class="color-swatch" style="background:${t};"></div>
      </div>
      <input type="text" class="field-input color-hex" value="${t}" maxlength="7" style="width:80px;">
    </div>`;const c=n.querySelector(".color-native"),p=n.querySelector(".color-swatch"),d=n.querySelector(".color-hex");function a(o){/^#[0-9a-f]{6}$/i.test(o)&&(c.value=o,p.style.background=o,d.value=o,l==null||l(o))}return c.addEventListener("input",()=>a(c.value)),d.addEventListener("input",()=>a(d.value)),d.addEventListener("blur",()=>{/^#[0-9a-f]{6}$/i.test(d.value)||(d.value=t)}),{el:n,getValue:()=>d.value,setValue:o=>a(o)}}function _(t){return String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const S=["Playfair Display","Cormorant Garamond","Libre Baskerville","Merriweather","Lora","Abril Fatface","DM Serif Display","Bodoni Moda","Fraunces","Spectral"],I=["Inter","DM Sans","Plus Jakarta Sans","Outfit","Nunito Sans","Source Sans 3","Karla","Mulish","Work Sans","Jost"],B=["JetBrains Mono","DM Mono","IBM Plex Mono","Space Mono","Fira Code","Roboto Mono","Space Grotesk","Syne","Barlow Condensed","Oswald"];function g({value:t="",fonts:s=I,label:l="",onChange:n}={}){const c=document.createElement("div");c.className="font-picker-wrap",c.innerHTML=`
    <div class="field-label">${String(l).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
    <div class="font-picker-list"></div>`;const p=c.querySelector(".font-picker-list");function d(o){const r="gf-"+o.replace(/ /g,"-");if(!document.getElementById(r)){const m=document.createElement("link");m.id=r,m.rel="stylesheet",m.href=`https://fonts.googleapis.com/css2?family=${o.replace(/ /g,"+")}:wght@400;500&display=swap`,document.head.appendChild(m)}}function a(o){p.innerHTML=s.map(r=>`
      <button type="button" class="font-option ${r===o?"active":""}" data-font="${r}">
        <span class="font-preview" style="font-family:'${r}',serif;">${r}</span>
      </button>`).join(""),s.forEach(d),p.querySelectorAll(".font-option").forEach(r=>r.onclick=()=>{a(r.dataset.font),n==null||n(r.dataset.font)})}return a(t),{el:c,getValue:()=>{var o;return((o=p.querySelector(".active"))==null?void 0:o.dataset.font)||t}}}let e=null,b="home",E={},f={};async function T(){var d;b=i.screen==="project"?"project":"home",i.context==="project"&&i.projectId?e={...await v.projects.theme(i.projectId)}:e={...await v.themes.global()};const t=a=>String(a||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");document.getElementById("app").innerHTML=`
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
                <input class="form-input" id="t-brand-name" value="${t(e.brand_name||"")}">
              </div>
              <div class="form-group">
                <label class="form-label">Símbolo (emoji/char)</label>
                <input class="form-input" id="t-brand-symbol" value="${t(e.brand_symbol||"⬥")}" style="width:80px;">
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
                <input class="form-input" id="t-nav-left" value="${t(e.nav_left||"CATEGORIA")}">
              </div>
              <div class="form-group">
                <label class="form-label">Nav direito</label>
                <input class="form-input" id="t-nav-right" value="${t(e.nav_right||"SÉRIE")}">
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
    </div>`;const s=g({value:e.font_display,fonts:S,label:"Fonte de títulos",onChange:a=>{e.font_display=a,u()}});document.getElementById("picker-font-display").appendChild(s.el),f.display=s;const l=g({value:e.font_body,fonts:I,label:"Fonte do corpo",onChange:a=>{e.font_body=a,u()}});document.getElementById("picker-font-body").appendChild(l.el),f.body=l;const n=g({value:e.font_ui||"JetBrains Mono",fonts:B,label:"Fonte UI (marca · nav · números)",onChange:a=>{e.font_ui=a,u()}});document.getElementById("picker-font-ui").appendChild(n.el),f.ui=n;const c=[{key:"color_bg",label:"Fundo"},{key:"color_text",label:"Texto principal"},{key:"color_emphasis",label:"Cor de destaque"},{key:"color_secondary",label:"Texto secundário"},{key:"color_detail",label:"Detalhes"},{key:"color_border",label:"Bordas"}],p=document.getElementById("color-pickers");c.forEach(({key:a,label:o})=>{const r=w({value:e[a]||"#000000",label:o,onChange:m=>{e[a]=m,u()}});p.appendChild(r.el),E[a]=r}),document.getElementById("upload-logo-dark").onchange=a=>k(a.target.files[0],"dark"),document.getElementById("upload-logo-light").onchange=a=>k(a.target.files[0],"light"),document.getElementById("btn-back-theme").onclick=()=>h(b,i.projectId?{projectId:i.projectId}:{}),document.getElementById("btn-save-theme").onclick=j,(d=document.getElementById("btn-use-global"))==null||d.addEventListener("click",$),u()}async function k(t,s){if(t)try{const{url:l}=await v.uploadBrand(t);s==="dark"?e.brand_logo_dark=l:e.brand_logo_light=l,u()}catch(l){alert("Erro ao fazer upload: "+l.message)}}async function u(){const t=document.getElementById("theme-preview-frame");if(!t)return;const[{themeStyleBlock:s},{RENDERERS:l}]=await Promise.all([y(()=>import("./theme-fxemBM4G.js"),[]),y(()=>import("./renderers-Cu2LIkGV.js"),[])]),n={template:"dark",layout:"a",section_number:"01",section_title:"Prévia do tema",body_html:"Assim ficará o conteúdo dos seus slides.",list_items:["Item um","Item dois"],conclusion_html:"Sua conclusão aqui."},c=l.dark.a,p=c(n,null,e);t.srcdoc=`<!DOCTYPE html><html><head>${s(e)}</head><body style="margin:0;overflow:hidden;">${p}</body></html>`}async function j(){e.brand_name=document.getElementById("t-brand-name").value.trim(),e.brand_symbol=document.getElementById("t-brand-symbol").value.trim(),e.nav_left=document.getElementById("t-nav-left").value.trim(),e.nav_right=document.getElementById("t-nav-right").value.trim();try{await v.themes.update(e.id,e),i.context==="project"&&i.projectId&&await v.projects.update(i.projectId,{theme_id:e.id}),h(b,i.projectId?{projectId:i.projectId}:{})}catch(t){alert("Erro ao salvar tema: "+t.message)}}async function $(){confirm("Remover tema personalizado do projeto e usar o tema global?")&&(await v.projects.update(i.projectId,{theme_id:null}),h("project",{projectId:i.projectId}))}function L(){E={},f={},e=null}export{T as mountThemeEditor,L as unmountThemeEditor};
