import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
const panel=document.getElementById('frPanel');if(panel){
const wrap=document.createElement('section');wrap.className='frCard';wrap.innerHTML='<h2>LEGACY CELL / 3D外装プレビュー</h2><select id="frPreviewSelect" style="width:100%;padding:10px;background:#102736;color:#e9ffff"></select><div id="frPreviewViewport" style="height:290px;width:100%;overflow:hidden;border-radius:12px;background:#07111b"></div><p id="frPreviewInfo" class="frMuted">合成済みCELLを選ぶと形状を確認できます。</p>';panel.insertBefore(wrap,document.getElementById('frNotice'));
const viewport=wrap.querySelector('#frPreviewViewport'),select=wrap.querySelector('select'),info=wrap.querySelector('#frPreviewInfo');const scene=new THREE.Scene();scene.background=new THREE.Color(0x07111b);const camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.set(0,3.2,12);camera.lookAt(0,0,0);const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));viewport.appendChild(renderer.domElement);scene.add(new THREE.AmbientLight(0xb7ecff,1.4));const light=new THREE.PointLight(0x9befff,65);light.position.set(3,4,5);scene.add(light);const group=new THREE.Group();scene.add(group);
function random(seed){let x=(seed||123456789)>>>0;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296}}
let animatedOrbits=[];function show(cell){
animatedOrbits=[];
while(group.children.length){const o=group.children[0];group.remove(o);o.traverse(v=>{v.geometry?.dispose();if(v.material&&v.material!==undefined){(Array.isArray(v.material)?v.material:[v.material]).forEach(m=>m.dispose())}})}
if(!cell)return;
const p=cell.recipe||{},sum=Math.max(1,Object.values(p).reduce((a,b)=>a+(Number(b)||0),0)),rand=random(cell.seed||42);
const power=Math.min(1,Math.log1p(sum)/Math.log1p(50000)),tier=Math.min(3,Math.floor(sum/250)),radius=.62+power*1.05;
// Seeded anodized-metal finish. Color roll stays stable across reinforcement.
const colorSeed=((Number(cell.seed)||42)>>>0);
const colorRoll=((Math.imul(colorSeed^0x6c8e9cf5,1664525)+1013904223)>>>0)/4294967296;
const colorVariant=((Math.imul(colorSeed^0x39b7a4d1,22695477)+1)>>>0)/4294967296;
const darkAnodized=[
 ['ガンメタブラック',0x26313d],['ディープネイビー',0x172d50],['ダークパープル',0x302044],
 ['ワインレッド',0x4b172a],['フォレストグリーン',0x163d32],['スモークブロンズ',0x493323],
 ['ダークチタン',0x303943],['ミッドナイトブルー',0x12243b]
];
const vividAnodized=[
 ['クリムゾンレッド',0xf01929],['エレクトリックブルー',0x1266ff],['ビビッドグリーン',0x10ed53],
 ['ロイヤルパープル',0x922aff],['アノダイズドゴールド',0xffbb08]
];
const specialPaint=[['純白',0xf7f7f4],['漆黒',0x050607]];
const isSpecialPaint=Boolean(p.paint)&&colorRoll>=.005&&colorRoll<.01;
const isRarePaint=Boolean(p.paint)&&colorRoll<.005;
const paintPalette=isSpecialPaint?specialPaint:isRarePaint?vividAnodized:darkAnodized;
const paintChoice=paintPalette[Math.floor(colorVariant*paintPalette.length)];
const paintLabel=p.paint?(isSpecialPaint?'特別塗装 / ':isRarePaint?'希少アルマイト / ':'ダークアルマイト / ')+paintChoice[0]:'無塗装 / サテンステンレス';
const metal=new THREE.MeshStandardMaterial({color:p.paint?paintChoice[1]:0x838b8d,metalness:p.paint?.91:.83,roughness:p.paint?.23:.43,flatShading:true});
const dark=new THREE.MeshStandardMaterial({color:0x0b1828,metalness:.8,roughness:.28,flatShading:true});
const glow=new THREE.MeshStandardMaterial({color:0x5eeeff,emissive:0x12bfe8,emissiveIntensity:2.2,metalness:.35,roughness:.2});
const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);group.add(m);return m};
// Deterministic base hulls: a CELL is not necessarily spherical.
const hullTypes=['orb','spire','delta','disc','prism','fork','diamond'];
const structureSum=Math.max(1,['basic','heavy','aerial','swarm','stalker'].reduce((a,k)=>a+(Number(p[k])||0),0));
const structureRand=random((Number(cell.seed)||42)^0x5f3759df);
const weights=[.6+(p.basic||0)/structureSum,.3+(p.stalker||0)/structureSum,.25+(p.aerial||0)/sum,.2+(p.swarm||0)/sum,.3+(p.heavy||0)/sum,.2+Math.min((p.aerial||0),(p.heavy||0))/sum,.2+Math.min((p.stalker||0),(p.basic||0))/sum];
const hullRoll=structureRand()*weights.reduce((a,b)=>a+b,0);let cursor=0,hull='orb';
for(let i=0;i<hullTypes.length;i++){cursor+=weights[i];if(hullRoll<=cursor){hull=hullTypes[i];break}}
const hullGeo=()=>{
 if(hull==='spire')return new THREE.CylinderGeometry(radius*.16,radius*.35,radius*3.9,6,1);
 if(hull==='delta')return new THREE.ConeGeometry(radius*1.25,radius*2.65,3,1);
 if(hull==='disc')return new THREE.CylinderGeometry(radius*1.55,radius*1.4,radius*.26,10,1);
 if(hull==='prism')return new THREE.BoxGeometry(radius*1.1,radius*2.5,radius*.75);
 if(hull==='fork')return new THREE.CylinderGeometry(radius*.25,radius*.65,radius*2.6,5,1);
 if(hull==='diamond')return new THREE.OctahedronGeometry(radius*1.4,0);
 return new THREE.IcosahedronGeometry(radius,1);
};
const core=add(hullGeo(),metal,0,0,0);
if(hull==='delta'){core.rotation.x=Math.PI/2;for(const side of [-1,1]){const wing=add(new THREE.BoxGeometry(radius*1.7,radius*.11,radius*.65),metal,side*radius*.83,-radius*.15,radius*.1);wing.rotation.y=side*.4;const engine=add(new THREE.CylinderGeometry(radius*.13,radius*.2,radius*.7,6),glow,side*radius*.45,-radius*.12,-radius*.65);engine.rotation.x=Math.PI/2}}
if(hull==='spire'){for(let i=0;i<3;i++){const blade=add(new THREE.ConeGeometry(radius*.25,radius*1.55,3),i===1?glow:metal,Math.cos(i*Math.PI*2/3)*radius*.38,radius*.65,Math.sin(i*Math.PI*2/3)*radius*.38);blade.rotation.z=(i-1)*.16}}
if(hull==='fork'){for(const side of [-1,1]){const arm=add(new THREE.BoxGeometry(radius*.22,radius*2.5,radius*.24),metal,side*radius*.75,0,0);arm.rotation.z=-side*.22;add(new THREE.OctahedronGeometry(radius*.2,0),glow,side*radius*.9,radius*1.2,0)}}
if(hull==='disc'){const edge=add(new THREE.TorusGeometry(radius*1.45,radius*.08,5,32),glow,0,0,0);edge.rotation.x=Math.PI/2}
if(hull==='prism'){for(let i=0;i<3;i++){const fin=add(new THREE.BoxGeometry(radius*.12,radius*1.7,radius*.65),i===0?glow:dark,(i-1)*radius*.4,0,radius*.46);fin.rotation.z=(i-1)*.18}}

