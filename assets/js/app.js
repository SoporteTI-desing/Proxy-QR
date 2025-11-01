
(function(){
  const IMAGES = window.__IMAGES__ || {};
  const lightbox = document.getElementById('lightbox');
  const imgEl = document.getElementById('lightbox-image');
  const currentEl = document.getElementById('current');
  const totalEl = document.getElementById('total');
  const btnPrev = document.getElementById('prev');
  const btnNext = document.getElementById('next');

  let list = [];
  let idx = 0;
  let scale = 1;
  let origin = {x:0,y:0}; // pan
  let lastPos = {x:0,y:0};
  let panning = false;

  function setImage(i){
    if(!list.length) return;
    idx = (i + list.length) % list.length;
    const src = list[idx];
    imgEl.src = src;
    currentEl.textContent = (idx+1);
    totalEl.textContent = list.length;
    resetZoom();
    // Preload neighbors
    [idx-1, idx+1].forEach(j=>{
      const k=(j+list.length)%list.length;
      const pre = new Image();
      pre.src = list[k];
    });
  }
  function openGallery(name){
    list = (IMAGES[name]||[]).map(p=>p);
    if(!list.length) return;
    lightbox.setAttribute('aria-hidden','false'); document.body.classList.add('is-open');
    document.body.style.overflow='hidden';
    document.body.classList.add('gallery-open');
    setImage(0);
  }
  function close(){
    lightbox.setAttribute('aria-hidden','true'); document.body.classList.remove('is-open');
    document.body.style.overflow='';
    document.body.classList.remove('gallery-open');
  }

  function resetZoom(){
    scale = 1;
    origin = {x:0,y:0};
    applyTransform();
  }
  function applyTransform(){
    imgEl.style.transform = `translate(${origin.x}px, ${origin.y}px) scale(${scale})`;
    imgEl.style.transition = 'transform .05s linear';
  }
  function zoomAt(delta, cx, cy){
    const prev = scale;
    scale = Math.min(4, Math.max(1, scale + delta));
    // Adjust origin so that zoom focuses around pointer (cx,cy) relative to image center
    const rect = imgEl.getBoundingClientRect();
    const ix = cx - (rect.left + rect.width/2);
    const iy = cy - (rect.top + rect.height/2);
    origin.x -= ix * (scale - prev) / scale;
    origin.y -= iy * (scale - prev) / scale;
    applyTransform();
  }

  // Buttons
  document.querySelectorAll('[data-sede]').forEach(btn=>{
    btn.addEventListener('click', ()=> openGallery(btn.dataset.sede));
  });
  document.querySelectorAll('[data-close]').forEach(el=>{
    el.addEventListener('click', close);
  });
  btnPrev.addEventListener('click', ()=> setImage(idx-1));
  btnNext.addEventListener('click', ()=> setImage(idx+1));
  document.addEventListener('keydown', (e)=>{
    if(lightbox.getAttribute('aria-hidden')==='true') return;
    if(e.key==='Escape') close();
    else if(e.key==='ArrowLeft') setImage(idx-1);
    else if(e.key==='ArrowRight') setImage(idx+1);
  });

  // Zoom and pan
  const stage = document.getElementById('stage');
  stage.addEventListener('dblclick', (e)=>{
    if(scale===1){ zoomAt(1.2, e.clientX, e.clientY); }
    else { resetZoom(); }
  });
  stage.addEventListener('wheel', (e)=>{
    e.preventDefault();
    const delta = (e.deltaY<0? 0.2 : -0.2);
    zoomAt(delta, e.clientX, e.clientY);
  }, {passive:false});

  stage.addEventListener('pointerdown', (e)=>{
    panning = true; lastPos={x:e.clientX,y:e.clientY};
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e)=>{
    if(!panning || scale===1) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    origin.x += dx; origin.y += dy;
    lastPos={x:e.clientX,y:e.clientY};
    applyTransform();
  });
  stage.addEventListener('pointerup', ()=>{ panning=false; });
  stage.addEventListener('pointercancel', ()=>{ panning=false; });

})();
