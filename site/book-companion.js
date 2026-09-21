(() => {
  const poses = [
    {src:'assets/book-winter-v2.png',name:'毛绒帽趴趴'},
    {src:'assets/book-bear-v2.png',name:'黄毛衣熊耳趴趴'},
    {src:'assets/book-flower-v2.png',name:'花环眨眼趴趴'}
  ];
  const button=document.createElement('button');
  button.className='book-companion';
  button.type='button';
  button.hidden=true;
  button.title='点一下，换个姿态';
  const image=document.createElement('img');
  image.alt='';
  button.append(image);
  document.querySelector('#book').append(button);
  const ready=poses.map(p=>{const img=new Image();img.src=p.src;return img.decode().then(()=>true).catch(()=>false)});
  let selected=-1,request=0,motion;
  const gestures=[
    [{transform:'translateY(7px)'},{transform:'translateY(-2px)',offset:.65},{transform:'none'}],
    [{transform:'rotate(-4deg)'},{transform:'rotate(2deg)',offset:.6},{transform:'none'}],
    [{transform:'scale(.96) translateY(3px)'},{transform:'scale(1.02)',offset:.6},{transform:'none'}]
  ];
  async function change(animate=true){
    const ticket=++request;
    const options=poses.map((_,i)=>i).filter(i=>i!==selected);
    const next=options[Math.floor(Math.random()*options.length)];
    if(!await ready[next]||ticket!==request)return;
    selected=next;
    image.src=poses[next].src;
    button.setAttribute('aria-label',`${poses[next].name}，点击更换小人姿态`);
    motion?.cancel();
    if(animate&&!button.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
      motion=button.animate(gestures[Math.floor(Math.random()*gestures.length)],{duration:460,easing:'cubic-bezier(.22,.7,.3,1)',iterations:1});
    }
  }
  button.addEventListener('click',event=>change(event.detail!==0));
  window.bookCompanionTurn=(page,instant=false)=>{
    button.hidden=page<1||page>4;
    if(button.hidden){++request;motion?.cancel();return}
    change(!instant);
  };
  if(window.katieBook)window.bookCompanionTurn(window.katieBook.current,true);
})();
