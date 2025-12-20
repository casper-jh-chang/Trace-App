
import React, { useState, useEffect } from 'react';
import { StorageItem, SceneType } from '../types';

interface MenuViewProps {
  items: StorageItem[];
  onRemoveItem: (id: string) => void;
  onUpdateItem: (item: StorageItem) => void;
  initialScene?: SceneType | null;
}

const MenuView: React.FC<MenuViewProps> = ({ items = [], onRemoveItem, onUpdateItem, initialScene }) => {
  const [selectedScene, setSelectedScene] = useState<SceneType | null>(null);
  const [selectedItem, setSelectedItem] = useState<StorageItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<StorageItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialScene) {
      setSelectedScene(initialScene);
      setSelectedItem(null);
      setIsEditing(false);
    }
  }, [initialScene]);

  // 计算过期状态
  const getExpiryInfo = (item: StorageItem) => {
    if (!item.expiryTimestamp) return null;
    const now = Date.now();
    const diff = item.expiryTimestamp - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { label: '已过期', color: 'text-red-500', bg: 'bg-red-50', icon: 'fa-skull' };
    if (days <= 2) return { label: `仅剩 ${days} 天`, color: 'text-orange-500', bg: 'bg-orange-50', icon: 'fa-hourglass-half' };
    return { label: `还有 ${days} 天`, color: 'text-green-500', bg: 'bg-green-50', icon: 'fa-leaf' };
  };

  const expiringItems = (items || [])
    .filter(i => i.expiryTimestamp)
    .sort((a, b) => (a.expiryTimestamp || 0) - (b.expiryTimestamp || 0))
    .slice(0, 5);

  const filteredItems = (items || [])
    .filter(item => {
      const matchesScene = !selectedScene || item.scene === selectedScene;
      const search = searchQuery.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(search) || item.locationDetail.toLowerCase().includes(search);
      return matchesScene && matchesSearch;
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const handleBack = () => {
    if (selectedItem) {
      setSelectedItem(null);
      setIsEditing(false);
    } else if (selectedScene) {
      setSelectedScene(null);
    }
  };

  const getSceneIcon = (scene: SceneType) => {
    switch (scene) {
      case SceneType.KITCHEN: return 'fa-utensils';
      case SceneType.CLOSET: return 'fa-shirt';
      case SceneType.STUDY: return 'fa-book';
      default: return 'fa-box';
    }
  };

  // Item Detail View
  if (selectedItem) {
    const expiryInfo = getExpiryInfo(selectedItem);
    return (
      <div className="flex flex-col h-full bg-[#F2F2F7]">
        <div className="glass-header px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
          <button onClick={handleBack} className="text-black font-bold flex items-center">
            <i className="fa-solid fa-chevron-left mr-1"></i>
            返回
          </button>
          <div className="font-bold text-[17px]">物品详情</div>
          <button onClick={() => isEditing ? (editForm && onUpdateItem(editForm), setSelectedItem(editForm), setIsEditing(false)) : (setEditForm(selectedItem), setIsEditing(true))} className="text-black font-bold text-sm bg-gray-100 px-3 py-1 rounded-full">
            {isEditing ? '保存' : '编辑'}
          </button>
        </div>

        <div className="p-4 space-y-6 pb-32">
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
            <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-64 object-cover" />
            {expiryInfo && (
              <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full ${expiryInfo.bg} ${expiryInfo.color} font-bold text-xs shadow-sm flex items-center`}>
                <i className={`fa-solid ${expiryInfo.icon} mr-1.5`}></i>
                {expiryInfo.label}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            <div className="p-4">
              <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">物品名称</p>
              {isEditing ? (
                <input type="text" value={editForm?.name} onChange={e => setEditForm(prev => prev ? {...prev, name: e.target.value} : null)} className="w-full bg-gray-50 rounded p-1 text-[17px] font-bold" />
              ) : (
                <p className="text-[17px] font-bold text-black">{selectedItem.name}</p>
              )}
            </div>
            {selectedItem.expiryTimestamp && (
               <div className="p-4">
                <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">新鲜度期限</p>
                <p className="text-[15px] text-black font-medium">{new Date(selectedItem.expiryTimestamp).toLocaleDateString()}</p>
              </div>
            )}
            <div className="p-4">
              <p className="text-[11px] text-gray-400 font-bold uppercase mb-1">存放位置</p>
              <p className="text-[15px] text-black font-medium">{selectedItem.locationDetail}</p>
              <p className="text-[12px] text-gray-400 mt-1">{selectedItem.scene}</p>
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-3">
              <button 
                onClick={() => { onRemoveItem(selectedItem.id); handleBack(); }}
                className="w-full py-4 bg-black text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
              >
                标记为已消耗/吃完
              </button>
              <button 
                onClick={() => { if(window.confirm('确认彻底删除此记录？')) { onRemoveItem(selectedItem.id); handleBack(); } }}
                className="w-full py-4 bg-white text-red-500 font-bold rounded-xl border border-gray-200"
              >
                删除此条目
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7]">
      <div className="px-4 pt-8 pb-32">
        <h1 className="text-3xl font-bold text-black mb-6">清单仪表盘</h1>

        {/* Freshness Section */}
        {expiringItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">新鲜度追踪</h3>
            <div className="flex overflow-x-auto space-x-3 pb-2 no-scrollbar">
              {expiringItems.map(item => {
                const info = getExpiryInfo(item);
                return (
                  <div key={item.id} onClick={() => setSelectedItem(item)} className="flex-shrink-0 w-32 bg-white rounded-xl border border-gray-200 p-2 shadow-sm active:scale-95 transition-all">
                    <img src={item.imageUrl} className="w-full aspect-square object-cover rounded-lg mb-2" />
                    <p className="text-[12px] font-bold text-black truncate">{item.name}</p>
                    <p className={`text-[10px] font-bold ${info?.color}`}>{info?.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="relative mb-6">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input 
            type="text" 
            placeholder="搜索物品..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-[15px] focus:ring-0 shadow-sm"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-sm">
          {Object.values(SceneType).map(scene => {
            const count = (items || []).filter(i => i.scene === scene).length;
            return (
              <button key={scene} onClick={() => setSelectedScene(scene)} className="w-full flex items-center p-4 active:bg-gray-50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mr-4">
                  <i className={`fa-solid ${getSceneIcon(scene)} text-black`}></i>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-black text-[15px]">{scene}</p>
                  <p className="text-[12px] text-gray-400">{count} 个物品</p>
                </div>
                <i className="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
              </button>
            );
          })}
        </div>
      </div>

      {selectedScene && (
        <div className="fixed inset-0 bg-[#F2F2F7] z-50 overflow-y-auto">
          <div className="glass-header px-4 py-3 sticky top-0 z-10 flex items-center">
            <button onClick={() => setSelectedScene(null)} className="text-black font-bold flex items-center">
              <i className="fa-solid fa-chevron-left mr-1"></i> 返回
            </button>
            <div className="flex-1 text-center font-bold text-[17px] mr-10">{selectedScene}</div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3 pb-32">
            {filteredItems.map(item => (
              <div key={item.id} onClick={() => setSelectedItem(item)} className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <img src={item.imageUrl} className="w-full aspect-square object-cover" />
                <div className="p-3">
                  <p className="text-[14px] font-bold text-black truncate">{item.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{item.locationDetail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuView;
