
import React, { useState, useEffect } from 'react';
import { StorageItem, SceneType } from '../types';

interface MenuViewProps {
  items: StorageItem[];
  onRemoveItem: (id: string) => void;
  initialScene?: SceneType | null;
}

const MenuView: React.FC<MenuViewProps> = ({ items, onRemoveItem, initialScene }) => {
  const [selectedScene, setSelectedScene] = useState<SceneType | null>(null);
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialScene) {
      setSelectedScene(initialScene);
      setSelectedItem(null);
    }
  }, [initialScene]);

  const sceneStats = Object.values(SceneType).map(scene => ({
    type: scene,
    count: items.filter(i => i.scene === scene).length
  }));

  const filteredItems = items
    .filter(item => {
      const matchesScene = !selectedScene || item.scene === selectedScene;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.locationDetail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesScene && matchesSearch;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleBack = () => {
    if (selectedItem) {
      setSelectedItem(null);
    } else if (selectedScene) {
      setSelectedScene(null);
    }
  };

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

  // Item Detail View
  if (selectedItem) {
    return (
      <div className="flex flex-col h-full bg-[#F2F2F7]">
        <div className="glass-header px-4 py-3 sticky top-0 z-10 flex items-center">
          <button onClick={handleBack} className="text-black font-bold flex items-center">
            <i className="fa-solid fa-chevron-left mr-1"></i>
            返回
          </button>
          <div className="flex-1 text-center font-bold text-[17px] mr-10">物品详情</div>
        </div>

        <div className="p-4 space-y-6 pb-24">
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-64 object-cover" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            <div className="p-4">
              <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-tight mb-1">物品名称</p>
              <p className="text-[17px] font-bold text-black">{selectedItem.name}</p>
            </div>
            <div className="p-4">
              <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-tight mb-1">存放位置</p>
              <p className="text-[17px] text-black font-medium">{selectedItem.locationDetail}</p>
              <p className="text-[13px] text-gray-500 font-bold mt-1">{selectedItem.scene}</p>
            </div>
            <div className="p-4">
              <p className="text-[12px] text-gray-400 font-semibold uppercase tracking-tight mb-1">特征备注</p>
              <p className="text-[15px] text-gray-700 leading-relaxed">{selectedItem.remarks || '无'}</p>
            </div>
          </div>

          <button 
            onClick={() => {
              onRemoveItem(selectedItem.id);
              handleBack();
            }}
            className="w-full py-4 bg-white text-gray-900 font-bold rounded-xl border border-gray-200 active:bg-gray-50 transition-colors"
          >
            从清单移除
          </button>
        </div>
      </div>
    );
  }

  // Gallery/List View
  if (selectedScene) {
    return (
      <div className="flex flex-col h-full bg-[#F2F2F7]">
        <div className="glass-header px-4 py-3 sticky top-0 z-10 flex items-center">
          <button onClick={handleBack} className="text-black font-bold flex items-center">
            <i className="fa-solid fa-chevron-left mr-1"></i>
            全部
          </button>
          <div className="flex-1 text-center font-bold text-[17px] mr-10">{selectedScene}</div>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 pb-32">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              onClick={() => setSelectedItem(item)}
              className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm active:opacity-70 transition-opacity"
            >
              <img src={item.imageUrl} className="w-full aspect-square object-cover" />
              <div className="p-3">
                <p className="text-[15px] font-bold text-black truncate">{item.name}</p>
                <p className="text-[12px] text-gray-400 truncate">{item.locationDetail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Categories List (Root)
  return (
    <div className="flex flex-col h-full bg-[#F2F2F7]">
      <div className="px-4 py-8 pb-32">
        <h1 className="text-3xl font-bold text-black mb-6">空间清单</h1>
        
        {/* Native Style Search */}
        <div className="relative mb-8">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input 
            type="text" 
            placeholder="搜索物品..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-gray-200/50 border-none rounded-lg pl-9 pr-4 py-2 text-[17px] focus:ring-0"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-sm">
          {sceneStats.map((stat) => (
            <button 
              key={stat.type}
              onClick={() => setSelectedScene(stat.type)}
              className="w-full flex items-center p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                <i className={`fa-solid ${getSceneIcon(stat.type)} text-black text-sm`}></i>
              </div>
              <span className="flex-1 font-bold text-black">{stat.type}</span>
              <span className="text-gray-400 text-sm mr-2">{stat.count}</span>
              <i className="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuView;
