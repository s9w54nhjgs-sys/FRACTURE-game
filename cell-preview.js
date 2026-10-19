import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const panel=document.getElementById('frPanel');if(panel){
const wrap=document.createElement('section');wrap.className='frCard';wrap.innerHTML='<h2>LEGACY CELL / 3D外装プレビュー</h2><select id="frPreviewSelect" style="width:100%;padding:10px;background:#102736;color:#e9ffff"></select><div id="frPreviewViewport" style="height:290px;width:100%;overflow:hidden;border-radius:12px;background:#07111b"></div><p id="frPreviewInfo" class="frMuted">合成済みCELLを選ぶと形状を確認できます。</p>';panel.insertBefore(wrap,document.getElementById('frNotice'));
const viewport=wrap.querySelector('#frPreviewViewport'),select=wrap.querySelector('select'),info=wrap.querySelector('#frPreviewInfo');const scene=new THREE.Scene();scene.background=new THREE.Color(0x07111b);const camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.set(0,3.2,12);camera.lookAt(0,0,0);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));viewport.appendChild(renderer.domElement);scene.add(new THREE.AmbientLight(0xb7ecff,1.4));const light=new THREE.PointLight(0x9befff,65);light.position.set(3,4,5);scene.add(light);const group=new THREE.Group();scene.add(group);
function random(seed){let x=(seed||123456789)>>>0;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296}}
function show(cell){
while(group.children.length){const o=group.children[0];group.remove(o);o.traverse(v=>{v.geometry?.dispose();if(v.material&&v.material!==undefined){(Array.isArray(v.material)?v.material:[v.material]).forEach(m=>m.dispose())}})}
if(!cell)return;
const p=cell.recipe||{},sum=Math.max(1,Object.values(p).reduce((a,b)=>a+(Number(b)||0),0)),rand=random(cell.seed||42);
const power=Math.min(1,sum/1000),tier=Math.min(3,Math.floor(sum/250)),radius=.62+power*1.05;
const metal=new THREE.MeshStandardMaterial({color:p.paint?new THREE.Color().setHSL(rand(),.9,.48):0x9aaec1,metalness:.94,roughness:.16,flatShading:true});
const dark=new THREE.MeshStandardMaterial({color:0x0b1828,metalness:.8,roughness:.28,flatShading:true});
const glow=new THREE.MeshStandardMaterial({color:0x5eeeff,emissive:0x12bfe8,emissiveIntensity:2.2,metalness:.35,roughness:.2});
const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);group.add(m);return m};
const core=add(new THREE.IcosahedronGeometry(radius,1),metal,0,0,0);
const inner=add(new THREE.IcosahedronGeometry(radius*.75,0),dark,0,0,0);inner.rotation.set(.4,.3,.2);
const eye=add(new THREE.OctahedronGeometry(radius*.38,0),glow,0,0,radius*.8);
const direction=()=>{const y=rand()*2-1,a=rand()*Math.PI*2,r=Math.sqrt(1-y*y);return new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r)};
const point=(v,dist)=>v.clone().multiplyScalar(dist);
const heavy=(p.heavy||0)/sum,aerial=(p.aerial||0)/sum,swarm=(p.swarm||0)/sum,stalker=(p.stalker||0)/sum,basic=(p.basic||0)/sum;
const count=(share,max)=>Math.min(max,Math.round(share*(4+power*85)));

