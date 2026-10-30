import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Search,
  Shield,
  Edit2,
  UserCheck,
  UserX,
  Mail,
  GraduationCap,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { UserProfile, UserRole } from '../../types';
import { MOCK_USERS } from '../../services/firebase/authService';
import { Modal } from '../../components/common/Modal';
import { callAppsScript } from '../../services/apps-script/appsScriptApi';

export const UserManagement: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { showToast } = useNotification();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('guru');
  const [assignedClassStr, setAssignedClassStr] = useState('1');
  const [nip, setNip] = useState('');
  const [active, setActive] = useState(true);

  const loadUsers = () => {
    setLoading(true);
    try {
      const cached = localStorage.getItem('school_users');
      if (cached) {
        const parsed: Record<string, UserProfile> = JSON.parse(cached);
        setUsers(Object.values(parsed));
      } else {
        setUsers(Object.values(MOCK_USERS));
        localStorage.setItem('school_users', JSON.stringify(MOCK_USERS));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setRole('guru');
    setAssignedClassStr('1');
    setNip('');
    setActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (target: UserProfile) => {
    setSelectedUser(target);
    setName(target.name);
    setEmail(target.email);
    setRole(target.role);
    setAssignedClassStr(target.assignedClasses.join(', '));
    setNip(target.nip || '');
    setActive(target.active);
    setIsModalOpen(true);
  };

  const handleToggleActive = (target: UserProfile) => {
    if (target.email === user?.email) {
      showToast('error', 'Tindakan Ditolak', 'Anda tidak dapat menonaktifkan akun Anda sendiri!');
      return;
    }

    const cached = localStorage.getItem('school_users');
    const userMap: Record<string, UserProfile> = cached ? JSON.parse(cached) : { ...MOCK_USERS };
    if (userMap[target.email.toLowerCase()]) {
      userMap[target.email.toLowerCase()].active = !target.active;
      localStorage.setItem('school_users', JSON.stringify(userMap));
      loadUsers();
      showToast('success', 'Status Berubah', `Akun ${target.name} kini ${!target.active ? 'Aktif' : 'Nonaktif'}.`);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama dan email wajib diisi.');
      return;
    }

    const classesArray = assignedClassStr
      .split(',')
      .map(c => c.trim())
      .filter(c => ['1', '2', '3', '4', '5', '6'].includes(c));

    const newUserObj: UserProfile = {
      uid: selectedUser ? selectedUser.uid : 'usr_' + Date.now().toString(36),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      assignedClasses: role === 'guru' ? (classesArray.length > 0 ? classesArray : ['1']) : ['1', '2', '3', '4', '5', '6'],
      nip: nip.trim(),
      active: active,
    };

    const cached = localStorage.getItem('school_users');
    const userMap: Record<string, UserProfile> = cached ? JSON.parse(cached) : { ...MOCK_USERS };
    userMap[newUserObj.email] = newUserObj;
    localStorage.setItem('school_users', JSON.stringify(userMap));

    // Also sync to Google Sheets via Apps Script
    callAppsScript('saveUser', {
      User_ID: newUserObj.uid,
      Nama: newUserObj.name,
      Email: newUserObj.email,
      Role: newUserObj.role,
      Kelas_Ditugaskan: newUserObj.assignedClasses.join(', '),
      Status: newUserObj.active ? 'Aktif' : 'Nonaktif',
    }).catch(e => console.warn('Sync user to sheets warning:', e));

    showToast('success', 'Akun Disimpan', `Pengguna ${newUserObj.name} berhasil disimpan.`);
    setIsModalOpen(false);
    loadUsers();
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Pengguna & Guru</h2>
          <p className="text-xs text-slate-500">
            Kelola akun sistem, penetapan guru kelas tugas (1–6), dan status aktivasi
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nama pengguna atau email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-school-lightBlue focus:outline-hidden"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Total Pengguna: <strong>{filteredUsers.length}</strong>
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 text-center w-12">No.</th>
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Email Login</th>
                <th className="py-3 px-4 text-center">Peran</th>
                <th className="py-3 px-4 text-center">Kelas Tugas</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((item, idx) => {
                const roleBadge = {
                  admin: 'bg-rose-50 text-rose-700 border-rose-200',
                  guru: 'bg-blue-50 text-blue-700 border-blue-200',
                  kepsek: 'bg-purple-50 text-purple-700 border-purple-200',
                }[item.role];

                return (
                  <tr key={item.uid} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      {item.nip && <div className="text-[10px] text-slate-400">NIP: {item.nip}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{item.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border capitalize ${roleBadge}`}>
                        {item.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-school-navy">
                      {item.role === 'guru'
                        ? (item.assignedClasses.length > 0 ? `Kelas ${item.assignedClasses.join(', ')}` : 'Belum Ditugaskan')
                        : 'Semua Kelas'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${item.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {item.active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`p-1.5 rounded-lg transition ${item.active ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={item.active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          {item.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Nama Lengkap & Gelar *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Siti Aminah, S.Pd."
              className="w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-school-lightBlue"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Email Login *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={Boolean(selectedUser)}
              placeholder="nama@sekolah.sch.id"
              className="w-full px-3 py-2 rounded-xl border text-xs disabled:bg-slate-100"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">NIP (Opsional)</label>
            <input
              type="text"
              value={nip}
              onChange={e => setNip(e.target.value)}
              placeholder="19850314 200902 2 003"
              className="w-full px-3 py-2 rounded-xl border text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Peran Akses</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl border text-xs bg-white font-medium"
              >
                <option value="guru">Guru Kelas</option>
                <option value="admin">Administrator</option>
                <option value="kepsek">Kepala Sekolah</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Status Akun</label>
              <select
                value={active ? 'Aktif' : 'Nonaktif'}
                onChange={e => setActive(e.target.value === 'Aktif')}
                className="w-full px-3 py-2 rounded-xl border text-xs bg-white font-medium"
              >
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          {role === 'guru' && (
            <div>
              <label className="block font-semibold mb-1">
                Kelas Tugas Guru (Pisahkan koma jika lebih dari satu: contoh 1, 2)
              </label>
              <input
                type="text"
                value={assignedClassStr}
                onChange={e => setAssignedClassStr(e.target.value)}
                placeholder="Contoh: 1 atau 1, 2"
                className="w-full px-3 py-2 rounded-xl border text-xs font-bold text-school-navy"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Guru hanya berhak mengelola data siswa, absensi, dan nilai pada kelas yang ditugaskan di sini.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-school-navy text-white font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Akun</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
