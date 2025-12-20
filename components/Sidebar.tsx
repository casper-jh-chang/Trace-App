
import React from 'react';
import { SceneType } from '../types';
import { AIModelType } from '../services/aiService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScene: (scene: SceneType) => void;
  itemsCountByScene: Record<string, number>;
  onOpenPoster?: () => void;
  currentModel: AIModelType;
  onSelectModel: (model: AIModelType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onSelectScene, itemsCountByScene, onOpenPoster, currentModel, onSelectModel }) => {
  const getSceneIcon = (scene: SceneType) => {
    switch (scene) {
      case SceneType.KITCHEN: return 'fa-utensils';
      case SceneType.CLOSET: return 'fa-shirt';
      case SceneType.STUDY: return 'fa-book';
      case SceneType.BASEMENT: return 'fa-warehouse';
      case SceneType.LIVING_ROOM: return 'fa-couch';
      case SceneType.BATHROOM: return 'fa-bath';
      default: return 'fa-box';
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 pt-12 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-xl font-bold text-black tracking-tight">分类</h2>
          <button onClick={onClose} className="text-black font-bold">完成</button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2 divide-y divide-gray-50 no-scrollbar">
          {Object.values(SceneType).map((scene) => (
            <button
              key={scene}
              onClick={() => onSelectScene(scene)}
              className="w-full flex items-center px-6 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors group text-left"
            >
              <div className="w-6 h-6 flex items-center justify-center mr-4">
                <i className={`fa-solid ${getSceneIcon(scene)} text-black`}></i>
              </div>
              <div className="flex-1 font-bold text-black text-[15px]">{scene}</div>
              <div className="text-gray-400 text-sm font-bold mr-2">{itemsCountByScene[scene] || 0}</div>
              <i className="fa-solid fa-chevron-right text-gray-200 text-[10px]"></i>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-gray-100">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">AI 模型</h3>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => onSelectModel('qwen')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  currentModel === 'qwen' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                通义千问
              </button>
              <button
                onClick={() => onSelectModel('gemini')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  currentModel === 'gemini' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-gray-500 hover:text-black'
                }`}
              >
                Gemini
              </button>
            </div>
          </div>

          <button 
            onClick={onOpenPoster}
            className="w-full flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mb-4"
          >
            <i className="fa-solid fa-wand-magic-sparkles text-black mr-3"></i>
            <span className="font-bold text-sm">生成宣传海报</span>
          </button>
          <div className="bg-[#F2F2F7] rounded-xl p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">智能收纳</p>
            <p className="text-[13px] text-gray-600 leading-snug font-medium">您可以随时通过拍摄照片来更新清单中的物品。</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
