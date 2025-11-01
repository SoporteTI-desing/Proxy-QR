
// Simple IA chat client for Sanaré
// Modo 1: FAQ local (sin Internet)
// Modo 2: OpenAI (si el usuario pega su API key en localStorage bajo 'openai_key')

(function(){
  const $ = (sel) => document.querySelector(sel);
  const btn = $('#sanare-ai-button');
  const panel = $('#sanare-ai-panel');
  const closeBtn = $('#sanare-ai-close');
  const form = $('#sanare-ai-form');
  const input = $('#sanare-ai-input');
  const messages = $('#sanare-ai-messages');
  const settingsBtn = $('#sanare-ai-settings');

  function openPanel(){ panel.style.display = 'block'; setTimeout(()=>input?.focus(), 50); }
  function closePanel(){ panel.style.display = 'none'; }

  btn?.addEventListener('click', openPanel);
  closeBtn?.addEventListener('click', closePanel);

  settingsBtn?.addEventListener('click', () => {
    const current = localStorage.getItem('openai_key') || '';
    const next = prompt('Pega tu OpenAI API key (se guarda localmente en este navegador):', current);
    if (next !== null) {
      if (next.trim() === '') localStorage.removeItem('openai_key');
      else localStorage.setItem('openai_key', next.trim());
      alert(next.trim() ? 'API key guardada.' : 'API key eliminada.');
    }
  });

  function appendBubble(text, role='assistant'){
    const wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.gap = '10px';
    wrap.style.alignItems = 'flex-start';
    wrap.style.margin = '6px 0';

    const avatar = document.createElement('div');
    avatar.style.width = '28px';
    avatar.style.height = '28px';
    avatar.style.borderRadius = '8px';
    avatar.style.flex = '0 0 28px';
    if (role === 'assistant') avatar.style.background = '#0A497B';
    else avatar.style.background = 'linear-gradient(135deg,#ffb3a6,#ffd2c9)';

    const bubble = document.createElement('div');
    bubble.style.maxWidth = '80%';
    bubble.style.padding = '10px 12px';
    bubble.style.borderRadius = '12px';
    bubble.style.fontSize = '14px';
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.style.wordBreak = 'break-word';
    if (role === 'assistant'){
      bubble.style.background = '#F6F9FC';
      bubble.style.border = '1px solid rgba(10,73,123,.12)';
      bubble.style.color = '#0A497B';
    } else {
      bubble.style.background = '#fff3ef';
      bubble.style.border = '1px solid rgba(255,140,105,.25)';
      bubble.style.color = '#663e34';
    }
    bubble.textContent = text;

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  // Respuestas locales rápidas
  const faq = [
    { q: /horarios|abren|cierran|hora/i, a: "Nuestros centros operan de Lunes a Viernes 7:00–20:00 y Sábados 8:00–14:00. Te ayudamos a agendar según disponibilidad." },
    { q: /ubicaci(ó|o)n|donde|direcci(ó|o)n|sede/i, a: "Contamos con varias sedes. Usa los botones del carrusel para ver fotos y ubicar la sede. Si me dices tu ciudad, te sugiero la más cercana." },
    { q: /costo|precio|cotiz/i, a: "Los costos dependen del medicamento y del tiempo de infusión. Podemos cotizarte: indícame medicamento/servicio y datos básicos." },
    { q: /preparaci(ó|o)n|ayuno|instrucciones/i, a: "La preparación depende del tratamiento. Generalmente: descanso previo, hidratación y confirmar alergias. Podemos enviarte una guía específica." },
    { q: /contacto|cita|whats|whatsapp/i, a: "Puedes escribirnos por WhatsApp con el botón en la parte superior del chat. También puedo orientarte aquí." },
    { q: /seguro|aseguradora|reembolso/i, a: "Trabajamos con esquemas de reembolso. Te orientamos con tu aseguradora y documentación necesaria." }
  ];

  async function askOpenAI(userText, history){
    const key = localStorage.getItem('openai_key');
    if (!key) return null;

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Eres un asistente de Sanaré, tono cálido y profesional. Responde en español, breve y claro, y ofrece pasos accionables. Si te piden precios, pide datos del tratamiento. No inventes direcciones: remite al carrusel de sedes.' },
            ...history,
            { role: 'user', content: userText }
          ])
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      return text || null;
    } catch (e){
      console.warn('OpenAI error:', e);
      return null;
    }
  }

  const convo = [];

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = (input.value || '').trim();
    if (!text) return;
    appendBubble(text, 'user');
    convo.push({ role: 'user', content: text });
    input.value = '';

    // Intento de coincidencia FAQ local
    const hit = faq.find(f => f.q.test(text));
    if (hit){
      appendBubble(hit.a, 'assistant');
      convo.push({ role: 'assistant', content: hit.a });
      return;
    }

    // Intento OpenAI (si hay API key)
    appendBubble('Pensando…', 'assistant');
    const thinking = messages.lastElementChild;
    const aiText = await askOpenAI(text, convo);

    if (aiText){
      thinking.querySelector('div:nth-child(2)').textContent = aiText;
      convo.push({ role: 'assistant', content: aiText });
    } else {
      thinking.remove();
      const fallback = "Por ahora puedo darte una orientación básica. Si deseas una respuesta más detallada, pulsa ⚙️ y pega tu OpenAI API key, o contáctanos por WhatsApp.";
      appendBubble(fallback, 'assistant');
      convo.push({ role: 'assistant', content: fallback });
    }
  });

})();
