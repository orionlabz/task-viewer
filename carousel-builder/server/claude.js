import { spawn } from 'node:child_process';

const SYSTEM_PROMPT = `Você é estrategista de conteúdo especializado em Instagram editorial.
Crie carrosséis no estilo dark-luxury: direto, inteligente, provocativo mas refinado.
Tom editorial, em português brasileiro.
RESPONDA APENAS COM JSON VÁLIDO. Sem markdown, sem backticks, sem texto extra.`;

export function callClaude(userPrompt) {
  return new Promise((resolve, reject) => {
    const proc = spawn('claude', [
      '-p', '--output-format', 'json',
      '--system-prompt', SYSTEM_PROMPT,
      '--tools', '', '--no-session-persistence',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '', stderr = '';
    proc.stdout.on('data', chunk => (stdout += chunk));
    proc.stderr.on('data', chunk => (stderr += chunk));
    proc.stdin.write(userPrompt);
    proc.stdin.end();

    proc.on('close', code => {
      if (code !== 0) return reject(new Error(stderr || `claude exited with code ${code}`));
      try {
        const parsed = JSON.parse(stdout);
        let text = parsed.result ?? parsed.text ?? stdout;
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
        resolve(JSON.parse(text));
      } catch {
        reject(new Error(`Claude returned non-JSON: ${stdout.slice(0, 300)}`));
      }
    });
  });
}

export async function generateCarousel({ topic, audience, slideCount = 8, cta }) {
  const userPrompt = `Crie um carrossel de Instagram com ${slideCount} slides sobre: "${topic}".
Audiência: ${audience || 'geral'}.
CTA final: ${cta || 'Siga para mais conteúdo'}.

Regras obrigatórias:
- Primeiro slide: template "cover"
- Último slide: template "cta"
- Não repetir o mesmo template em sequência (exceto "dark")
- Variar entre: dark, steps, overlay, split

Templates e campos por tipo (use HTML inline para ênfase: <em> para itálico, <strong> para negrito):
- cover:   { template, layout, headline_html, body_html }
- split:   { template, layout, headline_html, body_html }
- dark:    { template, layout, section_number, section_title, body_html, list_items (array max 4), conclusion_html }
- steps:   { template, layout, section_title, steps (array {label,text_html} max 4), call_to_action_html }
- overlay: { template, layout, section_number, section_title, headline_html, body_html }
- cta:     { template, layout, headline_html, body_html, cta_text, cta_word, cta_suffix }

Retorne SOMENTE o JSON: { "slides": [...] }
Cada slide DEVE incluir "layout": "a".`;

  return callClaude(userPrompt);
}

export async function refineSlide({ slide, instruction }) {
  const userPrompt = `Refine este slide mantendo template "${slide.template}" e estrutura dos campos.
Instrução: "${instruction}"

Slide atual:
${JSON.stringify(slide, null, 2)}

Retorne SOMENTE o JSON do slide atualizado. Preserve os campos "layout" e "template" exatamente.
Use HTML inline para ênfase onde necessário (<em>, <strong>).`;

  return callClaude(userPrompt);
}

export async function brainstormIdeas({ niche, platform = 'Instagram', count = 5 }) {
  const userPrompt = `Sugira ${count} temas de alto engajamento para carrosséis de ${platform} no nicho: "${niche}".
Para cada tema: título provocativo, ângulo editorial único, e por que engaja.
Retorne SOMENTE o JSON: { "ideas": [{ "title": "...", "angle": "...", "why": "..." }] }`;

  return callClaude(userPrompt);
}
