
import React, { useState } from 'react';
import { SceneRecord } from '../types';

interface GalleryViewProps {
  scenes: SceneRecord[];
  onDelete: (id: string) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ scenes, onDelete }) => {
  const [selectedScene, setSelectedScene] = useState<SceneRecord | null>(null);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7]">
      <div className="px-6 py-6 pt-12 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-black">百宝箱</h1>
        <div className="bg-purple-100 text-purple-600 px-4 py-2 rounded-full text-sm font-bold">
          {scenes.length} 张照片
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar">
        {scenes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <i className="fa-solid fa-box-open text-4xl opacity-20"></i>
            </div>
            <p className="text-lg font-bold text-gray-500">百宝箱是空的</p>
            <p className="text-sm mt-2">快去拍点东西吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {scenes.map(scene => (
              <div 
                key={scene.id} 
                onClick={() => setSelectedScene(scene)}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm active:scale-95 transition-all"
              >
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <img src={scene.fullImageUrl} className="w-full h-full object-cover" alt={scene.locationCategory} />
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold text-black truncate mb-1">{scene.locationCategory}</p>
                  <p className="text-xs text-gray-400 font-medium">{new Date(scene.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 详情模态框 */}
      {selectedScene && (
        <div className="fixed inset-0 z-[110] bg-black/95 animate-in fade-in duration-300 flex flex-col">
          <div className="flex items-center justify-between px-6 pt-12 pb-6">
            <button 
              onClick={() => setSelectedScene(null)} 
              className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:bg-white/20 transition-all"
            >
              <i className="fa-solid fa-chevron-left text-xl"></i>
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(selectedScene.id); setSelectedScene(null); }} 
              className="w-12 h-12 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 active:bg-red-500/30 transition-all"
            >
              <i className="fa-solid fa-trash-can text-xl"></i>
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden mb-8 shadow-2xl">
              <img src={selectedScene.fullImageUrl} className="w-full h-auto" />
              <div className="p-6">
                <h2 className="text-2xl font-bold text-black mb-2">{selectedScene.locationCategory}</h2>
                <p className="text-gray-400 text-sm font-medium mb-6">
                  <i className="fa-regular fa-clock mr-2"></i>
                  {new Date(selectedScene.timestamp).toLocaleString()}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {selectedScene.items.map((it, idx) => (
                    <span key={idx} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-xl text-sm font-bold">
                      {it.itemName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;
