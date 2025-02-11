// Service Worker-ის ვერსია
const VERSION = '1.0.0';

// ქეშის სახელი
const CACHE_NAME = `class-manager-${VERSION}`;

// ონლაინ სტატუსის შემოწმება
self.addEventListener('online', async () => {
  try {
    const accessCode = await getFromDB('accessCode');
    if (!accessCode) return;

    const response = await fetch(
      'https://loyzwjzsjnikmnuqilmv.functions.supabase.co/functions/v1/access-manager',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check',
          accessCode
        }),
      }
    );

    if (!response.ok) return;

    const data = await response.json();
    
    if (data.config) {
      await saveToDB('appConfig', JSON.stringify(data.config));
    }
    
    if (data.serverTime) {
      await saveToDB('lastServerTime', data.serverTime);
    }
    if (data.validUntil) {
      await saveToDB('validUntil', data.validUntil);
    }

    if (data.status === 'expired') {
      await saveToDB('approvalStatus', null);
    } else if (data.status === 'approved') {
      await saveToDB('approvalStatus', 'approved');
    }

    // ვაგზავნით შეტყობინებას აპლიკაციას
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'STATUS_UPDATE',
        status: data.status
      });
    });
  } catch (error) {
    console.error('Status check failed:', error);
  }
});

// IndexedDB-სთან მუშაობის ფუნქციები
async function getFromDB(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('class-manager', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('keyval', 'readonly');
      const store = transaction.objectStore('keyval');
      
      const getRequest = store.get(key);
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => resolve(getRequest.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('keyval');
    };
  });
}

async function saveToDB(key, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('class-manager', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('keyval', 'readwrite');
      const store = transaction.objectStore('keyval');
      
      const putRequest = store.put(value, key);
      putRequest.onerror = () => reject(putRequest.error);
      putRequest.onsuccess = () => resolve();
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('keyval');
    };
  });
}

// Service Worker-ის ინსტალაცია
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('Service Worker installed');
});

// Service Worker-ის აქტივაცია
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // ვშლით ძველ ქეშს
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('class-manager-'))
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
    ])
  );
  console.log('Service Worker activated');
});
