function t(i){return String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function r(i){return i||""}function y(i){const o=i.layout||"a",e=h[i.template];return(e==null?void 0:e[o])??(e==null?void 0:e.a)??h.dark.a}const b={cover:{a:"Ancorado",b:"Editorial",c:"Linha de corte"},dark:{a:"Stacked",b:"Nº fundo",c:"2 colunas"},steps:{a:"Lista",b:"Numerado",c:"Ícones"},overlay:{a:"Foto topo",b:"Full-bleed"},split:{a:"Padrão"},cta:{a:"Headline",c:"Centrado"}},c=i=>`font-family:'${(i==null?void 0:i.font_display)||"Playfair Display"}',serif;`,n=i=>`font-family:'${(i==null?void 0:i.font_body)||"Inter"}',sans-serif;`;function m(i){const o=(i==null?void 0:i.nav_left)||"CATEGORIA",e=(i==null?void 0:i.nav_right)||"SÉRIE";return`<div style="${n(i)}display:flex;align-items:center;gap:22px;font-size:22px;letter-spacing:.18em;color:#303030;text-transform:uppercase;margin-bottom:96px;">
    <span>${t(o)}</span>
    <div style="flex:1;height:1px;background:#1e1e1e;"></div>
    <span>${t(e)}</span>
  </div>`}function v(i){const o=(i==null?void 0:i.brand_symbol)||"⬥",e=(i==null?void 0:i.brand_name)||"Marca";return`<div style="${n(i)}display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:36px;">
    <span style="font-size:28px;color:#252525;">${t(o)} ${t(e)}</span>
    <span style="font-size:22px;letter-spacing:.14em;color:#252525;text-transform:uppercase;">${t(e.toUpperCase())}</span>
  </div>`}const h={cover:{a(i,o,e){const l=o?`<div style="position:absolute;inset:0;"><img src="${o}" style="width:100%;height:100%;object-fit:cover;filter:saturate(0.6);"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.6) 42%,transparent 72%);"></div></div>`:'<div style="position:absolute;inset:0;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=(e==null?void 0:e.brand_symbol)||"⬥",a=(e==null?void 0:e.brand_name)||"Marca",d=r(i.headline_html||(i.headline?t(i.headline)+(i.headline_italic?" <em>"+t(i.headline_italic)+"</em>":""):"")),x=r(i.body_html||t(i.body||""));return`<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;">
        ${l}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="${n(e)}font-size:22px;color:#fff;opacity:.9;">${t(s)} ${t(a)}</div>
          <div style="flex:1;"></div>
          <div style="${c(e)}font-size:84px;line-height:1.05;font-weight:400;color:#fff;margin-bottom:28px;">
            ${d}
          </div>
          <div style="${n(e)}font-size:27px;color:#777;line-height:1.5;">${x}</div>
        </div>
      </div>`},b(i,o,e){const l=o?`<div style="position:absolute;inset:0;"><img src="${o}" style="width:100%;height:100%;object-fit:cover;filter:saturate(0.6);"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.6) 42%,transparent 72%);"></div></div>`:'<div style="position:absolute;inset:0;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=(e==null?void 0:e.brand_symbol)||"⬥",a=(e==null?void 0:e.brand_name)||"Marca",d=(e==null?void 0:e.nav_left)||"CATEGORIA",x=r(i.headline_html||(i.headline?t(i.headline)+(i.headline_italic?" <em>"+t(i.headline_italic)+"</em>":""):"")),p=r(i.body_html||t(i.body||""));return`<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;">
        ${l}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:auto;">
            <div style="${n(e)}font-size:22px;color:#fff;opacity:.9;">${t(s)} ${t(a)}</div>
          </div>
          <div style="display:flex;flex-direction:column;">
            <div style="${n(e)}font-size:18px;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:24px;">${t(d)}</div>
            <div style="${c(e)}font-size:84px;line-height:1.05;font-weight:400;color:#fff;margin-bottom:28px;">
              ${x}
            </div>
            <div style="width:80px;height:1px;background:#2a2a2a;margin-bottom:28px;"></div>
            <div style="${n(e)}font-size:27px;color:#666;line-height:1.5;">${p}</div>
          </div>
        </div>
      </div>`},c(i,o,e){const l=o?`<div style="position:absolute;inset:0;"><img src="${o}" style="width:100%;height:100%;object-fit:cover;filter:saturate(0.6);"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.7) 55%,rgba(0,0,0,.3) 100%);"></div></div>`:'<div style="position:absolute;inset:0;background:#050505;"></div>',s=(e==null?void 0:e.brand_symbol)||"⬥",a=(e==null?void 0:e.brand_name)||"Marca",d=(e==null?void 0:e.nav_left)||"CATEGORIA",x=(e==null?void 0:e.nav_right)||"SÉRIE",p=r(i.headline_html||(i.headline?t(i.headline)+(i.headline_italic?" <em>"+t(i.headline_italic)+"</em>":""):"")),f=r(i.body_html||t(i.body||""));return`<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;">
        ${l}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
            <div style="${n(e)}font-size:22px;color:#fff;opacity:.85;">${t(s)} ${t(a)}</div>
            <div style="${n(e)}font-size:18px;letter-spacing:.18em;color:#2a2a2a;text-transform:uppercase;">${t(x)}</div>
          </div>
          <div style="width:100%;height:1px;background:linear-gradient(to right,#fff,transparent);margin-bottom:48px;"></div>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
            <div style="${c(e)}font-size:84px;line-height:1.05;font-weight:400;color:#fff;margin-bottom:28px;">
              ${p}
            </div>
            <div style="${n(e)}font-size:27px;color:#666;line-height:1.5;">${f}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="${n(e)}font-size:18px;letter-spacing:.18em;color:#252525;text-transform:uppercase;">${t(d)}</div>
          </div>
        </div>
      </div>`}},split:{a(i,o,e){const l=o?`<img src="${o}" style="width:100%;height:100%;object-fit:cover;filter:grayscale(90%) contrast(1.05);">`:'<div style="width:100%;height:100%;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=r(i.headline_html||(i.headline?t(i.headline)+(i.headline_italic?" <em>"+t(i.headline_italic)+"</em>":""):"")),a=r(i.body_html||t(i.body||""));return`<div style="width:1080px;height:1350px;display:flex;background:#000;">
        <div style="flex:0 0 52%;display:flex;flex-direction:column;padding:54px 52px 60px 76px;">
          ${m(e)}
          <div style="${c(e)}font-size:62px;line-height:1.1;font-weight:400;color:#fff;margin-bottom:28px;">
            ${s}
          </div>
          <div style="${n(e)}font-size:27px;color:#777;line-height:1.5;margin-bottom:auto;">${a}</div>
          ${v(e)}
        </div>
        <div style="flex:0 0 48%;overflow:hidden;">${l}</div>
      </div>`}},dark:{a(i,o,e){const l=(i.list_items||[]).map(d=>`<div style="display:flex;gap:16px;margin-bottom:16px;">
          <span style="${n(e)}color:#555;font-size:27px;flex-shrink:0;">·</span>
          <span style="${n(e)}font-size:27px;color:#666;line-height:1.45;">${t(d)}</span>
         </div>`).join(""),s=r(i.body_html||t(i.body||"")),a=r(i.conclusion_html||t(i.conclusion||""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 60px;">
        ${m(e)}
        <div style="${n(e)}font-size:22px;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:16px;">${t(i.section_number)}</div>
        <div style="${c(e)}font-size:62px;line-height:1.1;font-weight:400;color:#fff;margin-bottom:36px;">${t(i.section_title)}</div>
        <div style="${n(e)}font-size:27px;color:#666;line-height:1.5;margin-bottom:32px;">${s}</div>
        <div style="margin-bottom:24px;">${l}</div>
        <div style="${n(e)}font-size:27px;color:#555;line-height:1.5;margin-bottom:auto;">${a}</div>
        ${v(e)}
      </div>`},b(i,o,e){const l=(i.list_items||[]).map(g=>`<div style="display:flex;gap:28px;margin-bottom:22px;align-items:baseline;">
          <div style="width:20px;height:1px;background:#2a2a2a;flex-shrink:0;margin-top:14px;"></div>
          <span style="${n(e)}font-size:27px;color:#3a3a3a;line-height:1.45;">${t(g)}</span>
         </div>`).join(""),s=(e==null?void 0:e.nav_left)||"CATEGORIA",a=(e==null?void 0:e.nav_right)||"SÉRIE",d=(e==null?void 0:e.brand_symbol)||"⬥",x=(e==null?void 0:e.brand_name)||"Marca",p=r(i.body_html||t(i.body||"")),f=r(i.conclusion_html||t(i.conclusion||""));return`<div style="width:1080px;height:1350px;background:#060606;display:flex;flex-direction:column;padding:54px 76px 80px;position:relative;overflow:hidden;">
        <div style="${c(e)}position:absolute;top:-20px;right:40px;font-size:480px;color:#111;line-height:1;user-select:none;pointer-events:none;letter-spacing:-.02em;">${t(i.section_number||"")}</div>
        <div style="display:flex;align-items:center;gap:22px;font-size:0;padding-bottom:40px;position:relative;">
          <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${t(s)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${t(a)}</span>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;position:relative;">
          <div style="${n(e)}font-size:18px;letter-spacing:.22em;color:#2e2e2e;text-transform:uppercase;margin-bottom:24px;">Seção ${t(i.section_number||"")}</div>
          <div style="${c(e)}font-size:72px;line-height:1.05;font-weight:400;color:#e8e8e8;margin-bottom:40px;">${t(i.section_title)}</div>
          <div style="${n(e)}font-size:27px;color:#505050;line-height:1.6;margin-bottom:48px;">${p}</div>
          <div style="margin-bottom:0;">${l}</div>
          <div style="margin-top:auto;padding-top:32px;">
            <div style="${c(e)}font-size:27px;color:#2e2e2e;line-height:1.5;font-style:italic;">${f}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:36px;">
          <span style="${n(e)}font-size:22px;color:#1e1e1e;">${t(d)} ${t(x)}</span>
          <span style="${n(e)}font-size:18px;letter-spacing:.14em;color:#1a1a1a;text-transform:uppercase;">${t(x)}</span>
        </div>
      </div>`},c(i,o,e){const l=(i.list_items||[]).map(g=>`<div style="display:flex;gap:28px;margin-bottom:22px;align-items:baseline;">
          <span style="${n(e)}color:#555;font-size:27px;flex-shrink:0;">·</span>
          <span style="${n(e)}font-size:27px;color:#666;line-height:1.45;">${t(g)}</span>
         </div>`).join(""),s=(e==null?void 0:e.nav_left)||"CATEGORIA",a=(e==null?void 0:e.nav_right)||"SÉRIE",d=(e==null?void 0:e.brand_symbol)||"⬥",x=(e==null?void 0:e.brand_name)||"Marca",p=r(i.body_html||t(i.body||"")),f=r(i.conclusion_html||t(i.conclusion||""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:48px;">
          <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${t(s)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${t(a)}</span>
        </div>
        <div style="display:flex;gap:52px;align-items:flex-start;margin-bottom:52px;border-top:1px solid #1a1a1a;padding-top:36px;">
          <div style="flex:0 0 160px;">
            <div style="${n(e)}font-size:14px;letter-spacing:.18em;color:#2a2a2a;text-transform:uppercase;margin-bottom:8px;">Seção</div>
            <div style="${c(e)}font-size:120px;color:#161616;line-height:1;letter-spacing:-.02em;">${t(i.section_number||"")}</div>
          </div>
          <div style="flex:1;padding-top:8px;">
            <div style="${c(e)}font-size:62px;line-height:1.1;font-weight:400;color:#fff;">${t(i.section_title)}</div>
          </div>
        </div>
        <div style="${n(e)}font-size:27px;color:#666;line-height:1.5;margin-bottom:32px;">${p}</div>
        <div style="margin-bottom:24px;">${l}</div>
        <div style="${n(e)}font-size:27px;color:#3a3a3a;line-height:1.5;margin-bottom:auto;">${f}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:36px;">
          <span style="${n(e)}font-size:22px;color:#252525;">${t(d)} ${t(x)}</span>
          <span style="${n(e)}font-size:22px;letter-spacing:.14em;color:#252525;text-transform:uppercase;">${t(x)}</span>
        </div>
      </div>`}},steps:{a(i,o,e){const l=(i.steps||[]).map(a=>`<div style="margin-bottom:24px;">
          <span style="${n(e)}font-size:27px;font-weight:500;color:#fff;">${t(a.label)}:</span>
          <span style="${n(e)}font-size:27px;color:#666;"> ${r(a.text_html||t(a.text||""))}</span>
         </div>`).join(""),s=r(i.call_to_action_html||(i.call_to_action?t(i.call_to_action)+(i.call_to_action_italic?" <em>"+t(i.call_to_action_italic)+"</em>":""):""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 60px;">
        ${m(e)}
        ${i.section_title?`<div style="${c(e)}font-size:48px;font-weight:400;color:#fff;margin-bottom:36px;">${t(i.section_title)}</div>`:""}
        <div style="flex:1;">${l}</div>
        <div style="${c(e)}font-size:62px;font-weight:400;color:#fff;line-height:1.1;margin-bottom:auto;">
          ${s}
        </div>
        ${v(e)}
      </div>`},b(i,o,e){const l=(i.steps||[]).map(f=>{var g;return`<div style="display:flex;align-items:baseline;gap:36px;margin-bottom:32px;">
          <span style="${c(e)}font-size:100px;color:#161616;line-height:1;flex-shrink:0;width:100px;">${t(((g=f.label.match(/\d+/))==null?void 0:g[0])||"")}</span>
          <div style="flex:1;">
            <div style="${n(e)}font-size:22px;font-weight:500;color:#aaa;letter-spacing:.06em;margin-bottom:6px;">${t(f.label.replace(/^\d+[:,.]?\s*/,""))}</div>
            <div style="${n(e)}font-size:24px;color:#444;line-height:1.5;">${r(f.text_html||t(f.text||""))}</div>
          </div>
        </div>`}).join(""),s=(e==null?void 0:e.nav_left)||"CATEGORIA",a=(e==null?void 0:e.nav_right)||"SÉRIE",d=(e==null?void 0:e.brand_symbol)||"⬥",x=(e==null?void 0:e.brand_name)||"Marca",p=r(i.call_to_action_html||(i.call_to_action?t(i.call_to_action)+(i.call_to_action_italic?" <em>"+t(i.call_to_action_italic)+"</em>":""):""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:48px;">
          <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${t(s)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${t(a)}</span>
        </div>
        ${i.section_title?`<div style="${n(e)}font-size:18px;letter-spacing:.2em;color:#2a2a2a;text-transform:uppercase;margin-bottom:48px;">${t(i.section_title)}</div>`:""}
        <div style="flex:1;">${l}</div>
        <div style="${c(e)}font-size:62px;font-weight:400;color:#fff;line-height:1.1;margin-bottom:auto;padding-top:24px;">
          ${p}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:36px;">
          <span style="${n(e)}font-size:22px;color:#252525;">${t(d)} ${t(x)}</span>
          <span style="${n(e)}font-size:22px;letter-spacing:.14em;color:#252525;text-transform:uppercase;">${t(x)}</span>
        </div>
      </div>`},c(i,o,e){const l=i.steps||[],s=(e==null?void 0:e.nav_left)||"CATEGORIA",a=(e==null?void 0:e.nav_right)||"SÉRIE",d=l.slice(0,4).map(p=>{let f='<div style="width:48px;height:48px;border-radius:50%;border:1px solid #1e1e1e;margin-bottom:20px;"></div>';return p.icon&&(p.icon.type==="lucide"&&p.icon.svg?f=`<div style="margin-bottom:20px;">${p.icon.svg}</div>`:p.icon.type==="upload"&&p.icon.src&&(f=`<img src="${t(p.icon.src)}" style="width:48px;height:48px;object-fit:contain;margin-bottom:20px;">`)),`<div style="background:#0d0d0d;border-radius:12px;padding:40px 36px;display:flex;flex-direction:column;">
          ${f}
          <div style="${n(e)}font-size:20px;color:#888;font-weight:500;letter-spacing:.04em;margin-bottom:12px;">${t(p.label.replace(/^\d+[:,.]?\s*/,""))}</div>
          <div style="${n(e)}font-size:22px;color:#3a3a3a;line-height:1.5;">${r(p.text_html||t(p.text||""))}</div>
        </div>`}).join(""),x=r(i.call_to_action_html||(i.call_to_action?t(i.call_to_action)+(i.call_to_action_italic?" <em>"+t(i.call_to_action_italic)+"</em>":""):""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:48px;">
          <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${t(s)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${t(a)}</span>
        </div>
        <div style="${c(e)}font-size:52px;font-weight:400;color:#fff;line-height:1.1;margin-bottom:40px;">${t(i.section_title||"")}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;">${d}</div>
        <div style="${c(e)}font-size:48px;font-weight:400;color:#fff;line-height:1.1;padding-top:32px;">
          ${x}
        </div>
      </div>`}},overlay:{a(i,o,e){const l=o?`<img src="${o}" style="width:100%;height:100%;object-fit:cover;">`:'<div style="width:100%;height:100%;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=r(i.body_html||t(i.body||""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:14px 14px 0;">
        <div style="height:680px;border-radius:18px;overflow:hidden;position:relative;flex-shrink:0;">
          ${l}
          <div style="position:absolute;bottom:0;left:0;right:0;height:200px;background:linear-gradient(to top,#000,transparent);"></div>
        </div>
        <div style="flex:1;padding:32px 62px 60px;display:flex;flex-direction:column;">
          ${m(e)}
          <div style="${n(e)}font-size:22px;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:12px;">${t(i.section_number)}</div>
          <div style="${c(e)}font-size:62px;font-weight:400;color:#fff;line-height:1.1;margin-bottom:16px;">${t(i.section_title)}</div>
          <div style="${c(e)}font-size:36px;font-weight:400;font-style:italic;color:#aaa;margin-bottom:20px;">${t(i.headline)}</div>
          <div style="${n(e)}font-size:24px;color:#666;line-height:1.5;margin-bottom:auto;">${s}</div>
          ${v(e)}
        </div>
      </div>`},b(i,o,e){const l=o?`<img src="${o}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">`:'<div style="position:absolute;inset:0;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=(e==null?void 0:e.brand_symbol)||"⬥",a=(e==null?void 0:e.brand_name)||"Marca",d=(e==null?void 0:e.nav_left)||"CATEGORIA",x=(e==null?void 0:e.nav_right)||"SÉRIE",p=r(i.headline_html||(i.headline?t(i.headline)+(i.headline_italic?" <em>"+t(i.headline_italic)+"</em>":""):"")),f=r(i.body_html||t(i.body||""));return`<div style="width:1080px;height:1350px;background:#000;position:relative;overflow:hidden;">
        ${l}
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.75) 40%,rgba(0,0,0,.2) 70%,transparent 100%);"></div>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="display:flex;align-items:center;gap:22px;">
            <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:rgba(255,255,255,.18);text-transform:uppercase;">${t(d)}</span>
            <div style="flex:1;height:1px;background:rgba(255,255,255,.06);"></div>
            <span style="${n(e)}font-size:18px;letter-spacing:.18em;color:rgba(255,255,255,.18);text-transform:uppercase;">${t(x)}</span>
          </div>
          <div style="flex:1;"></div>
          <div style="${n(e)}font-size:18px;letter-spacing:.18em;color:#3a3a3a;text-transform:uppercase;margin-bottom:20px;">${t(i.section_number)} — ${t(i.section_title)}</div>
          <div style="${c(e)}font-size:72px;line-height:1.05;font-weight:400;color:#fff;margin-bottom:28px;">
            ${p}
          </div>
          <div style="${n(e)}font-size:27px;color:#666;line-height:1.5;margin-bottom:36px;">${f}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="${n(e)}font-size:22px;color:#1e1e1e;">${t(s)} ${t(a)}</span>
            <span style="${n(e)}font-size:22px;letter-spacing:.14em;color:#1a1a1a;text-transform:uppercase;">${t(a)}</span>
          </div>
        </div>
      </div>`}},cta:{a(i,o,e){const l=(e==null?void 0:e.brand_symbol)||"⬥",s=(e==null?void 0:e.brand_name)||"Marca",a=r(i.headline_html||(i.headline?t(i.headline)+(i.headline_italic?" <em>"+t(i.headline_italic)+"</em>":""):"")),d=r(i.body_html||t(i.body||""));return`<div style="width:1080px;height:1350px;background:#000;border:1px solid #161616;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="${n(e)}font-size:22px;color:#fff;margin-bottom:auto;">${t(l)} ${t(s)}</div>
        <div style="${c(e)}font-size:84px;line-height:1.05;font-weight:400;font-style:italic;color:#fff;margin-bottom:40px;">
          ${a}
        </div>
        <div style="${n(e)}font-size:27px;color:#444;line-height:1.5;margin-bottom:60px;">${d}</div>
        <div style="${n(e)}font-size:32px;color:#fff;line-height:1.4;">
          ${t(i.cta_text)}
          <span style="text-decoration:underline;text-underline-offset:4px;">${t(i.cta_word)}</span>
          ${t(i.cta_suffix)}
        </div>
      </div>`},c(i,o,e){const l=(e==null?void 0:e.brand_symbol)||"⬥",s=(e==null?void 0:e.brand_name)||"Marca",a=r(i.headline_html||(i.headline?t(i.headline)+(i.headline_italic?" <em>"+t(i.headline_italic)+"</em>":""):"")),d=r(i.body_html||t(i.body||""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 96px;text-align:center;">
        <div style="${n(e)}font-size:22px;color:#252525;letter-spacing:.18em;margin-bottom:60px;">${t(l)} ${t(s)}</div>
        <div style="${c(e)}font-size:84px;line-height:1.05;font-weight:400;color:#fff;margin-bottom:36px;">
          ${a}
        </div>
        <div style="width:80px;height:1px;background:#1c1c1c;margin-bottom:36px;"></div>
        <div style="${n(e)}font-size:27px;color:#3a3a3a;line-height:1.6;margin-bottom:60px;">${d}</div>
        <div style="border:1px solid #2a2a2a;border-radius:9999px;padding:24px 60px;display:inline-block;">
          <div style="${n(e)}font-size:30px;color:#555;letter-spacing:.04em;line-height:1.4;">
            ${t(i.cta_text)} <span style="color:#fff;font-weight:500;">${t(i.cta_word)}</span> ${t(i.cta_suffix)}
          </div>
        </div>
      </div>`}}};export{b as LAYOUT_NAMES,h as RENDERERS,y as getRenderer};
