import React,{useEffect,useMemo,useState}from'react';
import{useGame}from'../store/GameContext';
import{currencyMeta,SHOP_MAX_SLOTS,SHOP_SLOT_COSTS}from'../data/shop';

export default function ShopPage(){
  const{gold,gems,bloodFragments,shopState,buyShopOffer,refreshShop,unlockShopSlot,shopRefreshCost,shopNextRotation}=useGame();
  const[filter,setFilter]=useState('all'),[selected,setSelected]=useState(null),[message,setMessage]=useState(null),[now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
  const offers=useMemo(()=>shopState.offers.filter(item=>filter==='all'||item.currency===filter),[shopState.offers,filter]);
  const remaining=Math.max(0,shopNextRotation-now),hours=Math.floor(remaining/3600000),minutes=Math.floor(remaining%3600000/60000),seconds=Math.floor(remaining%60000/1000);
  const balances={gold,gems,blood:bloodFragments};
  const confirm=()=>{if(!selected)return;const result=buyShopOffer(selected.id);setMessage(result);setSelected(null)};
  const nextSlot=shopState.slotCount+1,nextSlotCost=SHOP_SLOT_COSTS[nextSlot];
  return <section className="shop-page">
    <div className="shop-hero"><div><h2>🛒 Boutique d’Azerune</h2><p>Des marchandises tournantes achetables avec or, cristaux et Fragments de sang.</p></div><div className="shop-timer"><small>Prochaine rotation</small><b>{hours} h {minutes} min {seconds} s</b></div></div>
    <div className="shop-wallet"><span>🪙 {gold.toLocaleString('fr-FR')}</span><span>💎 {gems.toLocaleString('fr-FR')}</span><span className="blood-wallet">🩸 {bloodFragments.toLocaleString('fr-FR')}</span></div>
    <div className="shop-tabs">{[['all','Tout'],['gold','Or'],['gems','Cristaux'],['blood','Sang']].map(([id,label])=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{label}</button>)}</div>
    {message&&<p className={message.ok?'shop-message success':'shop-message error'}>{message.message}</p>}
    <div className="shop-grid">{offers.map(item=>{const currency=currencyMeta[item.currency],sold=item.sold>=item.stock,affordable=balances[item.currency]>=item.price;return <article key={item.id} className={`shop-offer tier-${item.tier} ${sold?'sold':''}`}><div className="shop-offer-icon">{item.icon}</div><span className="shop-tier">{item.tier}</span><h3>{item.name}</h3><p>{item.description}</p>{item.amount&&<b className="shop-amount">×{item.amount}</b>}<div className="shop-price">{currency.icon} {item.price.toLocaleString('fr-FR')}</div><small>Stock {Math.max(0,item.stock-item.sold)}/{item.stock}</small><button disabled={sold||!affordable} onClick={()=>setSelected(item)}>{sold?'VENDU':affordable?'Acheter':'Solde insuffisant'}</button></article>})}</div>
    <div className="shop-controls"><div><b>{shopState.slotCount}/{SHOP_MAX_SLOTS} emplacements débloqués</b><small>Les emplacements supplémentaires sont permanents.</small>{shopState.slotCount<SHOP_MAX_SLOTS&&<button disabled={gems<nextSlotCost} onClick={()=>setMessage(unlockShopSlot())}>Débloquer le {nextSlot}e emplacement · 💎 {nextSlotCost}</button>}</div><div><b>Rafraîchissements {shopState.refreshCount}/5</b><small>Le compteur et le prix sont réinitialisés chaque jour.</small><button disabled={!shopRefreshCost||gems<shopRefreshCost} onClick={()=>setMessage(refreshShop())}>Rafraîchir · 💎 {shopRefreshCost||'MAX'}</button></div></div>
    {selected&&<div className="shop-modal-backdrop" onClick={()=>setSelected(null)}><div className="shop-modal" onClick={event=>event.stopPropagation()}><div className="shop-modal-icon">{selected.icon}</div><h3>Acheter cet article ?</h3><b>{selected.name}{selected.amount?` ×${selected.amount}`:''}</b><p>{selected.description}</p><div className="shop-modal-price"><small>Prix</small><strong>{currencyMeta[selected.currency].icon} {selected.price.toLocaleString('fr-FR')}</strong><em>Solde après achat : {(balances[selected.currency]-selected.price).toLocaleString('fr-FR')}</em></div><div><button className="secondary" onClick={()=>setSelected(null)}>Annuler</button><button onClick={confirm}>Acheter</button></div></div></div>}
  </section>;
}
