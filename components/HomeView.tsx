
import React, { useState } from 'react';

interface HomeViewProps {
  onStartChat: (initialQuery: string) => void;
  onStartCamera: () => void;
  onOpenMenu: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onStartChat, onStartCamera, onOpenMenu }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      onStartChat(query);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#F2F2F7]">
      {/* Brand Header */}
      <div className="pt-24 px-8 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-black tracking-tight">抽屉</h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">智能收纳助理</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full">
        {/* Search Bar - iOS Style */}
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden focus-within:border-black transition-colors">
              <i className="fa-solid fa-magnifying-glass ml-4 text-gray-400 text-sm"></i>
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="我的耳机在哪里？"
                className="flex-1 px-3 py-4 bg-transparent border-none focus:ring-0 text-[17px] text-black placeholder:text-gray-400"
              />
              {query && (
                <button 
                  type="submit"
                  className="mr-3 w-8 h-8 rounded-full bg-black text-white flex items-center justify-center transition-transform active:scale-95"
                >
                  <i className="fa-solid fa-arrow-up text-xs"></i>
                </button>
              )}
            </div>
          </form>
          <div className="mt-4 flex justify-center space-x-2">
            <span className="text-[12px] text-gray-400 font-medium">常用查找:</span>
            <button onClick={() => onStartChat('充电宝在哪')} className="text-[12px] text-black font-semibold hover:underline">充电宝</button>
            <button onClick={() => onStartChat('护照位置')} className="text-[12px] text-black font-semibold hover:underline">护照</button>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col items-center space-y-6">
          <button 
            onClick={onStartCamera}
            className="w-full py-4 bg-black text-white rounded-xl font-semibold text-[17px] shadow-sm active:bg-gray-800 active:scale-[0.99] transition-all"
          >
            <i className="fa-solid fa-camera mr-2"></i>
            开始收纳
          </button>
          
          <button 
            onClick={onOpenMenu}
            className="text-[15px] text-black font-bold hover:underline"
          >
            查看物品清单
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
