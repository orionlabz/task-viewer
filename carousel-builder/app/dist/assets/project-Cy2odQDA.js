const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/editor-atfD4Oj2.js","assets/index-C91zRnbl.js","assets/index-Scg0-m5n.css","assets/theme-fxemBM4G.js","assets/renderers-CwWWVjzg.js"])))=>i.map(i=>d[i]);
import{S as o,n,_ as s,a as r}from"./index-C91zRnbl.js";function p(){var e,a;document.getElementById("app").innerHTML=`
    <div class="screen-project">
      <header class="app-header">
        <button class="btn-text" id="btn-back">← Projetos</button>
        <span id="project-name-header" class="project-header-name"></span>
        <button class="btn-text" id="btn-project-settings">Tema ▾</button>
      </header>
      <main class="project-main">
        <div class="project-top">
          <h2 id="project-title" class="home-title"></h2>
          <button class="btn-primary" id="btn-new-carousel">+ Novo carrossel</button>
        </div>
        <div id="carousels-grid" class="projects-grid">
          <div class="loading-inline">Carregando…</div>
        </div>
      </main>
    </div>`,document.getElementById("project-title").textContent=((e=o.project)==null?void 0:e.name)||"",document.getElementById("project-name-header").textContent=((a=o.project)==null?void 0:a.name)||"",document.getElementById("btn-back").onclick=()=>n("home"),document.getElementById("btn-new-carousel").onclick=i,document.getElementById("btn-project-settings").onclick=()=>n("theme-editor",{context:"project"}),c()}async function c(){const e=await r.carousels.list(o.projectId),a=document.getElementById("carousels-grid");if(!e.length){a.innerHTML='<div class="empty-state">Nenhum carrossel ainda. Crie o primeiro!</div>';return}a.innerHTML=e.map(t=>`
    <div class="project-card" data-id="${t.id}">
      <div class="project-card-body">
        ${t.thumbnail_path?`<img src="${t.thumbnail_path}" class="carousel-thumb" alt="">`:'<div class="carousel-thumb-placeholder"></div>'}
        <div class="project-name" style="margin-top:12px;">${l(t.title)}</div>
        <div class="project-meta">${u(t.updated_at)}</div>
      </div>
      <div class="project-card-footer">
        <button class="btn-text btn-open-carousel" data-id="${t.id}">Editar →</button>
        <button class="btn-icon btn-delete-carousel" data-id="${t.id}" title="Excluir">✕</button>
      </div>
    </div>`).join(""),a.querySelectorAll(".btn-open-carousel").forEach(t=>t.onclick=()=>n("editor",{projectId:o.projectId,carouselId:Number(t.dataset.id)})),a.querySelectorAll(".btn-delete-carousel").forEach(t=>t.onclick=()=>d(Number(t.dataset.id)))}async function i(){const{showNewCarouselModal:e}=await s(async()=>{const{showNewCarouselModal:a}=await import("./editor-atfD4Oj2.js");return{showNewCarouselModal:a}},__vite__mapDeps([0,1,2,3,4]));e()}async function d(e){confirm("Excluir este carrossel?")&&(await r.carousels.delete(e),c())}function l(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function u(e){return new Date(e).toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}function b(){}export{p as mountProject,b as unmountProject};
