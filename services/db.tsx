
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { DatabaseState, Material, Request, RequestStatus, User } from '../types';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  getDocs,
  writeBatch
} from "firebase/firestore";

// --- CONFIGURATION ---
// เปลี่ยนเป็น true เมื่อใส่ค่าใน services/firebase.ts แล้ว
const ENABLE_FIREBASE = true; 

// Initial Seed Data (Translated to Thai with Usernames/Passwords)
const INITIAL_DATA: DatabaseState = {
  materials: [
    { id: 1, name: 'กระดาษ A4', stock: 50, unit: 'รีม' },
    { id: 2, name: 'ปากกาน้ำเงิน', stock: 100, unit: 'ด้าม' },
    { id: 3, name: 'ที่เย็บกระดาษ', stock: 10, unit: 'อัน' },
    { id: 4, name: 'ปากกาไวท์บอร์ด', stock: 25, unit: 'กล่อง' },
  ],
  users: [
    { id: 1, name: 'เจ้าหน้าที่แอดมิน', department: 'ฝ่ายบริหาร', role: 'ADMIN', username: 'admin', password: '123' },
    { id: 2, name: 'สมชาย ใจดี', department: 'ฝ่ายขาย', role: 'USER', username: 'somchai', password: '123' },
    { id: 3, name: 'สมศรี รักงาน', department: 'ฝ่ายบุคคล', role: 'USER', username: 'somsri', password: '123' },
  ],
  requests: [
    { id: 1, user_id: 2, material_id: 1, quantity: 2, request_date: new Date(Date.now() - 86400000).toISOString(), status: 'ISSUED' },
    { id: 2, user_id: 3, material_id: 2, quantity: 5, request_date: new Date().toISOString(), status: 'PENDING' },
  ],
};

interface DbContextType extends DatabaseState {
  addMaterial: (m: Omit<Material, 'id'>) => Promise<void>;
  updateMaterial: (m: Material) => Promise<void>;
  deleteMaterial: (id: number | string) => Promise<void>;
  
  addUser: (u: Omit<User, 'id'>) => Promise<void>;
  updateUser: (u: User) => Promise<void>;
  deleteUser: (id: number | string) => Promise<void>;
  
  createRequest: (userId: number | string, materialId: number | string, quantity: number) => Promise<void>;
  updateRequestStatus: (requestId: number | string, status: RequestStatus) => Promise<{ success: boolean; message?: string }>;
  
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  
  isFirebaseEnabled: boolean;
}

