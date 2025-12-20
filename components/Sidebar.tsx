import React from 'react';
import { AIModelType } from '../services/aiService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: AIModelType;
  onSelectModel: (model: AIModelType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentModel, onSelectModel }) => {
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
          <h2 className="text-2xl font-bold text-black tracking-tight">设置</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-black active:bg-gray-200">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="mb-0">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              <i className="fa-solid fa-brain mr-2"></i>
              谁来帮我想？
            </h3>
            <div className="flex bg-gray-50 p-1.5 rounded-2xl shadow-sm border border-gray-100">
              <button
                onClick={() => onSelectModel('qwen')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                  currentModel === 'qwen' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-black hover:bg-transparent'
                }`}
              >
                通义千问
              </button>
              <button
                onClick={() => onSelectModel('gemini')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                  currentModel === 'gemini' 
                    ? 'bg-purple-500 text-white shadow-md' 
                    : 'text-gray-400 hover:text-black hover:bg-transparent'
                }`}
              >
                Gemini
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-400 leading-relaxed">
              选择您喜欢的 AI 助手，它将帮助您识别物品并整理收纳建议。
            </p>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-center text-gray-400">
             © 2024 抽屉 Smart Organize
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
