function n(i){return String(i??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function r(i){return i||""}function w(i){const o=i.layout||"a",e=z[i.template];return(e==null?void 0:e[o])??(e==null?void 0:e.a)??z.dark.a}const k={cover:{a:"Ancorado",b:"Editorial",c:"Linha de corte"},dark:{a:"Stacked",b:"Nº fundo",c:"2 colunas"},steps:{a:"Lista",b:"Numerado",c:"Ícones"},overlay:{a:"Foto topo",b:"Full-bleed",c:"Foto topo + fundo blur"},split:{a:"Padrão"},cta:{a:"Headline",c:"Centrado"}},x=i=>`font-family:'${(i==null?void 0:i.font_display)||"Playfair Display"}',serif;`,d=i=>`font-family:'${(i==null?void 0:i.font_body)||"Inter"}',sans-serif;`,t=i=>`font-family:'${(i==null?void 0:i.font_ui)||"JetBrains Mono"}',monospace;`,v=(i,o)=>Math.round((+(i==null?void 0:i.font_size_headline)||72)*o/72),p=(i,o)=>Math.round((+(i==null?void 0:i.font_size_body)||36)*o/36),h=i=>+(i==null?void 0:i.line_height_headline)||1.05,g=i=>+(i==null?void 0:i.line_height_body)||1.5;function $(i){const o=i.img_position;if(!o)return"";const e=o.x??50,l=o.y??50,s=o.scale??1;return`object-position:${e}% ${l}%;transform:scale(${s});transform-origin:${e}% ${l}%;`}function _(i){const o=(i==null?void 0:i.nav_left)||"CATEGORIA",e=(i==null?void 0:i.nav_right)||"SÉRIE";return`<div style="${t(i)}display:flex;align-items:center;gap:22px;font-size:22px;letter-spacing:.18em;color:#303030;text-transform:uppercase;margin-bottom:96px;">
    <span>${n(o)}</span>
    <div style="flex:1;height:1px;background:#1e1e1e;"></div>
    <span>${n(e)}</span>
  </div>`}function u(i){const o=(i==null?void 0:i.brand_symbol)||"⬥",e=(i==null?void 0:i.brand_name)||"Marca";return`<div style="${t(i)}display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:36px;">
    <span style="font-size:28px;color:#252525;">${n(o)} ${n(e)}</span>
    <span style="font-size:22px;letter-spacing:.14em;color:#252525;text-transform:uppercase;">${n(e.toUpperCase())}</span>
  </div>`}const z={cover:{a(i,o,e){const l=o?`<div style="position:absolute;inset:0;"><img src="${o}" style="width:100%;height:100%;object-fit:cover;${$(i)}filter:saturate(0.6);"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.6) 42%,transparent 72%);"></div></div>`:'<div style="position:absolute;inset:0;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=(e==null?void 0:e.brand_symbol)||"⬥",a=(e==null?void 0:e.brand_name)||"Marca",c=r(i.headline_html||(i.headline?n(i.headline)+(i.headline_italic?" <em>"+n(i.headline_italic)+"</em>":""):"")),m=r(i.body_html||n(i.body||""));return`<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;">
        ${l}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="${t(e)}font-size:22px;color:#fff;opacity:.9;">${n(s)} ${n(a)}</div>
          <div style="flex:1;"></div>
          <div style="${x(e)}font-size:${v(e,84)}px;line-height:${h(e)};font-weight:400;color:#fff;margin-bottom:28px;">
            ${c}
          </div>
          <div style="${d(e)}font-size:${p(e,36)}px;color:#777;line-height:${g(e)};">${m}</div>
        </div>
      </div>`},b(i,o,e){const l=o?`<div style="position:absolute;inset:0;"><img src="${o}" style="width:100%;height:100%;object-fit:cover;${$(i)}filter:saturate(0.6);"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.6) 42%,transparent 72%);"></div></div>`:'<div style="position:absolute;inset:0;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=(e==null?void 0:e.brand_symbol)||"⬥",a=(e==null?void 0:e.brand_name)||"Marca",c=(e==null?void 0:e.nav_left)||"CATEGORIA",m=r(i.headline_html||(i.headline?n(i.headline)+(i.headline_italic?" <em>"+n(i.headline_italic)+"</em>":""):"")),f=r(i.body_html||n(i.body||""));return`<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;">
        ${l}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:auto;">
            <div style="${t(e)}font-size:22px;color:#fff;opacity:.9;">${n(s)} ${n(a)}</div>
          </div>
          <div style="display:flex;flex-direction:column;">
            <div style="${t(e)}font-size:18px;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:24px;">${n(c)}</div>
            <div style="${x(e)}font-size:${v(e,84)}px;line-height:${h(e)};font-weight:400;color:#fff;margin-bottom:28px;">
              ${m}
            </div>
            <div style="width:80px;height:1px;background:#2a2a2a;margin-bottom:28px;"></div>
            <div style="${d(e)}font-size:${p(e,36)}px;color:#666;line-height:${g(e)};">${f}</div>
          </div>
        </div>
      </div>`},c(i,o,e){const l=o?`<div style="position:absolute;inset:0;"><img src="${o}" style="width:100%;height:100%;object-fit:cover;${$(i)}filter:saturate(0.6);"><div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.7) 55%,rgba(0,0,0,.3) 100%);"></div></div>`:'<div style="position:absolute;inset:0;background:#050505;"></div>',s=(e==null?void 0:e.brand_symbol)||"⬥",a=(e==null?void 0:e.brand_name)||"Marca",c=(e==null?void 0:e.nav_left)||"CATEGORIA",m=(e==null?void 0:e.nav_right)||"SÉRIE",f=r(i.headline_html||(i.headline?n(i.headline)+(i.headline_italic?" <em>"+n(i.headline_italic)+"</em>":""):"")),y=r(i.body_html||n(i.body||""));return`<div style="position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;">
        ${l}
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;">
            <div style="${t(e)}font-size:22px;color:#fff;opacity:.85;">${n(s)} ${n(a)}</div>
            <div style="${t(e)}font-size:18px;letter-spacing:.18em;color:#2a2a2a;text-transform:uppercase;">${n(m)}</div>
          </div>
          <div style="width:100%;height:1px;background:linear-gradient(to right,#fff,transparent);margin-bottom:48px;"></div>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
            <div style="${x(e)}font-size:${v(e,84)}px;line-height:${h(e)};font-weight:400;color:#fff;margin-bottom:28px;">
              ${f}
            </div>
            <div style="${d(e)}font-size:${p(e,36)}px;color:#666;line-height:${g(e)};">${y}</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="${t(e)}font-size:18px;letter-spacing:.18em;color:#252525;text-transform:uppercase;">${n(c)}</div>
          </div>
        </div>
      </div>`}},split:{a(i,o,e){const l=o?`<img src="${o}" style="width:100%;height:100%;object-fit:cover;${$(i)}filter:grayscale(90%) contrast(1.05);">`:'<div style="width:100%;height:100%;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=r(i.headline_html||(i.headline?n(i.headline)+(i.headline_italic?" <em>"+n(i.headline_italic)+"</em>":""):"")),a=r(i.body_html||n(i.body||""));return`<div style="width:1080px;height:1350px;display:flex;background:#000;">
        <div style="flex:0 0 52%;display:flex;flex-direction:column;padding:54px 52px 60px 76px;">
          ${_(e)}
          <div style="${x(e)}font-size:${v(e,62)}px;line-height:${h(e)};font-weight:400;color:#fff;margin-bottom:28px;">
            ${s}
          </div>
          <div style="${d(e)}font-size:${p(e,36)}px;color:#777;line-height:${g(e)};margin-bottom:auto;">${a}</div>
          ${u(e)}
        </div>
        <div style="flex:0 0 48%;overflow:hidden;">${l}</div>
      </div>`}},dark:{a(i,o,e){const l=(i.list_items||[]).map(c=>`<div style="display:flex;gap:16px;margin-bottom:16px;">
          <span style="${d(e)}color:#555;font-size:${p(e,36)}px;flex-shrink:0;">·</span>
          <span style="${d(e)}font-size:${p(e,36)}px;color:#666;line-height:${g(e)};">${n(c)}</span>
         </div>`).join(""),s=r(i.body_html||n(i.body||"")),a=r(i.conclusion_html||n(i.conclusion||""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 60px;">
        ${_(e)}
        <div style="${t(e)}font-size:22px;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:16px;">${n(i.section_number)}</div>
        <div style="${x(e)}font-size:${v(e,62)}px;line-height:${h(e)};font-weight:400;color:#fff;margin-bottom:36px;">${n(i.section_title)}</div>
        <div style="${d(e)}font-size:${p(e,36)}px;color:#666;line-height:${g(e)};margin-bottom:32px;">${s}</div>
        <div style="margin-bottom:24px;">${l}</div>
        <div style="${d(e)}font-size:${p(e,36)}px;color:#555;line-height:${g(e)};margin-bottom:auto;">${a}</div>
        ${u(e)}
      </div>`},b(i,o,e){const l=(i.list_items||[]).map(b=>`<div style="display:flex;gap:28px;margin-bottom:22px;align-items:baseline;">
          <div style="width:20px;height:1px;background:#2a2a2a;flex-shrink:0;margin-top:14px;"></div>
          <span style="${d(e)}font-size:${p(e,36)}px;color:#3a3a3a;line-height:${g(e)};">${n(b)}</span>
         </div>`).join(""),s=(e==null?void 0:e.nav_left)||"CATEGORIA",a=(e==null?void 0:e.nav_right)||"SÉRIE",c=(e==null?void 0:e.brand_symbol)||"⬥",m=(e==null?void 0:e.brand_name)||"Marca",f=r(i.body_html||n(i.body||"")),y=r(i.conclusion_html||n(i.conclusion||""));return`<div style="width:1080px;height:1350px;background:#060606;display:flex;flex-direction:column;padding:54px 76px 80px;position:relative;overflow:hidden;">
        <div style="${x(e)}position:absolute;top:-20px;right:40px;font-size:480px;color:#111;line-height:1;user-select:none;pointer-events:none;letter-spacing:-.02em;">${n(i.section_number||"")}</div>
        <div style="display:flex;align-items:center;gap:22px;font-size:0;padding-bottom:40px;position:relative;">
          <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${n(s)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${n(a)}</span>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;position:relative;">
          <div style="${t(e)}font-size:18px;letter-spacing:.22em;color:#2e2e2e;text-transform:uppercase;margin-bottom:24px;">Seção ${n(i.section_number||"")}</div>
          <div style="${x(e)}font-size:${v(e,72)}px;line-height:${h(e)};font-weight:400;color:#e8e8e8;margin-bottom:40px;">${n(i.section_title)}</div>
          <div style="${d(e)}font-size:${p(e,36)}px;color:#505050;line-height:${g(e)};margin-bottom:48px;">${f}</div>
          <div style="margin-bottom:0;">${l}</div>
          <div style="margin-top:auto;padding-top:32px;">
            <div style="${x(e)}font-size:${p(e,36)}px;color:#2e2e2e;line-height:${g(e)};font-style:italic;">${y}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:36px;">
          <span style="${t(e)}font-size:22px;color:#1e1e1e;">${n(c)} ${n(m)}</span>
          <span style="${t(e)}font-size:18px;letter-spacing:.14em;color:#1a1a1a;text-transform:uppercase;">${n(m)}</span>
        </div>
      </div>`},c(i,o,e){const l=(i.list_items||[]).map(b=>`<div style="display:flex;gap:28px;margin-bottom:22px;align-items:baseline;">
          <span style="${d(e)}color:#555;font-size:${p(e,36)}px;flex-shrink:0;">·</span>
          <span style="${d(e)}font-size:${p(e,36)}px;color:#666;line-height:${g(e)};">${n(b)}</span>
         </div>`).join(""),s=(e==null?void 0:e.nav_left)||"CATEGORIA",a=(e==null?void 0:e.nav_right)||"SÉRIE",c=(e==null?void 0:e.brand_symbol)||"⬥",m=(e==null?void 0:e.brand_name)||"Marca",f=r(i.body_html||n(i.body||"")),y=r(i.conclusion_html||n(i.conclusion||""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:48px;">
          <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${n(s)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${n(a)}</span>
        </div>
        <div style="display:flex;gap:52px;align-items:flex-start;margin-bottom:52px;border-top:1px solid #1a1a1a;padding-top:36px;">
          <div style="flex:0 0 160px;">
            <div style="${t(e)}font-size:14px;letter-spacing:.18em;color:#2a2a2a;text-transform:uppercase;margin-bottom:8px;">Seção</div>
            <div style="${x(e)}font-size:120px;color:#161616;line-height:1;letter-spacing:-.02em;">${n(i.section_number||"")}</div>
          </div>
          <div style="flex:1;padding-top:8px;">
            <div style="${x(e)}font-size:${v(e,62)}px;line-height:${h(e)};font-weight:400;color:#fff;">${n(i.section_title)}</div>
          </div>
        </div>
        <div style="${d(e)}font-size:${p(e,36)}px;color:#666;line-height:${g(e)};margin-bottom:32px;">${f}</div>
        <div style="margin-bottom:24px;">${l}</div>
        <div style="${d(e)}font-size:${p(e,36)}px;color:#3a3a3a;line-height:${g(e)};margin-bottom:auto;">${y}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:36px;">
          <span style="${t(e)}font-size:22px;color:#252525;">${n(c)} ${n(m)}</span>
          <span style="${t(e)}font-size:22px;letter-spacing:.14em;color:#252525;text-transform:uppercase;">${n(m)}</span>
        </div>
      </div>`}},steps:{a(i,o,e){const l=(i.steps||[]).map(a=>`<div style="margin-bottom:24px;">
          <span style="${d(e)}font-size:${p(e,36)}px;font-weight:500;color:#fff;">${n(a.label)}:</span>
          <span style="${d(e)}font-size:${p(e,36)}px;color:#666;"> ${r(a.text_html||n(a.text||""))}</span>
         </div>`).join(""),s=r(i.call_to_action_html||(i.call_to_action?n(i.call_to_action)+(i.call_to_action_italic?" <em>"+n(i.call_to_action_italic)+"</em>":""):""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 60px;">
        ${_(e)}
        ${i.section_title?`<div style="${x(e)}font-size:${v(e,48)}px;font-weight:400;color:#fff;margin-bottom:36px;">${n(i.section_title)}</div>`:""}
        <div style="flex:1;">${l}</div>
        <div style="${x(e)}font-size:${v(e,62)}px;font-weight:400;color:#fff;line-height:${h(e)};margin-bottom:auto;">
          ${s}
        </div>
        ${u(e)}
      </div>`},b(i,o,e){const l=(i.steps||[]).map(y=>{var b;return`<div style="display:flex;align-items:baseline;gap:36px;margin-bottom:32px;">
          <span style="${x(e)}font-size:100px;color:#161616;line-height:1;flex-shrink:0;width:100px;">${n(((b=y.label.match(/\d+/))==null?void 0:b[0])||"")}</span>
          <div style="flex:1;">
            <div style="${t(e)}font-size:22px;font-weight:500;color:#aaa;letter-spacing:.06em;margin-bottom:6px;">${n(y.label.replace(/^\d+[:,.]?\s*/,""))}</div>
            <div style="${d(e)}font-size:${p(e,32)}px;color:#444;line-height:${g(e)};">${r(y.text_html||n(y.text||""))}</div>
          </div>
        </div>`}).join(""),s=(e==null?void 0:e.nav_left)||"CATEGORIA",a=(e==null?void 0:e.nav_right)||"SÉRIE",c=(e==null?void 0:e.brand_symbol)||"⬥",m=(e==null?void 0:e.brand_name)||"Marca",f=r(i.call_to_action_html||(i.call_to_action?n(i.call_to_action)+(i.call_to_action_italic?" <em>"+n(i.call_to_action_italic)+"</em>":""):""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:48px;">
          <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${n(s)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${n(a)}</span>
        </div>
        ${i.section_title?`<div style="${t(e)}font-size:18px;letter-spacing:.2em;color:#2a2a2a;text-transform:uppercase;margin-bottom:48px;">${n(i.section_title)}</div>`:""}
        <div style="flex:1;">${l}</div>
        <div style="${x(e)}font-size:${v(e,62)}px;font-weight:400;color:#fff;line-height:${h(e)};margin-bottom:auto;padding-top:24px;">
          ${f}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:36px;">
          <span style="${t(e)}font-size:22px;color:#252525;">${n(c)} ${n(m)}</span>
          <span style="${t(e)}font-size:22px;letter-spacing:.14em;color:#252525;text-transform:uppercase;">${n(m)}</span>
        </div>
      </div>`},c(i,o,e){const l=i.steps||[],s=(e==null?void 0:e.nav_left)||"CATEGORIA",a=(e==null?void 0:e.nav_right)||"SÉRIE",c=l.slice(0,4).map(f=>{let y='<div style="width:48px;height:48px;border-radius:50%;border:1px solid #1e1e1e;margin-bottom:20px;"></div>';return f.icon&&(f.icon.type==="lucide"&&f.icon.svg?y=`<div style="margin-bottom:20px;">${f.icon.svg}</div>`:f.icon.type==="upload"&&f.icon.src&&(y=`<img src="${n(f.icon.src)}" style="width:48px;height:48px;object-fit:contain;margin-bottom:20px;">`)),`<div style="background:#0d0d0d;border-radius:12px;padding:40px 36px;display:flex;flex-direction:column;">
          ${y}
          <div style="${t(e)}font-size:20px;color:#888;font-weight:500;letter-spacing:.04em;margin-bottom:12px;">${n(f.label.replace(/^\d+[:,.]?\s*/,""))}</div>
          <div style="${d(e)}font-size:${p(e,30)}px;color:#3a3a3a;line-height:${g(e)};">${r(f.text_html||n(f.text||""))}</div>
        </div>`}).join(""),m=r(i.call_to_action_html||(i.call_to_action?n(i.call_to_action)+(i.call_to_action_italic?" <em>"+n(i.call_to_action_italic)+"</em>":""):""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="display:flex;align-items:center;gap:22px;margin-bottom:48px;">
          <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${n(s)}</span>
          <div style="flex:1;height:1px;background:#1e1e1e;"></div>
          <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:#282828;text-transform:uppercase;">${n(a)}</span>
        </div>
        <div style="${x(e)}font-size:${v(e,52)}px;font-weight:400;color:#fff;line-height:${h(e)};margin-bottom:40px;">${n(i.section_title||"")}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;flex:1;">${c}</div>
        <div style="${x(e)}font-size:${v(e,48)}px;font-weight:400;color:#fff;line-height:${h(e)};padding-top:32px;">
          ${m}
        </div>
      </div>`}},overlay:{a(i,o,e){const l=o?`<img src="${o}" style="width:100%;height:100%;object-fit:cover;${$(i)}">`:'<div style="width:100%;height:100%;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=r(i.headline_html||n(i.headline||"")),a=r(i.body_html||n(i.body||""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;position:relative;">
        <div style="height:680px;overflow:hidden;flex-shrink:0;">
          ${l}
        </div>
        <div style="position:absolute;left:0;right:0;top:296px;height:400px;background:linear-gradient(to bottom,transparent 0%,rgba(0,0,0,.5) 45%,rgba(0,0,0,.85) 72%,#000 100%);pointer-events:none;z-index:1;"></div>
        <div style="flex:1;padding:32px 62px 60px;display:flex;flex-direction:column;position:relative;z-index:2;">
          <div style="${t(e)}display:flex;align-items:center;gap:22px;font-size:22px;letter-spacing:.18em;color:#303030;text-transform:uppercase;margin-bottom:36px;">
            <span>${n(i.section_number)}</span>
            <div style="flex:1;height:1px;background:#1e1e1e;"></div>
            <span>${n((e==null?void 0:e.nav_right)||"SÉRIE")}</span>
          </div>
          <div style="${t(e)}font-size:22px;letter-spacing:.18em;color:#333;text-transform:uppercase;margin-bottom:12px;">${n((e==null?void 0:e.nav_left)||"CATEGORIA")}</div>
          <div style="${x(e)}font-size:${v(e,62)}px;font-weight:400;color:#fff;line-height:${h(e)};margin-bottom:24px;">${n(i.section_title)}</div>
          ${s?`<div style="${x(e)}font-size:${v(e,42)}px;font-weight:400;font-style:italic;color:#aaa;line-height:${h(e)};margin-bottom:40px;">${s}</div>`:""}
          <div style="${d(e)}font-size:${p(e,32)}px;color:#666;line-height:${g(e)};margin-bottom:auto;">${a}</div>
          ${u(e)}
        </div>
      </div>`},b(i,o,e){const l=o?`<img src="${o}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;${$(i)}">`:'<div style="position:absolute;inset:0;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',s=(e==null?void 0:e.brand_symbol)||"⬥",a=(e==null?void 0:e.brand_name)||"Marca",c=(e==null?void 0:e.nav_left)||"CATEGORIA",m=(e==null?void 0:e.nav_right)||"SÉRIE",f=r(i.headline_html||(i.headline?n(i.headline)+(i.headline_italic?" <em>"+n(i.headline_italic)+"</em>":""):"")),y=r(i.body_html||n(i.body||""));return`<div style="width:1080px;height:1350px;background:#000;position:relative;overflow:hidden;">
        ${l}
        <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.97) 0%,rgba(0,0,0,.75) 40%,rgba(0,0,0,.2) 70%,transparent 100%);"></div>
        <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:54px 76px 80px;">
          <div style="display:flex;align-items:center;gap:22px;">
            <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:rgba(255,255,255,.18);text-transform:uppercase;">${n(c)}</span>
            <div style="flex:1;height:1px;background:rgba(255,255,255,.06);"></div>
            <span style="${t(e)}font-size:18px;letter-spacing:.18em;color:rgba(255,255,255,.18);text-transform:uppercase;">${n(m)}</span>
          </div>
          <div style="flex:1;"></div>
          <div style="${t(e)}font-size:18px;letter-spacing:.18em;color:#3a3a3a;text-transform:uppercase;margin-bottom:20px;">${n(i.section_number)} — ${n(i.section_title)}</div>
          <div style="${x(e)}font-size:${v(e,72)}px;line-height:${h(e)};font-weight:400;color:#fff;margin-bottom:28px;">
            ${f}
          </div>
          <div style="${d(e)}font-size:${p(e,36)}px;color:#666;line-height:${g(e)};margin-bottom:36px;">${y}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="${t(e)}font-size:22px;color:#1e1e1e;">${n(s)} ${n(a)}</span>
            <span style="${t(e)}font-size:22px;letter-spacing:.14em;color:#1a1a1a;text-transform:uppercase;">${n(a)}</span>
          </div>
        </div>
      </div>`},c(i,o,e){const l=i.bg_blur_disabled?"":o?`<img src="${o}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:blur(18px);opacity:0.22;transform:scale(1.06);transform-origin:center;">`:'<div style="position:absolute;inset:0;background:linear-gradient(160deg,#1a2228,#0d1418);"></div>',s=o?`<img src="${o}" style="width:100%;height:100%;object-fit:cover;${$(i)}">`:'<div style="width:100%;height:100%;background:linear-gradient(160deg,#2a3540,#1a2228);"></div>',a=r(i.headline_html||n(i.headline||"")),c=r(i.body_html||n(i.body||""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;padding:14px 14px 0;position:relative;">
        <div style="position:absolute;inset:0;overflow:hidden;">
          ${l}
        </div>
        <div style="height:680px;border-radius:18px;overflow:hidden;flex-shrink:0;position:relative;z-index:1;">
          ${s}
        </div>
        <div style="flex:1;padding:32px 62px 60px;display:flex;flex-direction:column;position:relative;z-index:2;">
          <div style="${t(e)}display:flex;align-items:center;gap:22px;font-size:22px;letter-spacing:.18em;color:#303030;text-transform:uppercase;margin-bottom:36px;">
            <span>${n(i.section_number)}</span>
            <div style="flex:1;height:1px;background:#1e1e1e;"></div>
            <span>${n((e==null?void 0:e.nav_right)||"SÉRIE")}</span>
          </div>
          <div style="${t(e)}font-size:22px;letter-spacing:.18em;color:#444;text-transform:uppercase;margin-bottom:12px;">${n((e==null?void 0:e.nav_left)||"CATEGORIA")}</div>
          <div style="${x(e)}font-size:${v(e,62)}px;font-weight:400;color:#fff;line-height:${h(e)};margin-bottom:24px;">${n(i.section_title)}</div>
          ${a?`<div style="${x(e)}font-size:${v(e,42)}px;font-weight:400;font-style:italic;color:#aaa;line-height:${h(e)};margin-bottom:40px;">${a}</div>`:""}
          <div style="${d(e)}font-size:${p(e,32)}px;color:#666;line-height:${g(e)};margin-bottom:auto;">${c}</div>
          ${u(e)}
        </div>
      </div>`}},cta:{a(i,o,e){const l=(e==null?void 0:e.brand_symbol)||"⬥",s=(e==null?void 0:e.brand_name)||"Marca",a=r(i.headline_html||(i.headline?n(i.headline)+(i.headline_italic?" <em>"+n(i.headline_italic)+"</em>":""):"")),c=r(i.body_html||n(i.body||""));return`<div style="width:1080px;height:1350px;background:#000;border:1px solid #161616;display:flex;flex-direction:column;padding:54px 76px 80px;">
        <div style="${t(e)}font-size:22px;color:#fff;margin-bottom:auto;">${n(l)} ${n(s)}</div>
        <div style="${x(e)}font-size:${v(e,84)}px;line-height:${h(e)};font-weight:400;font-style:italic;color:#fff;margin-bottom:40px;">
          ${a}
        </div>
        <div style="${d(e)}font-size:${p(e,36)}px;color:#444;line-height:${g(e)};margin-bottom:60px;">${c}</div>
        <div style="${d(e)}font-size:${p(e,36)}px;color:#fff;line-height:${g(e)};">
          ${n(i.cta_text)}
          <span style="text-decoration:underline;text-underline-offset:4px;">${n(i.cta_word)}</span>
          ${n(i.cta_suffix)}
        </div>
      </div>`},c(i,o,e){const l=(e==null?void 0:e.brand_symbol)||"⬥",s=(e==null?void 0:e.brand_name)||"Marca",a=r(i.headline_html||(i.headline?n(i.headline)+(i.headline_italic?" <em>"+n(i.headline_italic)+"</em>":""):"")),c=r(i.body_html||n(i.body||""));return`<div style="width:1080px;height:1350px;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 96px;text-align:center;">
        <div style="${t(e)}font-size:22px;color:#252525;letter-spacing:.18em;margin-bottom:60px;">${n(l)} ${n(s)}</div>
        <div style="${x(e)}font-size:${v(e,84)}px;line-height:${h(e)};font-weight:400;color:#fff;margin-bottom:36px;">
          ${a}
        </div>
        <div style="width:80px;height:1px;background:#1c1c1c;margin-bottom:36px;"></div>
        <div style="${d(e)}font-size:${p(e,36)}px;color:#3a3a3a;line-height:${g(e)};margin-bottom:60px;">${c}</div>
        <div style="border:1px solid #2a2a2a;border-radius:9999px;padding:24px 60px;display:inline-block;">
          <div style="${d(e)}font-size:${p(e,30)}px;color:#555;letter-spacing:.04em;line-height:${g(e)};">
            ${n(i.cta_text)} <span style="color:#fff;font-weight:500;">${n(i.cta_word)}</span> ${n(i.cta_suffix)}
          </div>
        </div>
      </div>`}}};export{k as LAYOUT_NAMES,z as RENDERERS,w as getRenderer};
