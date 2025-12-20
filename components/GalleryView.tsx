import React, { useState, useMemo, useEffect } from 'react';
import { SceneRecord } from '../types';
import { updateScene, addCategory, getCategories, deleteCategory, updateCategoryName } from '../services/dbService';

interface GalleryViewProps {
  scenes: SceneRecord[];
  onDelete: (id: string) => void;
  onUpdate: (scene: SceneRecord) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ scenes, onDelete, onUpdate }) => {
  const [selectedScene, setSelectedScene] = useState<SceneRecord | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');

  // Management State
  const [managingCategory, setManagingCategory] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setExistingCategories(cats);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };


  // Group scenes by superCategory, including empty categories
  const groupedScenes = useMemo(() => {
    const groups: Record<string, SceneRecord[]> = {};
    const uncategorized: SceneRecord[] = [];

    // Initialize all existing categories with empty arrays
    existingCategories.forEach(cat => {
        groups[cat] = [];
    });

    scenes.forEach(scene => {
      if (scene.superCategory) {
        if (!groups[scene.superCategory]) {
          groups[scene.superCategory] = [];
        }
        groups[scene.superCategory].push(scene);
      } else {
        uncategorized.push(scene);
      }
    });

    return { groups, uncategorized };
  }, [scenes, existingCategories]);

  const allCategories = useMemo(() => {
    // Merge categories from scenes and explicitly saved categories
    const categories = new Set<string>(existingCategories);
    scenes.forEach(scene => {
      if (scene.superCategory) {
        categories.add(scene.superCategory);
      }
    });
    return Array.from(categories);
  }, [scenes, existingCategories]);

  const handleUpdateCategory = async (scene: SceneRecord, category: string | undefined) => {
    const updatedScene = { ...scene, superCategory: category };
    try {
      await updateScene(updatedScene);
      // Update local state instead of reload
      if (onUpdate) {
          onUpdate(updatedScene);
      }
      // Also update selectedScene so the modal reflects the change immediately
      setSelectedScene(updatedScene);
      showToast("分类已更新");
    } catch (e) {
      console.error("Failed to update scene", e);
      showToast("更新失败，请重试");
    }
  };

  const handleCreateCategory = async (name: string) => {
      if (!name.trim()) return;
      if (allCategories.includes(name.trim())) {
          showToast("空间名已存在");
          return;
      }
      try {
          await addCategory(name.trim());
          await loadCategories(); // Refresh list
          setNewCategoryName('');
          setShowAddCategory(false);
          showToast(`空间 "${name}" 已创建`);
      } catch (e) {
          console.error("Failed to create category", e);
          showToast("创建失败");
      }
  };

  const handleRename = async () => {
      if (!managingCategory || !renameInput.trim()) return;
      if (allCategories.includes(renameInput.trim())) {
          showToast("空间名已存在");
          return;
      }
      try {
          await updateCategoryName(managingCategory, renameInput.trim());
          // Refresh everything
          window.location.reload(); 
      } catch (e) {
          console.error("Failed to rename", e);
          showToast("改名失败");
      }
  };

  const handleMerge = async () => {
      if (!managingCategory || !mergeTarget) return;
      try {
          await updateCategoryName(managingCategory, mergeTarget);
          window.location.reload();
      } catch (e) {
          console.error("Failed to merge", e);
          showToast("合并失败");
      }
  };

  const handleDeleteCategory = async () => {
      if (!managingCategory) return;
      // Double check emptiness
      const count = groupedScenes.groups[managingCategory]?.length || 0;
      if (count > 0) {
          showToast("请先清空或移动角落");
          return;
      }
      try {
          await deleteCategory(managingCategory);
          await loadCategories();
          setManagingCategory(null);
          showToast("空间已删除");
      } catch (e) {
          console.error("Failed to delete", e);
          showToast("删除失败");
      }
  };


  const handleUpdateSceneName = async (scene: SceneRecord, newName: string) => {
    if (!newName.trim()) return;
    const updatedScene = { ...scene, locationCategory: newName.trim() };
    try {
      await updateScene(updatedScene);
      if (onUpdate) {
        onUpdate(updatedScene);
      }
      setSelectedScene(updatedScene);
      showToast("角落名称已更新");
    } catch (e) {
      console.error("Failed to update scene name", e);
      showToast("更新失败");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[120] bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium animate-in fade-in slide-in-from-top-4">
          {toastMessage}
        </div>
      )}

      <div className="px-6 py-6 pt-12 flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold text-black">百宝箱</h1>
           <p className="text-gray-400 text-sm font-medium mt-1">
             {scenes.length} 个角落 · {allCategories.length} 个空间
           </p>
        </div>
        <button 
          onClick={() => setShowAddCategory(true)}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-sm active:scale-90 transition-all"
        >
          <i className="fa-solid fa-folder-plus"></i>
        </button>
      </div>

      {showAddCategory && (
        <div className="mx-6 mb-6 p-4 bg-white rounded-2xl shadow-sm animate-in slide-in-from-top-2">
           <h3 className="text-sm font-bold text-gray-500 mb-2">新建空间分类</h3>
           <div className="flex gap-2">
             <input 
               type="text" 
               name="newCategoryName"
               value={newCategoryName}
               onChange={(e) => setNewCategoryName(e.target.value)}
               placeholder="例如：书房、客厅..."
               className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-black font-bold outline-none focus:ring-2 focus:ring-blue-500"
               onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                       handleCreateCategory(newCategoryName);
                   }
               }}
             />
             <button 
                onClick={() => handleCreateCategory(newCategoryName)}
                className="bg-blue-500 text-white px-6 rounded-xl font-bold active:scale-95 transition-all"
             >
               确定
             </button>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar space-y-8">
        {scenes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <i className="fa-solid fa-box-open text-4xl opacity-20"></i>
            </div>
            <p className="text-lg font-bold text-gray-500">百宝箱是空的</p>
            <p className="text-sm mt-2">快去拍点东西吧！</p>
          </div>
        ) : (
          <>
            {/* Render Grouped Scenes */}
            {Object.entries(groupedScenes.groups).map(([category, groupScenes]) => (
              <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-black">{category}</h2>
                        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md text-xs font-bold">{groupScenes.length}</span>
                    </div>
                    <button 
                        onClick={() => {
                            setManagingCategory(category);
                            setRenameInput('');
                            setMergeTarget('');
                        }}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        <i className="fa-solid fa-ellipsis"></i>
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {groupScenes.map(scene => (
                    <SceneCard key={scene.id} scene={scene} onClick={() => setSelectedScene(scene)} />
                  ))}
                </div>
              </div>
            ))}

            {/* Render Uncategorized Scenes */}
            {groupedScenes.uncategorized.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-xl font-bold text-gray-400">未分类</h2>
                  <span className="bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md text-xs font-bold">{groupedScenes.uncategorized.length}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {groupedScenes.uncategorized.map(scene => (
                    <SceneCard key={scene.id} scene={scene} onClick={() => setSelectedScene(scene)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Management Modal */}
      {managingCategory && (
        <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-black">管理空间 "{managingCategory}"</h3>
              <button 
                onClick={() => setManagingCategory(null)} 
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-95 transition-all"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Rename Section */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">重命名</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    name="renameCategory"
                    value={renameInput}
                    onChange={e => setRenameInput(e.target.value)}
                    placeholder={managingCategory}
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-black font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={handleRename}
                    disabled={!renameInput.trim() || renameInput.trim() === managingCategory}
                    className="bg-blue-500 text-white px-4 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-all"
                  >
                    保存
                  </button>
                </div>
              </div>

              {/* Merge Section */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">合并到</label>
                <div className="flex gap-2">
                  <select 
                    value={mergeTarget} 
                    onChange={e => setMergeTarget(e.target.value)}
                    className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-black font-bold outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">选择目标空间...</option>
                    {allCategories.filter(c => c !== managingCategory).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleMerge}
                    disabled={!mergeTarget}
                    className="bg-blue-500 text-white px-4 rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-all"
                  >
                    合并
                  </button>
                </div>
              </div>

              {/* Delete Section */}
              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={handleDeleteCategory}
                  disabled={groupedScenes.groups[managingCategory]?.length > 0}
                  className="w-full bg-red-50 text-red-500 py-3 rounded-xl font-bold disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 active:scale-95 transition-all"
                >
                  删除空间
                  {groupedScenes.groups[managingCategory]?.length > 0 && (
                    <span className="text-xs font-normal block mt-1">请先清空或移动角落</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 详情模态框 */}
      {selectedScene && (
        <div className="fixed inset-0 z-[110] bg-black/95 animate-in fade-in duration-300 flex flex-col">
          <div className="flex items-center justify-between px-6 pt-12 pb-6">
            <button 
              onClick={() => { setSelectedScene(null); setIsEditingName(false); }} 
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

          <div className="flex-1 overflow-y-auto flex flex-col items-center p-6">
            <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl my-auto">
              <img src={selectedScene.fullImageUrl} className="w-full h-auto" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 mr-4">
                    {isEditingName ? (
                      <input 
                        autoFocus
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => {
                          if (editingName !== selectedScene.locationCategory) {
                             handleUpdateSceneName(selectedScene, editingName);
                          }
                          setIsEditingName(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="text-2xl font-bold text-black mb-1 w-full border-b-2 border-blue-500 outline-none bg-transparent"
                      />
                    ) : (
                      <h2 
                        onClick={() => {
                          setEditingName(selectedScene.locationCategory);
                          setIsEditingName(true);
                        }}
                        className="text-2xl font-bold text-black mb-1 cursor-pointer hover:bg-gray-50 rounded px-1 -ml-1 transition-colors flex items-center gap-2 group"
                      >
                        {selectedScene.locationCategory}
                        <i className="fa-solid fa-pen text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </h2>
                    )}
                    <p className="text-gray-400 text-sm font-medium">
                      <i className="fa-regular fa-clock mr-2"></i>
                      {new Date(selectedScene.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Category Selector */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">所属空间</label>
                  <div className="flex flex-wrap gap-2">
                     <button
                        onClick={() => handleUpdateCategory(selectedScene, undefined)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${!selectedScene.superCategory ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
                      >
                        未分类
                      </button>
                      {allCategories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => handleUpdateCategory(selectedScene, cat)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedScene.superCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {cat}
                        </button>
                      ))}
                       {/* Input for new category inline */}
                       <div className="relative flex items-center">
                          <input 
                            type="text" 
                            name="newCategoryInline"
                            placeholder="+ 新空间"
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold outline-none w-24 focus:w-32 transition-all"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateCategory(selectedScene, e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                       </div>
                  </div>
                </div>
                
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

const SceneCard: React.FC<{ scene: SceneRecord, onClick: () => void }> = ({ scene, onClick }) => (
  <div 
    onClick={onClick}
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
);

export default GalleryView;