const inner=add(new THREE.OctahedronGeometry(radius*.38,0),dark,0,0,0);inner.rotation.set(.4,.3,.2);
const eye=add(new THREE.OctahedronGeometry(radius*.22,0),glow,0,0,radius*.8);
const direction=()=>{const y=rand()*2-1,a=rand()*Math.PI*2,r=Math.sqrt(1-y*y);return new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r)};
const point=(v,dist)=>v.clone().multiplyScalar(dist);
const heavy=(p.heavy||0)/sum,aerial=(p.aerial||0)/sum,swarm=(p.swarm||0)/sum,stalker=(p.stalker||0)/sum,basic=(p.basic||0)/sum;
const count=(share,max)=>Math.min(max,Math.round(share*(4+power*85)));


// Morphology engine: continuous material weights, with seeded individual variation.
const mix=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
const fortress=Math.min(1,heavy*1.8),predator=Math.min(1,Math.min(stalker,aerial)*3.2),nebula=Math.min(1,swarm*1.8);
const floating=Math.min(1,Math.min(heavy,swarm)*3.5),ribFactor=Math.min(1,stalker*1.8);
const chaos=Math.min(1,Math.min(heavy,aerial,swarm,stalker,basic)*7);
const morphs=[['多層核',basic],['肋骨',stalker],['要塞',heavy],['穿刺',aerial],['星雲',swarm],['捕食',predator],['浮遊要塞',floating],['異形核',chaos]];
const dominant=morphs.slice().sort((a,b)=>b[1]-a[1])[0];
const asym=(rand()-.5)*(.12+chaos*.8),shift=new THREE.Vector3(asym*radius,(rand()-.5)*chaos*radius*.6,0);
core.position.add(shift);inner.position.add(shift);eye.position.add(shift);
core.scale.set(mix(1,1.35,fortress),mix(1,1.15,ribFactor),mix(1,.85,fortress));
if(fortress>.08){
 for(let i=0;i<Math.round(3+fortress*15*power);i++){
 const d=direction(),pos=point(d,radius*(.8+rand()*.65));
 const block=add(new THREE.BoxGeometry(.3+fortress*.7,.2+fortress*.45,.35+fortress*.65),i%4===0?dark:metal,pos.x,pos.y,pos.z);
 block.rotation.set(rand()*3,rand()*3,rand()*3);
 }
}
if(predator>.08){
 for(let i=0;i<Math.round(3+predator*14*power);i++){
 const a=i*Math.PI*2/(3+Math.round(predator*14*power)),side=i%2?1:-1;
 const points=[];
 for(let j=0;j<=9;j++){const t=j/9;const rr=radius*(.8+Math.sin(t*Math.PI)*(.5+predator*.7)-predator*t*.38);
 points.push(new THREE.Vector3(Math.cos(a)*rr,side*radius*(t-.45)*2.2,Math.sin(a)*rr))}
 add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),15,.035+predator*.085,5,false),i%5===0?glow:metal,0,0,0);
 }
}
if(nebula>.06){
 for(let i=0;i<Math.round(nebula*(8+power*90));i++){
 const d=direction(),dist=radius*(1.4+rand()*(1+nebula*1.6)),pos=point(d,dist);
 const shard=add(new THREE.TetrahedronGeometry(.04+rand()*.11,0),i%3===0?glow:metal,pos.x,pos.y,pos.z);
 shard.rotation.set(rand()*3,rand()*3,rand()*3);
 }
}
if(floating>.08){
 for(let i=0;i<Math.round(2+floating*12*power);i++){
 const d=direction(),pos=point(d,radius*(1.6+rand()*.8));
 const chunk=add(new THREE.DodecahedronGeometry(.16+floating*.35*rand(),0),i%3===0?glow:metal,pos.x,pos.y,pos.z);
 chunk.rotation.set(rand()*3,rand()*3,rand()*3);
 }
}
if(chaos>.1){core.rotation.set(rand()*1.3,rand()*1.3,rand()*1.3);eye.position.x+=chaos*radius*.7}

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
// Absolute aerial quantity drives silhouette: 500 and 1300 must look distinctly different.
const aerialAmount=Math.max(0,Number(p.aerial)||0);
const aerialStage=Math.min(5,Math.floor(aerialAmount/350));
const aerialCount=Math.min(115,Math.round(5+Math.sqrt(aerialAmount)*1.5));
const aerialReach=Math.min(5.8,.5+Math.sqrt(aerialAmount)/17);
for(let i=0;i<aerialCount;i++){
 const d=direction(),major=i<Math.max(3,Math.round(aerialCount*.18));
 const len=(major?1.5:.55)*aerialReach*(.72+rand()*.55);
 const pos=point(d,radius*(.76+rand()*.23));
 const spike=add(new THREE.ConeGeometry((.075+power*.12)*(major?1.55:1)*(1+rand()*.6),len,4),i%5===0?glow:metal,pos.x+d.x*len*.44,pos.y+d.y*len*.44,pos.z+d.z*len*.44);
 spike.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);
}
if(aerialStage>=2){
 const crown=Math.min(9,2+aerialStage*2);
 for(let i=0;i<crown;i++){
 const a=i*Math.PI*2/crown+(rand()-.5)*.18,dir=new THREE.Vector3(Math.cos(a)*.28,.95,Math.sin(a)*.28).normalize();
 const len=aerialReach*(.7+aerialStage*.24);
 const spike=add(new THREE.ConeGeometry(.16+aerialStage*.055,len,5),i%3===0?glow:metal,dir.x*(radius+len*.35),dir.y*(radius+len*.35),dir.z*(radius+len*.35));
 spike.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
 }
}
for(let i=0;i<count(swarm,105);i++){const d=direction(),dist=radius*(1.2+rand()*(.3+power*1.6));const pos=point(d,dist);add(new THREE.IcosahedronGeometry(.035+rand()*.09+power*.025,0),i%3===0?glow:metal,pos.x,pos.y,pos.z)}
for(let i=0;i<count(stalker,27);i++){const d=direction(),len=.6+rand()*(1+power*4.5),pts=[];for(let j=0;j<=9;j++){const t=j/9;pts.push(new THREE.Vector3(d.x*(radius+len*t)+Math.sin(t*8+i)*t*.45,d.y*(radius+len*t)+Math.cos(t*7+i)*t*.45,d.z*(radius+len*t)+Math.sin(t*9+i)*t*.45))}const tube=add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),18,.035+power*.09,6,false),i%3===0?glow:dark,0,0,0)}
for(let i=0;i<Math.round(basic*(3+power*22));i++){const d=direction(),pos=point(d,radius*1.04);const plate=add(new THREE.OctahedronGeometry(.12+power*.24,0),i%4===0?glow:metal,pos.x,pos.y,pos.z);plate.scale.set(1,.3+rand(),1.1+rand()*1.7)}
if(power>.18){for(let i=0;i<1+tier;i++){const ring=add(new THREE.TorusGeometry(radius*(1.23+i*.21),.025+power*.025,5,64),i%2?glow:metal,0,0,0);ring.rotation.set(rand()*Math.PI,rand()*Math.PI,rand()*Math.PI)}}
if(p.aura){for(let i=0;i<1+Math.min(3,Math.ceil(p.aura/30));i++){const halo=add(new THREE.TorusGeometry(radius*(1.5+i*.3),.015+power*.04,4,64),glow,0,0,0);halo.rotation.set(rand()*3,rand()*3,rand()*3)}}
if(power>.55){for(let i=0;i<3+tier*2;i++){const d=direction(),pos=point(d,radius*(1.45+rand()*.5));const satellite=add(new THREE.OctahedronGeometry(.12+power*.13,0),glow,pos.x,pos.y,pos.z);satellite.rotation.set(rand()*3,rand()*3,rand()*3)}}

