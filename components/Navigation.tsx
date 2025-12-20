
import React from 'react';

interface NavigationProps {
  activeTab: 'storage' | 'menu' | 'chat';
  setActiveTab: (tab: any) => void;
  onCameraClick?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, onCameraClick }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full glass-nav z-50 h-20 px-6">
      <nav className="flex justify-between items-center h-full max-w-md mx-auto">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center flex-1 transition-colors ${activeTab === 'chat' ? 'text-black' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-magnifying-glass text-[20px]"></i>
          <span className="text-[10px] font-bold mt-1">寻找</span>
        </button>
        
        <button 
          onClick={() => onCameraClick ? onCameraClick() : setActiveTab('storage')}
          className={`flex flex-col items-center flex-1 transition-colors ${activeTab === 'storage' ? 'text-black' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-plus-square text-[22px]"></i>
          <span className="text-[10px] font-bold mt-1">收纳</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center flex-1 transition-colors ${activeTab === 'menu' ? 'text-black' : 'text-gray-400'}`}
        >
          <i className="fa-solid fa-list-ul text-[20px]"></i>
          <span className="text-[10px] font-bold mt-1">清单</span>
        </button>
      </nav>
    </div>
  );
};

export default Navigation;
