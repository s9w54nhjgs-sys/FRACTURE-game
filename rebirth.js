(()=>{'use strict';
const KEY='fracture_rebirth_v1';
const abilities=[
{name:'磁界追跡',type:'追尾',desc:'金属質の追尾弾を操る。遮蔽物と回避に弱い。'},
{name:'閃光歩法',type:'機動',desc:'短距離の瞬発移動に特化する。'},
{name:'重力干渉',type:'制圧',desc:'周囲の移動経路を歪める。'},
{name:'装甲共鳴',type:'防御',desc:'被弾時に反撃の機会を作る。'},
{name:'残響射撃',type:'射撃',desc:'攻撃の軌跡に遅延衝撃を残す。'},
{name:'虚空の爪',type:'近接',desc:'近距離で連続攻撃を繰り出す。'}
];
const roll=()=>({...abilities[Math.floor(Math.random()*abilities.length)],seed:Math.floor(Math.random()*1e9)});
let data;try{data=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
if(!data||!data.ability)data={generation:1,lives:2,ability:roll(),tags:0,draws:0,bonus:null};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}};
save();
const css=document.createElement('style');css.textContent=`
#frMenu{position:fixed;inset:0;z-index:30;background:radial-gradient(ellipse at 75% 25%,#153e4c 0%,#08131f 55%,#05080e 100%);color:#e8fcff;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;font-family:system-ui,sans-serif}
#frMenu.frHidden{display:none}#frPanel{width:min(650px,100%);max-height:95%;overflow:auto;border:1px solid #72d7e377;background:#0b1a2ce8;border-radius:18px;padding:clamp(16px,3vw,30px);box-shadow:0 0 65px #008ba822}
#frPanel h1{letter-spacing:.28em;font-size:clamp(23px,5vw,38px);margin:0}#frPanel h2{font-size:16px;margin:15px 0 8px}
.frMuted{color:#a4bac8;font-size:12px;line-height:1.7}.frLine{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.frCard{background:#122b3b;border:1px solid #438a9b77;border-radius:12px;padding:14px;margin:10px 0}
.frBtn{background:#7ce7db;color:#09202a;border:0;border-radius:10px;padding:12px 17px;font-weight:800;font-size:14px;margin:4px;cursor:pointer}.frBtn.alt{background:#17384b;color:#d9fcff;border:1px solid #5da3ae}.frBtn:disabled{opacity:.4}
#frNotice{min-height:22px;color:#ffe0a2;font-size:12px}#frHome{position:fixed;z-index:7;top:calc(58px + env(safe-area-inset-top));right:12px;background:#102c3de0;color:#c8fffa;border:1px solid #73dcd2;border-radius:8px;padding:7px 12px;display:none;pointer-events:auto}
`;document.head.appendChild(css);
const home=document.createElement('button');home.id='frHome';home.textContent='HOME';document.body.appendChild(home);
const menu=document.createElement('div');menu.id='frMenu';menu.innerHTML='<div id="frPanel"><div class="frLine"><div><h1>FRACTURE</h1><div class="frMuted">REBIRTH PROTOCOL / 試作版</div></div><div id="frGen"></div></div><div id="frState"></div><div id="frNotice"></div><div class="frLine"><button class="frBtn" id="frDeploy">出撃する</button><button class="frBtn alt" id="frGacha">キルタグガチャ</button><button class="frBtn alt" id="frReset">テストデータ初期化</button></div><div class="frMuted">サンクチュアリ未実装。抽選結果・残機・タグはこのブラウザに保存。オンライン連携・課金・本番バランスは未実装。</div></div>';document.body.appendChild(menu);
let note='';
function render(){document.getElementById('frGen').textContent='第 '+data.generation+' 世代';document.getElementById('frState').innerHTML='<div class="frCard"><div class="frLine"><b>現在の個性：'+data.ability.name+'</b><b>'+data.ability.type+'</b></div><div class="frMuted">'+data.ability.desc+'</div></div><div class="frLine"><span>残機：<b>'+data.lives+' / 2</b></span><span>キルタグ：<b>'+data.tags+' / 100</b></span><span>特殊抽選：<b>'+data.draws+' 回</b></span></div><div class="frCard"><b>特殊能力（試作）</b><div class="frMuted">'+(data.bonus?data.bonus.name+' / 残り使用回数 '+data.bonus.uses:'未所持')+'</div></div>';document.getElementById('frNotice').textContent=note;document.getElementById('frGacha').disabled=data.tags<100;}
function show(){window.fractureMenuOpen=true;menu.classList.remove('frHidden');home.style.display='none';render()}
function hide(){window.fractureMenuOpen=false;menu.classList.add('frHidden');home.style.display='block'}
document.getElementById('frDeploy').onclick=()=>{if(document.getElementById('result')?.classList.contains('show')){sessionStorage.setItem('frAutoDeploy','1');location.reload()}else hide()};
home.onclick=show;
document.getElementById('frGacha').onclick=()=>{if(data.tags<100)return;data.tags-=100;data.draws++;data.bonus={name:abilities[Math.floor(Math.random()*abilities.length)].name,uses:3};note='特殊抽選成功！ 使用回数3回の能力を獲得（戦闘への適用は次段階）';save();render()};
document.getElementById('frReset').onclick=()=>{if(!confirm('試作データをすべて初期化しますか？'))return;data={generation:1,lives:2,ability:roll(),tags:0,draws:0,bonus:null};note='初期化しました';save();render()};
window.fractureAwardDecoyTag=()=>{data.tags+=1;note='デコイ撃破：キルタグ +1（オンライン対戦の仮報酬）';save();render()};
window.fractureFinish=(success,kills)=>{if(success){note='脱出成功。個性と残機は維持されます。'}else{data.lives--;if(data.lives<=0){data.generation++;data.lives=2;data.ability=roll();data.bonus=null;note='永久死亡。新しい個性で第 '+data.generation+' 世代に転生しました。'}else note='死亡。残機を1つ失いました。現在の個性は維持されます。'}save();setTimeout(show,30)};
if(sessionStorage.getItem('frAutoDeploy')==='1'){sessionStorage.removeItem('frAutoDeploy');hide()}else show();
})();