// Directional lance array: coherent forward-facing spikes rather than a uniform pincushion.
const forwardStage=Math.min(1,Math.max(0,(aerialAmount-120)/1800));
if(aerialAmount>=120){
 const forward=new THREE.Vector3((rand()-.5)*.35,(rand()-.5)*.28,1).normalize();
 const lanceCount=Math.min(15,Math.max(3,Math.round(Math.sqrt(aerialAmount)/4)));
 for(let i=0;i<lanceCount;i++){
  const scatter=new THREE.Vector3((rand()-.5)*.65,(rand()-.5)*.65,(rand()-.5)*.18);
  const dir=forward.clone().add(scatter.multiplyScalar(.45-forwardStage*.18)).normalize();
  const len=(1.4+forwardStage*3.6)*(i<3?1.55:.6+rand()*.55);
  const base=point(dir,radius*(.65+rand()*.28));
  const lance=add(new THREE.ConeGeometry(.09+forwardStage*.12,len,5),i%4===0?glow:metal,base.x+dir.x*len*.45,base.y+dir.y*len*.45,base.z+dir.z*len*.45);
  lance.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
 }
}
// Atomic orbit effects: multiple tilted elliptical tracks with bright orbiting particles.
const orbitAmount=(Number(p.aura)||0)+(Number(p.swarm)||0)*.65;
if(orbitAmount>=60){
 const orbitCount=Math.min(5,1+Math.floor(Math.sqrt(orbitAmount)/12));
 for(let i=0;i<orbitCount;i++){
  const pivot=new THREE.Group();group.add(pivot);
  pivot.rotation.set(rand()*Math.PI,rand()*Math.PI,rand()*Math.PI);
  const orbitRadius=radius*(1.35+i*.14+rand()*.14);
  const track=new THREE.Mesh(new THREE.TorusGeometry(orbitRadius,.012+power*.012,5,70),glow);
  track.scale.y=.65+rand()*.25;pivot.add(track);
  const particles=[];
  const particleCount=2+Math.min(5,Math.floor(orbitAmount/400));
  for(let j=0;j<particleCount;j++){
   const particle=new THREE.Mesh(new THREE.IcosahedronGeometry(.045+power*.055,0),glow);pivot.add(particle);
   particles.push({mesh:particle,phase:rand()*Math.PI*2});
  }
  animatedOrbits.push({pivot,particles,radius:orbitRadius,ellipse:track.scale.y,speed:(.006+rand()*.009)*(i%2?-1:1)});
 }
}
// Detached hovering artifacts: extend beyond the body without becoming a dense spike ball.
const hoverAmount=(Number(p.heavy)||0)*.5+(Number(p.aerial)||0)*.45+(Number(p.swarm)||0)*.65;
if(hoverAmount>=180){
 const pieces=Math.min(12,2+Math.floor(Math.sqrt(hoverAmount)/7));
 for(let i=0;i<pieces;i++){
  const directionVector=direction();
  const distance=radius*(1.4+rand()*.45);
  const position=point(directionVector,distance);
  const artifact=add(i%3===0?new THREE.OctahedronGeometry(.17+power*.18,0):new THREE.BoxGeometry(.18+power*.2,.35+power*.25,.16+power*.2),i%4===0?glow:metal,position.x,position.y,position.z);
  artifact.rotation.set(rand()*3,rand()*3,rand()*3);
  artifact.userData.hover={baseY:position.y,phase:rand()*Math.PI*2,speed:.8+rand()*1.3};
 }
}
// Two-tone paint begins at 500 paint units; stable seeded accent finish.
let accentLabel='';
if((Number(p.paint)||0)>=500){
 const secondIndex=(Math.floor(colorVariant*997)+3)%darkAnodized.length;
 const accentChoice=darkAnodized[secondIndex][1]===paintChoice[1]?darkAnodized[(secondIndex+1)%darkAnodized.length]:darkAnodized[secondIndex];
 const accent=metal.clone();accent.color.setHex(accentChoice[1]);
 accentLabel=' / 2色塗装 '+accentChoice[0];
 let painted=0;
 group.traverse(obj=>{if(obj.isMesh&&obj.material===metal){if((painted++%3)===1)obj.material=accent}});
}
group.userData.power=power;camera.position.set(0,3.2,Math.max(12,5+radius*2+aerialReach*1.6));camera.lookAt(0,0,0);
info.textContent=cell.name+' / 塗装 '+paintLabel+accentLabel+' / 骨格 '+({orb:'球状',spire:'縦長尖塔',delta:'三角翼機体',disc:'円盤',prism:'角柱',fork:'双叉',diamond:'結晶多面体'}[hull])+' / 主形態 '+dominant[0]+' / '+sum+'素材 / 形態段階 '+(tier+1)+' / 外装半径 '+radius.toFixed(2)+' / '+Object.entries(p).filter(([,v])=>v>0).map(([k,v])=>k+':'+v).join('・');
}
function refresh(){previewMode=false;select.disabled=false;live.textContent='投入配合の予測プレビュー';const d=JSON.parse(localStorage.getItem('fracture_rebirth_v1')||'{}');const items=(d.cells||[]).filter(c=>c.recipe);const old=select.value;select.replaceChildren();items.forEach((c,i)=>{const o=document.createElement('option');o.value=i;o.textContent=c.name;select.appendChild(o)});if(!items.length){info.textContent='外装CELLを合成すると3Dプレビューに表示されます。';show(null);return}select.value=old&&Number(old)<items.length?old:String(items.length-1);show(items[Number(select.value)])}

