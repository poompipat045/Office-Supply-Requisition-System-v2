
import React, { useState, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ClipboardList, 
  PlusCircle, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Box, 
  ShoppingCart, 
  Lock, 
  User as UserIcon, 
  ArrowUpDown, 
  Download,
  List
} from 'lucide-react';
import { DbProvider, useDb } from './services/db';
import { Material, RequestStatus, User } from './types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Shared Components ---

const StatusBadge = ({ status }: { status: RequestStatus }) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    ISSUED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  const labels: Record<RequestStatus, string> = {
    PENDING: 'รอดำเนินการ',
    APPROVED: 'อนุมัติแล้ว',
    ISSUED: 'จ่ายวัสดุแล้ว',
    REJECTED: 'ไม่อนุมัติ',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
      {labels[status]}
    </span>
  );
};

// --- Pages ---

const LoginPage = () => {
  const { login } = useDb();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-indigo-100 rounded-full">
            <Box size={40} className="text-indigo-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">เข้าสู่ระบบ</h2>
        <p className="text-center text-gray-500 mb-6">ระบบเบิกจ่ายวัสดุสำนักงาน</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้งาน (Username)</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input 
                type="text" 
                required
                className="pl-10 block w-full rounded-lg border-gray-300 border bg-gray-50 p-2.5 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="เช่น admin"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน (Password)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input 
                type="password" 
                required
                className="pl-10 block w-full rounded-lg border-gray-300 border bg-gray-50 p-2.5 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm">
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { materials, requests } = useDb();
  
  const lowStockItems = materials.filter(m => m.stock < 10).length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  
  const chartData = materials.map(m => ({
    name: m.name,
    คงเหลือ: m.stock
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">ภาพรวมระบบ (Overview)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">จำนวนวัสดุทั้งหมด</p>
              <p className="text-2xl font-bold">{materials.length} รายการ</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">รายการรออนุมัติ</p>
              <p className="text-2xl font-bold">{pendingRequests} รายการ</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <Box size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">วัสดุใกล้หมด</p>
              <p className="text-2xl font-bold text-red-600">{lowStockItems} รายการ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">ปริมาณสต็อกปัจจุบัน</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="คงเหลือ" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const InventoryManager = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial } = useDb();
  const [isEditing, setIsEditing] = useState<Material | null>(null);
  const [formData, setFormData] = useState({ name: '', stock: 0, unit: '' });
  
  // Sorting and Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Material; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState({ name: '', stock: '', unit: '' });
  
  // Data Processing
  const processedMaterials = useMemo(() => {
    let result = [...materials];

    // Filter
    if (filters.name) result = result.filter(m => m.name.toLowerCase().includes(filters.name.toLowerCase()));
    if (filters.stock) result = result.filter(m => m.stock.toString().includes(filters.stock));
    if (filters.unit) result = result.filter(m => m.unit.toLowerCase().includes(filters.unit.toLowerCase()));

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [materials, sortConfig, filters]);

  const handleSort = (key: keyof Material) => {
    setSortConfig(current => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ["ID", "Name", "Stock", "Unit"];
    const rows = processedMaterials.map(m => [m.id, m.name, m.stock, m.unit]);
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for Excel thai support
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await updateMaterial({ ...isEditing, ...formData });
      setIsEditing(null);
    } else {
      await addMaterial(formData);
    }
    setFormData({ name: '', stock: 0, unit: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">จัดการคลังวัสดุ (Inventory)</h2>
        <div className="flex space-x-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm text-sm"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-lg font-semibold mb-4">{isEditing ? 'แก้ไขข้อมูลวัสดุ' : 'เพิ่มวัสดุใหม่'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ชื่อวัสดุ</label>
              <input 
                type="text" 
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="เช่น ปากกา, กระดาษ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">จำนวนคงเหลือ</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">หน่วยนับ</label>
                <input 
                  type="text" 
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  placeholder="เช่น ด้าม, กล่อง"
                />
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition">
                {isEditing ? 'บันทึกแก้ไข' : 'เพิ่มข้อมูล'}
              </button>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={() => { setIsEditing(null); setFormData({ name: '', stock: 0, unit: '' }); }}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* ID Column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-gray-700 font-bold">
                        รหัส <ArrowUpDown size={12} />
                      </button>
                    </div>
                  </th>
                  
                  {/* Name Column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex flex-col gap-2">
                      <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-700 font-bold">
                        ชื่อวัสดุ <ArrowUpDown size={12} />
                      </button>
                      <input 
                        type="text" 
                        placeholder="ค้นหาชื่อ..." 
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
                        value={filters.name}
                        onChange={(e) => handleFilterChange('name', e.target.value)}
                      />
                    </div>
                  </th>

                  {/* Stock Column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                     <div className="flex flex-col gap-2">
                      <button onClick={() => handleSort('stock')} className="flex items-center gap-1 hover:text-gray-700 font-bold">
                        คงเหลือ <ArrowUpDown size={12} />
                      </button>
                      <input 
                        type="text" 
                        placeholder="ค้นหา..." 
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
                        value={filters.stock}
                        onChange={(e) => handleFilterChange('stock', e.target.value)}
                      />
                    </div>
                  </th>

                  {/* Unit Column */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                     <div className="flex flex-col gap-2">
                      <button onClick={() => handleSort('unit')} className="flex items-center gap-1 hover:text-gray-700 font-bold">
                        หน่วย <ArrowUpDown size={12} />
                      </button>
                      <input 
                        type="text" 
                        placeholder="ค้นหา..." 
                        className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
                        value={filters.unit}
                        onChange={(e) => handleFilterChange('unit', e.target.value)}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24 align-top pt-4">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedMaterials.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{m.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`${m.stock < 10 ? 'text-red-600 font-bold' : ''}`}>{m.stock}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => { setIsEditing(m); setFormData({ name: m.name, stock: m.stock, unit: m.unit }); }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          แก้ไข
                        </button>
                        <button 
                          onClick={() => deleteMaterial(m.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {processedMaterials.length === 0 && <div className="p-6 text-center text-gray-500">ไม่พบข้อมูลที่ค้นหา</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const UserInventory = () => {
  const { materials } = useDb();
  
  // Sorting and Filtering State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Material; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState({ name: '', stock: '', unit: '' });
  
  // Data Processing
  const processedMaterials = useMemo(() => {
    let result = [...materials];

    // Filter
    if (filters.name) result = result.filter(m => m.name.toLowerCase().includes(filters.name.toLowerCase()));
    if (filters.stock) result = result.filter(m => m.stock.toString().includes(filters.stock));
    if (filters.unit) result = result.filter(m => m.unit.toLowerCase().includes(filters.unit.toLowerCase()));

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [materials, sortConfig, filters]);

  const handleSort = (key: keyof Material) => {
    setSortConfig(current => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">รายการวัสดุทั้งหมด (Inventory)</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* ID Column */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-gray-700 font-bold">
                      รหัส <ArrowUpDown size={12} />
                    </button>
                  </div>
                </th>
                
                {/* Name Column */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-gray-700 font-bold">
                      ชื่อวัสดุ <ArrowUpDown size={12} />
                    </button>
                    <input 
                      type="text" 
                      placeholder="ค้นหาชื่อ..." 
                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
                      value={filters.name}
                      onChange={(e) => handleFilterChange('name', e.target.value)}
                    />
                  </div>
                </th>

                {/* Stock Column */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                   <div className="flex flex-col gap-2">
                    <button onClick={() => handleSort('stock')} className="flex items-center gap-1 hover:text-gray-700 font-bold">
                      คงเหลือ <ArrowUpDown size={12} />
                    </button>
                    <input 
                      type="text" 
                      placeholder="ค้นหา..." 
                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
                      value={filters.stock}
                      onChange={(e) => handleFilterChange('stock', e.target.value)}
                    />
                  </div>
                </th>

                {/* Unit Column */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                   <div className="flex flex-col gap-2">
                    <button onClick={() => handleSort('unit')} className="flex items-center gap-1 hover:text-gray-700 font-bold">
                      หน่วย <ArrowUpDown size={12} />
                    </button>
                    <input 
                      type="text" 
                      placeholder="ค้นหา..." 
                      className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-normal"
                      value={filters.unit}
                      onChange={(e) => handleFilterChange('unit', e.target.value)}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedMaterials.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{m.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`${m.stock < 10 ? 'text-red-600 font-bold' : ''}`}>{m.stock}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {processedMaterials.length === 0 && <div className="p-6 text-center text-gray-500">ไม่พบข้อมูลที่ค้นหา</div>}
        </div>
      </div>
    </div>
  );
};

const RequestQueue = () => {
  const { requests, users, materials, updateRequestStatus } = useDb();
  
  // UseMemo for sorting to prevent re-calc on every render
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return new Date(b.request_date).getTime() - new Date(a.request_date).getTime();
    });
  }, [requests]);

  const handleAction = async (id: number | string, action: RequestStatus) => {
    const result = await updateRequestStatus(id, action);
    if (!result.success) {
      alert(result.message);
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "User", "Department", "Material", "Quantity", "Unit", "Date", "Status"];
    const rows = sortedRequests.map(r => {
       const user = users.find(u => u.id === r.user_id);
       const item = materials.find(m => m.id === r.material_id);
       return [
         r.id,
         `"${user?.name || 'Unknown'}"`,
         `"${user?.department || '-'}"`,
         `"${item?.name || 'Unknown'}"`,
         r.quantity,
         `"${item?.unit || '-'}"`,
         `"${new Date(r.request_date).toLocaleDateString('th-TH')}"`,
         r.status
       ];
    });

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "requests_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">รายการเบิกวัสดุ (Request Queue)</h2>
        <div className="flex space-x-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm text-sm"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เลขที่เบิก</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้เบิก</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRequests.map((r) => {
                const user = users.find(u => u.id === r.user_id);
                const item = materials.find(m => m.id === r.material_id);
                
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{r.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user?.name || 'Unknown'} <span className="text-gray-400 font-normal">({user?.department})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.quantity} {item?.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(r.request_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleAction(r.id, 'APPROVED')} className="text-blue-600 hover:text-blue-900" title="อนุมัติ">
                            <CheckCircle size={18} />
                          </button>
                          <button onClick={() => handleAction(r.id, 'REJECTED')} className="text-red-600 hover:text-red-900" title="ปฏิเสธ">
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <button onClick={() => handleAction(r.id, 'ISSUED')} className="text-green-600 hover:text-green-900 flex items-center ml-auto gap-1">
                          <Package size={16} /> จ่ายของ
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedRequests.length === 0 && <div className="p-6 text-center text-gray-500">ไม่มีรายการเบิก</div>}
        </div>
      </div>
    </div>
  );
};

const UserPortal = () => {
  const { materials, currentUser, createRequest, requests } = useDb();
  const [selectedMaterial, setSelectedMaterial] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);

  if (!currentUser) return <div>กรุณาเข้าสู่ระบบ</div>;

  const myRequests = useMemo(() => {
    return requests
      .filter(r => r.user_id === currentUser.id)
      .sort((a,b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
  }, [requests, currentUser.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMaterial && quantity > 0) {
      await createRequest(currentUser.id, Number(selectedMaterial), quantity);
      setSelectedMaterial('');
      setQuantity(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">ระบบเบิกของฉัน (My Portal)</h2>
        <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{currentUser.department}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Request Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-indigo-600"/> ขอเบิกวัสดุใหม่
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">เลือกรายการวัสดุ</label>
              <select 
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                value={selectedMaterial}
                onChange={e => setSelectedMaterial(Number(e.target.value))}
              >
                <option value="">-- กรุณาเลือก --</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} (คงเหลือ: {m.stock} {m.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">จำนวนที่ต้องการ</label>
              <input 
                type="number" 
                min="1"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium">
              ส่งใบเบิก
            </button>
          </form>
        </div>

        {/* History */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">ประวัติการเบิกของฉัน</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {myRequests.map((r) => {
                   const item = materials.find(m => m.id === r.material_id);
                   return (
                    <tr key={r.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.quantity} {item?.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.request_date).toLocaleDateString('th-TH')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
            {myRequests.length === 0 && <div className="p-6 text-center text-gray-500">คุณยังไม่มีประวัติการเบิก</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManager = () => {
  const { users, addUser, updateUser, deleteUser } = useDb();
  const [isEditing, setIsEditing] = useState<User | null>(null);
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    name: '', 
    department: '', 
    role: 'USER' as 'USER' | 'ADMIN' 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await updateUser({ ...isEditing, ...formData });
      setIsEditing(null);
    } else {
      // Check for duplicate username
      if (users.some(u => u.username === formData.username)) {
        alert("Username นี้มีผู้ใช้งานแล้ว");
        return;
      }
      await addUser(formData);
    }
    setFormData({ username: '', password: '', name: '', department: '', role: 'USER' });
  };

  const handleEditClick = (u: User) => {
    setIsEditing(u);
    setFormData({
      username: u.username,
      password: u.password,
      name: u.name,
      department: u.department,
      role: u.role
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({ username: '', password: '', name: '', department: '', role: 'USER' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน (User Management)</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h3 className="text-lg font-semibold mb-4">{isEditing ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700">Username</label>
               <input type="text" required className="w-full mt-1 p-2 border rounded-md" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">Password</label>
               <input type="text" required className="w-full mt-1 p-2 border rounded-md" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
               <input type="text" required className="w-full mt-1 p-2 border rounded-md" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">แผนก</label>
               <input type="text" required className="w-full mt-1 p-2 border rounded-md" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700">บทบาท</label>
               <select className="w-full mt-1 p-2 border rounded-md" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                 <option value="USER">พนักงานทั่วไป (User)</option>
                 <option value="ADMIN">ผู้ดูแลระบบ (Admin)</option>
               </select>
             </div>
             
             <div className="flex space-x-2 pt-2">
               <button className="flex-1 bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition">
                 {isEditing ? 'บันทึกแก้ไข' : 'บันทึก'}
               </button>
               {isEditing && (
                 <button type="button" onClick={handleCancel} className="bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition">
                   ยกเลิก
                 </button>
               )}
             </div>
          </form>
         </div>

         <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อ</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">แผนก</th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">บทบาท</th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-indigo-600">{u.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{u.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button onClick={() => handleEditClick(u)} className="text-indigo-600 hover:text-indigo-900 mr-3">แก้ไข</button>
                        {u.role !== 'ADMIN' && <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:text-red-900">ลบ</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
         </div>
      </div>
    </div>
  );
};

// --- Layout & Main App ---

const Sidebar = () => {
  const { currentUser, logout } = useDb();
  const location = useLocation();
  const isAdmin = currentUser?.role === 'ADMIN';

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          active ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col fixed left-0 top-0 overflow-y-auto z-10">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Box className="text-indigo-400" /> ระบบเบิกจ่ายวัสดุสำนักงาน
        </h1>
        <p className="text-xs text-gray-500 mt-1">งานสนับสนุนการศึกษา</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {isAdmin && (
          <>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2 pl-4">ผู้ดูแลระบบ (Admin)</div>
            <NavItem to="/" icon={LayoutDashboard} label="ภาพรวม" />
            <NavItem to="/inventory" icon={Package} label="คลังวัสดุ" />
            <NavItem to="/requests" icon={ClipboardList} label="รายการเบิก" />
            <NavItem to="/users" icon={Users} label="ผู้ใช้งาน" />
          </>
        )}

        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 pl-4">พนักงาน (User)</div>
        <NavItem to="/my-portal" icon={PlusCircle} label="เบิกวัสดุ" />
        <NavItem to="/user-inventory" icon={List} label="รายการวัสดุ" />
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-white truncate text-sm">{currentUser?.name}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser?.department}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white py-2 px-4 rounded-lg transition-all text-sm font-medium"
        >
          <LogOut size={16} />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
};

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <Sidebar />
      <main className="p-8 max-w-7xl mx-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryManager />} />
          <Route path="/requests" element={<RequestQueue />} />
          <Route path="/users" element={<UserManager />} />
          <Route path="/my-portal" element={<UserPortal />} />
          <Route path="/user-inventory" element={<UserInventory />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <DbProvider>
      <HashRouter>
        <AuthWrapper />
      </HashRouter>
    </DbProvider>
  );
};

const AuthWrapper = () => {
  const { currentUser } = useDb();
  
  if (!currentUser) {
    return <LoginPage />;
  }

  return <MainLayout />;
}

export default App;
