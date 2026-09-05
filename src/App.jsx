import React,{Suspense,useState}from'react';
import{GameProvider}from'./store/GameContext';
import Layout from'./components/Layout';
import HomePage from'./pages/HomePage';
import TutorialPage from'./pages/TutorialPage';

const HeroesPage=React.lazy(()=>import('./pages/HeroesPage'));
const EquipmentPage=React.lazy(()=>import('./pages/EquipmentPage'));
const QuestsPage=React.lazy(()=>import('./pages/QuestsPage'));
const SummonPage=React.lazy(()=>import('./pages/SummonPage'));
const HistoryPage=React.lazy(()=>import('./pages/HistoryPage'));
const BattlePage=React.lazy(()=>import('./pages/BattlePage'));
const CampaignPage=React.lazy(()=>import('./pages/CampaignPage'));
const SettingsPage=React.lazy(()=>import('./pages/SettingsPage'));
const ShopPage=React.lazy(()=>import('./pages/ShopPage'));
const RaidsPage=React.lazy(()=>import('./pages/RaidsPage'));
const ExpeditionsPage=React.lazy(()=>import('./pages/ExpeditionsPage'));
const AchievementsPage=React.lazy(()=>import('./pages/AchievementsPage'));const MythicPage=React.lazy(()=>import('./pages/MythicPage')); const InventoryPage=React.lazy(()=>import('./pages/InventoryPage'));
const WorldBossPage=React.lazy(()=>import('./pages/WorldBossPage'));
const TutorialAcademyPage=React.lazy(()=>import('./pages/TutorialAcademyPage'));
const TUTORIAL_KEY='azerune-tutorial-completed-v1';

export default function App(){
  const[page,setPageState]=useState(()=>localStorage.getItem('azerune-summon-reveal-v1')?'summon':(sessionStorage.getItem('azerune-page')||'home')); const setPage=value=>{sessionStorage.setItem('azerune-page',value);setPageState(value)};
  const[tutorial,setTutorial]=useState(()=>localStorage.getItem(TUTORIAL_KEY)!=='true');
  const completeTutorial=()=>{localStorage.setItem(TUTORIAL_KEY,'true');setTutorial(false);setPage('home')};
  if(tutorial)return <GameProvider><TutorialPage onComplete={completeTutorial}/></GameProvider>;
  const replayTutorial=()=>setTutorial(true);
  const view=page==='home'?<HomePage setPage={setPage} onTutorial={replayTutorial}/>:page==='campaign'?<CampaignPage setPage={setPage}/>:page==='raids'?<RaidsPage setPage={setPage}/>:page==='codex'?<HeroesPage/>:page==='squad'?<HeroesPage squad/>:page==='gear'?<EquipmentPage/>:page==='inventory'?<InventoryPage setPage={setPage}/>:page==='shop'?<ShopPage/>:page==='quests'?<QuestsPage setPage={setPage}/>:page==='summon'?<SummonPage/>:page==='history'?<HistoryPage/>:page==='expeditions'?<ExpeditionsPage setPage={setPage}/>:page==='achievements'?<AchievementsPage/>:page==='mythic'?<MythicPage/>:page==='worldboss'?<WorldBossPage setPage={setPage}/>:page==='battle'?<BattlePage setPage={setPage}/>:page==='academy'?<TutorialAcademyPage/>:page==='settings'?<SettingsPage/>:<HomePage setPage={setPage} onTutorial={replayTutorial}/>;
  return <GameProvider><Layout page={page} setPage={setPage}><Suspense fallback={<p>Chargement...</p>}>{view}</Suspense></Layout></GameProvider>;
}
