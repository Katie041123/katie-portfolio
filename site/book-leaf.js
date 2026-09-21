(() => {
  let leaf=0;
  let enterFromEnd=false;
  const mobile=matchMedia('(max-width:650px)');
  function render(){
    const pages=[...document.querySelectorAll('#surface .page')];
    pages.forEach((p,i)=>p.hidden=mobile.matches&&i!==leaf);
    const chapter=Number(document.querySelector('#surface').dataset.chapter);
    if(chapter>0&&chapter<5){
      document.querySelector('#page-position').textContent=mobile.matches
        ?'第 '+String(chapter*2-1+leaf).padStart(2,'0')+' 页'
        :`${String(chapter*2-1).padStart(2,'0')} — ${String(chapter*2).padStart(2,'0')}`;
      document.querySelector('#next-label').textContent=chapter===4&&(!mobile.matches||leaf===1)?'合上本子':'下一页';
    }
  }
  window.bookLeaf={reset(){leaf=enterFromEnd?1:0;enterFromEnd=false;render()},step(delta){
    if(!mobile.matches||!document.querySelector('#surface .page'))return false;
    if(leaf+delta<0||leaf+delta>1){enterFromEnd=delta<0;return false;}
    leaf+=delta;render();return true;
  }};
  mobile.addEventListener('change',render);
  render();
})();
