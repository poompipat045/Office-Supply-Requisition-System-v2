
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  addMaterial: (m: Omit<Material, 'id'>) => void;
  updateMaterial: (m: Material) => void;
  deleteMaterial: (id: number | string) => void;
  
  addUser: (u: Omit<User, 'id'>) => void;
  updateUser: (u: User) => void;
  deleteUser: (id: number | string) => void;
  
  createRequest: (userId: number | string, materialId: number | string, quantity: number) => void;
  updateRequestStatus: (requestId: number | string, status: RequestStatus) => { success: boolean; message?: string };
  
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

  // --- Firebase Sync Logic & Seeding ---
  useEffect(() => {
    if (ENABLE_FIREBASE && db) {
      console.log("Connecting to Firebase...");
      
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
        unsubMaterials();
        unsubUsers();
        unsubRequests();
      };
    } else {
      // LocalStorage persistence
      localStorage.setItem('office_supply_db', JSON.stringify(data));
    }
  }, [data, ENABLE_FIREBASE]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('office_supply_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('office_supply_current_user');
    }
  }, [currentUser]);

  // --- Auth Logic ---
  const login = (username: string, password: string) => {
    const user = data.users.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // --- Material Logic ---
  const addMaterial = async (m: Omit<Material, 'id'>) => {
    if (ENABLE_FIREBASE && db) {
      await addDoc(collection(db, "materials"), m);
    } else {
      const newId = Date.now();
      const material = { ...m, id: newId };
      setData(prev => ({ ...prev, materials: [...prev.materials, material] }));
    }
  };

  const updateMaterial = async (m: Material) => {
    if (ENABLE_FIREBASE && db) {
       const docRef = doc(db, "materials", String(m.id));
       await updateDoc(docRef, { name: m.name, stock: m.stock, unit: m.unit });
    } else {
      setData(prev => ({
        ...prev,
        materials: prev.materials.map(item => item.id === m.id ? m : item)
      }));
    }
  };

  const deleteMaterial = async (id: number | string) => {
    if (ENABLE_FIREBASE && db) {
      await deleteDoc(doc(db, "materials", String(id)));
    } else {
      setData(prev => ({
        ...prev,
        materials: prev.materials.filter(item => item.id !== id)
      }));
    }
  };

  // --- User Logic ---
  const addUser = async (u: Omit<User, 'id'>) => {
    if (ENABLE_FIREBASE && db) {
      await addDoc(collection(db, "users"), u);
    } else {
      setData(prev => ({
        ...prev,
        users: [...prev.users, { ...u, id: Date.now() }]
      }));
    }
  };

  const updateUser = async (u: User) => {
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
  };

  const deleteUser = async (id: number | string) => {
    if (ENABLE_FIREBASE && db) {
      await deleteDoc(doc(db, "users", String(id)));
    } else {
      setData(prev => ({
        ...prev,
        users: prev.users.filter(item => item.id !== id)
      }));
    }
  };

  // --- Request Logic ---
  const createRequest = async (userId: number | string, materialId: number | string, quantity: number) => {
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
  };

  const updateRequestStatus = (requestId: number | string, status: RequestStatus): { success: boolean; message?: string } => {
    let success = true;
    let message = 'อัปเดตสถานะเรียบร้อย';

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
        updateDoc(doc(db, "materials", String(material.id)), { stock: newStock });
        updateDoc(doc(db, "requests", String(requestId)), { status: status });
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
        updateDoc(doc(db, "requests", String(requestId)), { status: status });
      } else {
        setData(prev => ({
          ...prev,
          requests: prev.requests.map(r => r.id === requestId ? { ...r, status } : r)
        }));
      }
    }

    return { success, message };
  };

  return (
    <DbContext.Provider value={{
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
    }}>
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => {
  const context = useContext(DbContext);
  if (!context) throw new Error("useDb must be used within DbProvider");
  return context;
};
