
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
      <div className="glass-header px-4 py-3 sticky top-0 z-10 flex items-center justify-center">
        <div className="font-bold text-[17px]">记忆相册</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar pb-40">
        {scenes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <i className="fa-solid fa-images text-5xl mb-4 opacity-20"></i>
            <p className="text-sm font-bold">还没有存储任何记忆</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {scenes.map(scene => (
              <div 
                key={scene.id} 
                onClick={() => setSelectedScene(scene)}
                className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm active:scale-95 transition-all"
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img src={scene.fullImageUrl} className="w-full h-full object-cover" alt={scene.locationCategory} />
                </div>
                <div className="p-2">
                  <p className="text-[12px] font-bold text-black truncate">{scene.locationCategory}</p>
                  <p className="text-[10px] text-gray-400">{new Date(scene.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 详情模态框 */}
      {selectedScene && (
        <div className="fixed inset-0 z-[110] bg-black animate-in fade-in duration-300">
          <div className="absolute top-12 left-6 z-[120]">
            <button onClick={() => setSelectedScene(null)} className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white">
              <i className="fa-solid fa-chevron-left"></i>
            </button>
          </div>
          <div className="absolute top-12 right-6 z-[120]">
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(selectedScene.id); setSelectedScene(null); }} 
              className="w-10 h-10 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center text-red-500"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>

          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <img src={selectedScene.fullImageUrl} className="max-w-full max-h-[70vh] rounded-xl shadow-2xl" />
            
            <div className="mt-8 text-center text-white">
              <h2 className="text-xl font-bold mb-2">{selectedScene.locationCategory}</h2>
              <p className="text-white/60 text-sm mb-6">{new Date(selectedScene.timestamp).toLocaleString()}</p>
              
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                {selectedScene.items.map((it, idx) => (
                  <span key={idx} className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-medium border border-white/10">
                    {it.itemName}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;