const DbContext = createContext<DbContextType | undefined>(undefined);

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DatabaseState>(() => {
    // If Firebase is enabled, we start with empty/loading state or initial data
    // If LocalStorage, we load from LS
    if (ENABLE_FIREBASE && db) return { materials: [], users: [], requests: [] };

    const saved = localStorage.getItem('office_supply_db');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('office_supply_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // --- Effect 1: Firebase Connection (Runs ONCE on mount) ---
  useEffect(() => {
    if (ENABLE_FIREBASE && db) {
      console.log("Starting Firebase listeners...");
      
      // Auto-Seed Logic: Check if Users collection is empty, if so, inject initial data
      const checkAndSeed = async () => {
        try {
          const userSnap = await getDocs(collection(db, "users"));
          if (userSnap.empty) {
            console.log("Database is empty. Seeding initial data...");
            const batch = writeBatch(db);
            
            INITIAL_DATA.users.forEach(u => {
              const docRef = doc(collection(db, "users"), String(u.id));
              batch.set(docRef, u);
            });
            
            INITIAL_DATA.materials.forEach(m => {
               const docRef = doc(collection(db, "materials"), String(m.id));
               batch.set(docRef, m);
            });

            // Optional: Seed requests
            INITIAL_DATA.requests.forEach(r => {
               const docRef = doc(collection(db, "requests"), String(r.id));
               batch.set(docRef, r);
            });

            await batch.commit();
            console.log("Seeding complete. You can now login.");
          }
        } catch (error) {
          console.error("Error seeding database:", error);
        }
      };
      
      checkAndSeed();

      const unsubMaterials = onSnapshot(collection(db, "materials"), (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Material));
        setData(prev => ({ ...prev, materials: items }));
      });

      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
        setData(prev => ({ ...prev, users: items }));
      });

      const unsubRequests = onSnapshot(query(collection(db, "requests"), orderBy("request_date", "desc")), (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Request));
        setData(prev => ({ ...prev, requests: items }));
      });

      return () => {
        console.log("Unsubscribing from Firebase listeners...");
        unsubMaterials();
        unsubUsers();
        unsubRequests();
      };
    }
  }, []); // Empty dependency array ensures this runs once

  // --- Effect 2: LocalStorage Sync (Runs when data changes, ONLY if Firebase is OFF) ---
  useEffect(() => {
    if (!ENABLE_FIREBASE || !db) {
      localStorage.setItem('office_supply_db', JSON.stringify(data));
    }
  }, [data]);

  // --- Effect 3: User Persistence ---
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('office_supply_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('office_supply_current_user');
    }
  }, [currentUser]);

  // --- Auth Logic ---
  const login = useCallback((username: string, password: string) => {
    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  }, [data.users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  // --- Material Logic ---
  const addMaterial = useCallback(async (m: Omit<Material, 'id'>) => {
    if (ENABLE_FIREBASE && db) {
      await addDoc(collection(db, "materials"), m);
    } else {
      const newId = Date.now();
      const material = { ...m, id: newId };
      setData(prev => ({ ...prev, materials: [...prev.materials, material] }));
    }
  }, []);

  const updateMaterial = useCallback(async (m: Material) => {
    if (ENABLE_FIREBASE && db) {
       const docRef = doc(db, "materials", String(m.id));
       await updateDoc(docRef, { name: m.name, stock: m.stock, unit: m.unit });
    } else {
      setData(prev => ({
        ...prev,
        materials: prev.materials.map(item => item.id === m.id ? m : item)
      }));
    }
  }, []);

  const deleteMaterial = useCallback(async (id: number | string) => {
    if (ENABLE_FIREBASE && db) {
      await deleteDoc(doc(db, "materials", String(id)));
    } else {
      setData(prev => ({
        ...prev,
        materials: prev.materials.filter(item => item.id !== id)
      }));
    }
  }, []);

  // --- User Logic ---
  const addUser = useCallback(async (u: Omit<User, 'id'>) => {
    if (ENABLE_FIREBASE && db) {
      await addDoc(collection(db, "users"), u);
    } else {
      setData(prev => ({
        ...prev,
        users: [...prev.users, { ...u, id: Date.now() }]
      }));
    }
  }, []);

  const updateUser = useCallback(async (u: User) => {
    if (ENABLE_FIREBASE && db) {
      await updateDoc(doc(db, "users", String(u.id)), { 
        name: u.name, department: u.department, role: u.role, username: u.username, password: u.password 
      });
      if (currentUser && String(currentUser.id) === String(u.id)) setCurrentUser(u);
    } else {
      setData(prev => ({
        ...prev,
        users: prev.users.map(item => item.id === u.id ? u : item)
      }));
      if (currentUser && currentUser.id === u.id) setCurrentUser(u);
    }
  }, [currentUser]);

  const deleteUser = useCallback(async (id: number | string) => {
    if (ENABLE_FIREBASE && db) {
      await deleteDoc(doc(db, "users", String(id)));
    } else {
      setData(prev => ({
        ...prev,
        users: prev.users.filter(item => item.id !== id)
      }));
    }
  }, []);

  // --- Request Logic ---
  const createRequest = useCallback(async (userId: number | string, materialId: number | string, quantity: number) => {
    const newRequest: Omit<Request, 'id'> = {
      user_id: userId,
      material_id: materialId,
      quantity,
      request_date: new Date().toISOString(),
      status: 'PENDING'
    };

    if (ENABLE_FIREBASE && db) {
      await addDoc(collection(db, "requests"), newRequest);
    } else {
      const req = { ...newRequest, id: Date.now() };
      setData(prev => ({ ...prev, requests: [req as Request, ...prev.requests] }));
    }
  }, []);

  const updateRequestStatus = useCallback(async (requestId: number | string, status: RequestStatus): Promise<{ success: boolean; message?: string }> => {
    let success = true;
    let message = 'อัปเดตสถานะเรียบร้อย';

    // Note: In a real app, we should fetch the latest stock from DB to be atomic.
    // For this app, we rely on the synced state.
    
    // We need to find the request from current state
    // But since this is inside useCallback, we need access to 'data'.
    // However, adding 'data' to deps will re-create function.
    // So we'll use a functional state update or just access the ref if we had one.
    // For simplicity with Firebase, we can fetch the doc directly or trust the state if it's synced fast enough.
    // Here we will use the state passed in Context, which might be slightly stale in a closure, 
    // but typically fine for this scale. 
    // Better yet: Pass the logic to a component or use refs. 
    // BUT, since we are using `data` from scope, we must add it to dependency.
    // To avoid loop, we rely on the fact that `data` only updates when firebase notifies us.
    
    // Actually, to make this robust without `data` dependency causing loops in consumers:
    // We will read from the state variable which is captured in closure.
    // We have to accept that `updateRequestStatus` reference changes when `data` changes.
    // This is fine as long as `useEffect` in DbProvider doesn't depend on it.

    const req = data.requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'ไม่พบรายการเบิก' };

    if (status === 'ISSUED' && req.status !== 'ISSUED') {
      const material = data.materials.find(m => m.id === req.material_id);
      if (!material) return { success: false, message: 'ไม่พบข้อมูลวัสดุ' };

      if (material.stock < req.quantity) {
        return { success: false, message: `สต็อกไม่เพียงพอ! คงเหลือ: ${material.stock}, ต้องการเบิก: ${req.quantity}` };
      }

      // Execute Logic
      const newStock = material.stock - req.quantity;
      
      if (ENABLE_FIREBASE && db) {
        await updateDoc(doc(db, "materials", String(material.id)), { stock: newStock });
        await updateDoc(doc(db, "requests", String(requestId)), { status: status });
      } else {
        // LocalStorage Mode
        setData(prev => {
          const updatedMaterials = prev.materials.map(m => 
            m.id === req.material_id ? { ...m, stock: newStock } : m
          );
          return {
            ...prev,
            materials: updatedMaterials,
            requests: prev.requests.map(r => r.id === requestId ? { ...r, status } : r)
          };
        });
      }
    } else {
      // Just status update (Approved/Rejected)
      if (ENABLE_FIREBASE && db) {
        await updateDoc(doc(db, "requests", String(requestId)), { status: status });
      } else {
        setData(prev => ({
          ...prev,
          requests: prev.requests.map(r => r.id === requestId ? { ...r, status } : r)
        }));
      }
    }

    return { success, message };
  }, [data]); // Dependencies needed for logic

  // Memoize the context value to prevent unnecessary re-renders in consumers
  const contextValue = useMemo(() => ({
    ...data,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addUser,
    updateUser,
    deleteUser,
    createRequest,
    updateRequestStatus,
    currentUser,
    login,
    logout,
    isFirebaseEnabled: ENABLE_FIREBASE
  }), [data, addMaterial, updateMaterial, deleteMaterial, addUser, updateUser, deleteUser, createRequest, updateRequestStatus, currentUser, login, logout]);

  return (
    <DbContext.Provider value={contextValue}>
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (!context) throw new Error("useDb must be used within DbProvider");
  return context;
};