// 基本素材は量に応じて中心核を多層化。ストーカー主体は他素材を肋骨状の保護フレームに変換。
const baseAmount=p.basic||0,stalkerAmount=p.stalker||0;
if(baseAmount>=80){
 const layers=Math.min(4,Math.floor(baseAmount/180)+1);
 for(let i=0;i<layers;i++){
  const shell=add(new THREE.IcosahedronGeometry(radius*(.48+i*.12),i%2?1:0),i%2?metal:dark,0,0,0);
  shell.rotation.set(rand()*2,rand()*2,rand()*2);
 }
 const heart=add(new THREE.OctahedronGeometry(radius*(.22+Math.min(.3,baseAmount/1500)),1),glow,0,0,0);
 heart.rotation.set(rand(),rand(),rand());
}
if(stalkerAmount>=90&&stalkerAmount>=Math.max(p.heavy||0,p.aerial||0,p.swarm||0)){
 const ribs=Math.min(18,Math.max(5,Math.floor(stalkerAmount/55)+Math.floor((p.heavy||0)/130)));
 const ribLength=radius*(1.6+power*.9);
 const ribMaterial=(p.heavy||0)>80?metal:dark;
 for(let i=0;i<ribs;i++){
  const a=i*Math.PI*2/ribs+(rand()-.5)*.18;
  const side=i%2===0?1:-1;
  const pts=[];
  for(let j=0;j<=12;j++){
   const t=j/12,curve=Math.sin(t*Math.PI);
   const r=radius*(.55+curve*(.7+power*.65));
   pts.push(new THREE.Vector3(Math.cos(a)*r, (t-.5)*ribLength*side,Math.sin(a)*r));
  }
  const bone=add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),22,.055+power*.07,6,false),i%4===0?glow:ribMaterial,0,0,0);
  const tip=pts[pts.length-1],point=add(new THREE.ConeGeometry(.08+power*.08,.25+power*.38,4),i%3===0?glow:metal,tip.x,tip.y,tip.z);
  point.rotation.z=side>0?Math.PI:0;
 }
 // 中心核を守る複数の肋骨を、投入した他素材に応じて装飾
 const accents=Math.min(20,Math.floor(((p.aerial||0)+(p.swarm||0)+(p.heavy||0))/40));
 for(let i=0;i<accents;i++){
  const a=rand()*Math.PI*2,y=(rand()-.5)*ribLength*.8,r=radius*(1.1+rand()*.4);
  const ornament=add(new THREE.OctahedronGeometry(.1+power*.11,0),(p.aerial||0)>(p.heavy||0)?glow:metal,Math.cos(a)*r,y,Math.sin(a)*r);
  ornament.rotation.set(rand()*3,rand()*3,rand()*3);
 }
}
for(let i=0;i<count(heavy,62);i++){const d=direction(),size=(.18+rand()*.33)*(1+power*2.1),pos=point(d,radius*(.8+rand()*.6));const armor=add(new THREE.BoxGeometry(size,size*(.5+rand()),size*(.6+rand())),i%5===0?dark:metal,pos.x,pos.y,pos.z);armor.lookAt(pos.clone().multiplyScalar(2));armor.rotateZ(rand()*Math.PI)}
for(let i=0;i<count(aerial,72);i++){const d=direction(),len=(.25+rand()*.75)*(1+power*3.7),pos=point(d,radius*.93);const spike=add(new THREE.ConeGeometry((.09+power*.14)*(1+rand()),len,4),i%4===0?glow:metal,pos.x+d.x*len*.4,pos.y+d.y*len*.4,pos.z+d.z*len*.4);spike.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d)}
for(let i=0;i<count(swarm,105);i++){const d=direction(),dist=radius*(1.2+rand()*(.3+power*1.6));const pos=point(d,dist);add(new THREE.IcosahedronGeometry(.035+rand()*.09+power*.025,0),i%3===0?glow:metal,pos.x,pos.y,pos.z)}
for(let i=0;i<count(stalker,27);i++){const d=direction(),len=.6+rand()*(1+power*4.5),pts=[];for(let j=0;j<=9;j++){const t=j/9;pts.push(new THREE.Vector3(d.x*(radius+len*t)+Math.sin(t*8+i)*t*.45,d.y*(radius+len*t)+Math.cos(t*7+i)*t*.45,d.z*(radius+len*t)+Math.sin(t*9+i)*t*.45))}const tube=add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),18,.035+power*.09,6,false),i%3===0?glow:dark,0,0,0)}
for(let i=0;i<Math.round(basic*(3+power*22));i++){const d=direction(),pos=point(d,radius*1.04);const plate=add(new THREE.OctahedronGeometry(.12+power*.24,0),i%4===0?glow:metal,pos.x,pos.y,pos.z);plate.scale.set(1,.3+rand(),1.1+rand()*1.7)}
if(power>.18){for(let i=0;i<1+tier;i++){const ring=add(new THREE.TorusGeometry(radius*(1.23+i*.21),.025+power*.025,5,64),i%2?glow:metal,0,0,0);ring.rotation.set(rand()*Math.PI,rand()*Math.PI,rand()*Math.PI)}}
if(p.aura){for(let i=0;i<1+Math.min(3,Math.ceil(p.aura/30));i++){const halo=add(new THREE.TorusGeometry(radius*(1.5+i*.3),.015+power*.04,4,64),glow,0,0,0);halo.rotation.set(rand()*3,rand()*3,rand()*3)}}
if(power>.55){for(let i=0;i<3+tier*2;i++){const d=direction(),pos=point(d,radius*(1.45+rand()*.5));const satellite=add(new THREE.OctahedronGeometry(.12+power*.13,0),glow,pos.x,pos.y,pos.z);satellite.rotation.set(rand()*3,rand()*3,rand()*3)}}
group.userData.power=power;
info.textContent=cell.name+' / '+sum+'素材 / 形態段階 '+(tier+1)+' / 外装半径 '+radius.toFixed(2)+' / '+Object.entries(p).filter(([,v])=>v>0).map(([k,v])=>k+':'+v).join('・');
}
function refresh(){const d=JSON.parse(localStorage.getItem('fracture_rebirth_v1')||'{}');const items=(d.cells||[]).filter(c=>c.recipe);const old=select.value;select.replaceChildren();items.forEach((c,i)=>{const o=document.createElement('option');o.value=i;o.textContent=c.name;select.appendChild(o)});if(!items.length){info.textContent='外装CELLを合成すると3Dプレビューに表示されます。';show(null);return}select.value=old&&Number(old)<items.length?old:String(items.length-1);show(items[Number(select.value)])}
select.addEventListener('change',()=>{const d=JSON.parse(localStorage.getItem('fracture_rebirth_v1')||'{}');show((d.cells||[]).filter(c=>c.recipe)[Number(select.value)])});document.getElementById('frMix')?.addEventListener('click',()=>setTimeout(refresh,0));document.getElementById('frHome')?.addEventListener('click',refresh);const resize=()=>{const w=viewport.clientWidth||320;renderer.setSize(w,290);camera.aspect=w/290;camera.updateProjectionMatrix()};resize();refresh();let frame=0;function animate(){requestAnimationFrame(animate);if(wrap.getBoundingClientRect().width===0)return;if(++frame%2)return;group.rotation.y+=.009;group.rotation.x=Math.sin(frame*.006)*.15;renderer.render(scene,camera)}animate();
}