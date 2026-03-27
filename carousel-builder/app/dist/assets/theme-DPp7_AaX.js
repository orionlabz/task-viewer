function s(o){o||(o=c());const a=o.font_display||"Playfair Display",r=o.font_body||"Inter";return`<style>
@import url('${i(a,r)}');
:root {
  --t-bg: ${o.color_bg||"#000"};
  --t-text: ${o.color_text||"#e8e8e8"};
  --t-emphasis: ${o.color_emphasis||"#CCFF00"};
  --t-secondary: ${o.color_secondary||"#666"};
  --t-detail: ${o.color_detail||"#2a2a2a"};
  --t-border: ${o.color_border||"#1e1e1e"};
  --t-font-display: '${a}';
  --t-font-body: '${r}';
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--t-bg); }
em { font-style: italic; }
strong { font-weight: 700; }
.accent { color: var(--t-emphasis); }
</style>`}function i(o,a){const r=[],n=l=>l.replace(/ /g,"+");return o&&r.push(`family=${n(o)}:ital,wght@0,400;0,500;1,400;1,500`),a&&a!==o&&r.push(`family=${n(a)}:wght@300;400;500;600`),`https://fonts.googleapis.com/css2?${r.join("&")}&display=swap`}function c(){return{font_display:"Playfair Display",font_body:"Inter",color_bg:"#000000",color_text:"#e8e8e8",color_emphasis:"#CCFF00",color_secondary:"#666666",color_detail:"#2a2a2a",color_border:"#1e1e1e",brand_name:"Marca",brand_symbol:"⬥",nav_left:"CATEGORIA",nav_right:"SÉRIE"}}function d(o,a="dark"){const r=a==="light"?o==null?void 0:o.brand_logo_light:o==null?void 0:o.brand_logo_dark;return r?`<img src="${r}" style="height:22px;object-fit:contain;" alt="">`:`${t((o==null?void 0:o.brand_symbol)||"⬥")} ${t((o==null?void 0:o.brand_name)||"Marca")}`}function t(o){return String(o??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}export{d as brandLogoHTML,i as buildGoogleFontsUrl,c as defaultTheme,s as themeStyleBlock};