// Before crafting, show the expected silhouette with a fixed preview seed.
// The actual synthesis still rolls a new seed and retains that identity.
const mixInputs=[...document.querySelectorAll('#frParts input[data-part]')];
let previewMode=false;
const live=document.createElement('button');live.className='frBtn alt';live.textContent='投入配合の予測プレビュー';wrap.insertBefore(live,viewport);
const hint=document.createElement('div');hint.className='frMuted';hint.textContent='配合で基本形態を予測。完成品の細部は合成時にランダム決定。';wrap.insertBefore(hint,viewport);
const forecast=()=>{if(!previewMode)return;const recipe=Object.fromEntries(mixInputs.map(n=>[n.dataset.part,Math.max(0,Number(n.value)||0)]));const total=Object.values(recipe).reduce((a,b)=>a+b,0);if(total===0){show(null);info.textContent='素材を入力すると形態を予測します';return}show({name:'製作前・予測形態',recipe,seed:1357911})};
live.onclick=()=>{previewMode=!previewMode;live.textContent=previewMode?'完成CELL一覧に戻る':'投入配合の予測プレビュー';select.disabled=previewMode;if(previewMode)forecast();else refresh()};
mixInputs.forEach(n=>n.addEventListener('input',forecast));

select.addEventListener('change',()=>{const d=JSON.parse(localStorage.getItem('fracture_rebirth_v1')||'{}');show((d.cells||[]).filter(c=>c.recipe)[Number(select.value)])});document.getElementById('frMix')?.addEventListener('click',()=>setTimeout(refresh,0));document.getElementById('frHome')?.addEventListener('click',refresh);window.addEventListener('fracture-cell-updated',refresh);const resize=()=>{const w=viewport.clientWidth||320;renderer.setSize(w,290);camera.aspect=w/290;camera.updateProjectionMatrix()};resize();refresh();let frame=0;function animate(){requestAnimationFrame(animate);if(wrap.getBoundingClientRect().width===0)return;if(++frame%2)return;group.rotation.y+=.009;group.rotation.x=Math.sin(frame*.006)*.15;for(const o of animatedOrbits){o.pivot.rotation.z+=o.speed*.35;for(const p of o.particles){p.phase+=o.speed;p.mesh.position.set(Math.cos(p.phase)*o.radius,Math.sin(p.phase)*o.radius*o.ellipse,0)}}group.children.forEach(c=>{if(c.userData.hover){const h=c.userData.hover;c.position.y=h.baseY+Math.sin(frame*.025*h.speed+h.phase)*.12;c.rotation.y+=.004}});renderer.render(scene,camera)}animate();
}