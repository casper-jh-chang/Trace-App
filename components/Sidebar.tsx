
import React from 'react';
import { SceneType } from '../types';
import { AIModelType } from '../services/aiService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScene: (scene: SceneType) => void;
  itemsCountByScene: Record<string, number>;
  currentModel: AIModelType;
  onSelectModel: (model: AIModelType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onSelectScene, itemsCountByScene, currentModel, onSelectModel }) => {
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
        className={`fixed top-0 left-0 h-full w-80 bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-8 pt-12 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-2xl font-bold text-black tracking-tight">房间分类</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black active:bg-gray-200">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-2 no-scrollbar">
          {Object.values(SceneType).map((scene) => (
            <button
              key={scene}
              onClick={() => onSelectScene(scene)}
              className="w-full flex items-center px-4 py-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors group text-left border border-transparent hover:border-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-4 text-blue-500">
                <i className={`fa-solid ${getSceneIcon(scene)} text-lg`}></i>
              </div>
              <div className="flex-1 font-bold text-black text-lg">{scene}</div>
              <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-500">{itemsCountByScene[scene] || 0}</div>
            </button>
          ))}
        </div>

        <div className="p-8 border-t border-gray-100 bg-gray-50/50">
          <div className="mb-0">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              <i className="fa-solid fa-brain mr-2"></i>
              谁来帮我想？
            </h3>
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
              <button
                onClick={() => onSelectModel('qwen')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                  currentModel === 'qwen' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-black hover:bg-gray-50'
                }`}
              >
                通义千问
              </button>
              <button
                onClick={() => onSelectModel('gemini')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                  currentModel === 'gemini' 
                    ? 'bg-purple-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-black hover:bg-gray-50'
                }`}
              >
                Gemini
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
