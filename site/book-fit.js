(() => {
  const reader=document.querySelector('#reader');
  const area=reader.querySelector('.book-area');
  const identity=reader.querySelector('.identity');
  let frame;
  function fit(){
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      const style=getComputedStyle(reader),areaStyle=getComputedStyle(area);
      const availableHeight=reader.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom);
      const hasIdentity=getComputedStyle(identity).display!=='none';
      const availableWidth=reader.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)
        -(hasIdentity?identity.getBoundingClientRect().width+parseFloat(style.columnGap):0);
      const controls=area.querySelector('.reading-controls').getBoundingClientRect().height;
      const extra=controls+parseFloat(areaStyle.rowGap);
      const open=reader.classList.contains('open');
      const mobile=matchMedia('(max-width:650px)').matches;
      const ratio=open?(mobile?.68:1.5):.76;
      const width=Math.max(0,Math.min(availableWidth,Math.max(0,availableHeight-extra)*ratio));
      area.style.width=`${width}px`;
      area.style.height=`${width/ratio+extra}px`;
    });
  }
  new ResizeObserver(fit).observe(reader);
  new MutationObserver(fit).observe(reader,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',fit);
  fit();
})();
