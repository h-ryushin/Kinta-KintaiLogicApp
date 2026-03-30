export const ShopTabs = ({ shop, onShopChange }: any) => (
  <div className="flex bg-slate-200 p-1 rounded-2xl w-full max-w-[300px] mx-auto mb-6 shadow-inner">
    <button 
      onClick={() => onShopChange('nishieki')} 
      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${shop === 'nishieki' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}
    >西駅店</button>
    <button 
      onClick={() => onShopChange('kosai')} 
      className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${shop === 'kosai' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500'}`}
    >湖西店</button>
  </div>
);