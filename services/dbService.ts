
import { SceneRecord } from "../types";

const DB_NAME = 'DrawerMemoryDB';
const STORE_NAME = 'scenes';
const DB_VERSION = 3;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('IndexedDB open error');
    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('chats')) {
        db.createObjectStore('chats', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'name' });
      }
    };
  });
};

export const getCategories = async (): Promise<string[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readonly');
    const store = transaction.objectStore('categories');
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result || []).map((item: any) => item.name));
    request.onerror = () => reject('Fetch categories error');
  });
};

export const addCategory = async (name: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.put({ name }); // put handles add or update (idempotent)

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Add category error');
  });
};

export const getAllScenes = async (): Promise<SceneRecord[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject('Fetch scenes error');
  });
};

export const addScene = async (scene: SceneRecord): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(scene);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Add scene error');
  });
};

export const updateScene = async (scene: SceneRecord): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(scene);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Update scene error');
  });
};

export const deleteScene = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Delete scene error');
  });
};

export const getChatHistory = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readonly');
    const store = transaction.objectStore('chats');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject('Fetch chats error');
  });
};

export const addChatMessage = async (message: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.add(message);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Add chat error');
  });
};

export const clearChatHistory = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chats', 'readwrite');
    const store = transaction.objectStore('chats');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Clear chat error');
  });
};

export const deleteCategory = async (name: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('categories', 'readwrite');
    const store = transaction.objectStore('categories');
    const request = store.delete(name);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Delete category error');
  });
};

export const updateCategoryName = async (oldName: string, newName: string): Promise<void> => {
  if (oldName === newName) return Promise.resolve();

  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['categories', STORE_NAME], 'readwrite');

    // 1. Update Category Store
    const catStore = transaction.objectStore('categories');
    catStore.put({ name: newName }); // Create new or confirm existing
    catStore.delete(oldName);        // Delete old

    // 2. Update Scenes Store
    const sceneStore = transaction.objectStore(STORE_NAME);
    const request = sceneStore.getAll();

    request.onsuccess = () => {
      const scenes = request.result as SceneRecord[];
      scenes.forEach(scene => {
        if (scene.superCategory === oldName) {
          scene.superCategory = newName;
          sceneStore.put(scene);
        }
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject('Update category name error');
  });
};
