import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Edit2,
  Eye,
  UserX,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSchool } from '../../contexts/SchoolContext';
import { useNotification } from '../../contexts/NotificationContext';
import { getFirestoreStudents, saveFirestoreStudent, logAuditEvent } from '../../services/firebase/firestoreService';
import { exportToExcel } from '../../services/export/excelExport';
import { exportToCSV } from '../../services/export/csvExport';
import { Student, StudentStatus, Gender } from '../../types';
import { Modal } from '../../components/common/Modal';
import { formatDateIndo } from '../../utils/formatters';

export const StudentList: React.FC = () => {
  const { user, isAdmin, isTeacher, canAccessClass } = useAuth();
  const { schoolProfile } = useSchool();
  const { showToast } = useNotification();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (isTeacher && user && user.assignedClasses.length > 0) {
      return user.assignedClasses[0];
    }
    return 'ALL';
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('Aktif');

  // Modal States
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    nis: '',
    nisn: '',
    gender: 'Laki-laki',
    birthPlace: '',
    birthDate: '2018-01-01',
    parentName: '',
    address: '',
    class: isTeacher && user ? user.assignedClasses[0] || '1' : '1',
    schoolYear: schoolProfile?.academicYear || '2026/2027',
    status: 'Aktif',
  });

  const [deactivateReason, setDeactivateReason] = useState('');
  const [newDeactivateStatus, setNewDeactivateStatus] = useState<StudentStatus>('Nonaktif');

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await getFirestoreStudents();
      setStudents(data);
    } catch (e: any) {
      showToast('error', 'Gagal Memuat Data', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Filter students based on role and selected controls
  const visibleStudents = students.filter(s => {
    // 1. RBAC class restriction for teachers
    if (isTeacher && !canAccessClass(s.class)) {
      return false;
    }
    // 2. Class dropdown filter
    if (selectedClass !== 'ALL' && s.class !== selectedClass) {
      return false;
    }
    // 3. Status filter
    if (selectedStatus !== 'ALL' && s.status !== selectedStatus) {
      return false;
    }
    // 4. Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchNis = s.nis.toLowerCase().includes(q);
      const matchNisn = s.nisn.toLowerCase().includes(q);
      return matchName || matchNis || matchNisn;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setFormData({
      name: '',
      nis: '',
      nisn: '',
      gender: 'Laki-laki',
      birthPlace: '',
      birthDate: '2018-01-01',
      parentName: '',
      address: '',
      class: isTeacher && user ? user.assignedClasses[0] || '1' : '1',
      schoolYear: schoolProfile?.academicYear || '2026/2027',
      status: 'Aktif',
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    if (!canAccessClass(student.class)) {
      showToast('error', 'Akses Ditolak', 'Anda hanya berhak mengelola siswa di kelas tugas Anda.');
      return;
    }
    setSelectedStudent(student);
    setFormData({ ...student });
    setIsAddEditModalOpen(true);
  };

  const handleOpenDetail = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailModalOpen(true);
  };

  const handleOpenDeactivate = (student: Student) => {
    if (!canAccessClass(student.class)) {
      showToast('error', 'Akses Ditolak', 'Anda tidak berwenang menonaktifkan siswa kelas ini.');
      return;
    }
    setSelectedStudent(student);
    setDeactivateReason('');
    setNewDeactivateStatus('Nonaktif');
    setIsDeactivateModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast('error', 'Validasi Gagal', 'Nama lengkap siswa wajib diisi');
      return;
    }

    if (!canAccessClass(formData.class || '1')) {
      showToast('error', 'Akses Ditolak', 'Anda tidak memiliki hak akses untuk kelas tersebut');
      return;
    }

    try {
      const studentId = selectedStudent
        ? selectedStudent.studentId
        : `SD-${formData.class}-${formData.nis || Date.now().toString().slice(-6)}`;

      const newStudent: Student = {
        studentId: studentId,
        nis: formData.nis || '',
        nisn: formData.nisn || '',
        name: formData.name.trim(),
        gender: formData.gender as Gender,
        birthPlace: formData.birthPlace || '',
        birthDate: formData.birthDate || '',
        parentName: formData.parentName || '',
        address: formData.address || '',
        class: formData.class || '1',
        schoolYear: formData.schoolYear || schoolProfile?.academicYear || '2026/2027',
        status: (formData.status as StudentStatus) || 'Aktif',
        photoURL: formData.photoURL || '',
        createdAt: selectedStudent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: selectedStudent?.source || 'web',
        syncStatus: 'pending',
      };

      await saveFirestoreStudent(newStudent);
      await logAuditEvent(
        user,
        selectedStudent ? 'UPDATE_SISWA' : 'TAMBAH_SISWA',
        'Student',
        studentId,
        `${selectedStudent ? 'Mengubah' : 'Menambah'} siswa: ${newStudent.name} (Kelas ${newStudent.class})`
      );

      showToast(
        'success',
        selectedStudent ? 'Siswa Diperbarui' : 'Siswa Ditambahkan',
        `Data ${newStudent.name} berhasil disimpan.`
      );

      setIsAddEditModalOpen(false);
      loadStudents();
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan', err.message);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedStudent) return;
    try {
      const updated: Student = {
        ...selectedStudent,
        status: newDeactivateStatus,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      await saveFirestoreStudent(updated);
      await logAuditEvent(
        user,
        'MUTASI_SISWA',
        'Student',
        selectedStudent.studentId,
        `Status diubah ke ${newDeactivateStatus}. Alasan: ${deactivateReason || '-'}`
      );

      showToast('success', 'Status Berhasil Diubah', `Siswa kini berstatus ${newDeactivateStatus}.`);
      setIsDeactivateModalOpen(false);
      loadStudents();
    } catch (err: any) {
      showToast('error', 'Gagal Mengubah Status', err.message);
    }
  };

  const handleExportExcel = () => {
    const exportData = visibleStudents.map((s, idx) => ({
      'No.': idx + 1,
      'ID Siswa': s.studentId,
      'NIS': s.nis,
      'NISN': s.nisn,
      'Nama Siswa': s.name,
      'L/P': s.gender,
      'Tempat Lahir': s.birthPlace,
      'Tanggal Lahir': s.birthDate,
      'Nama Orang Tua': s.parentName,
      'Alamat': s.address,
      'Kelas': s.class,
      'Tahun Pelajaran': s.schoolYear,
      'Status': s.status,
    }));
    exportToExcel(exportData, `Daftar_Siswa_Kelas_${selectedClass}_${new Date().toISOString().slice(0, 10)}`);
  };

  const handleExportCSV = () => {
    const exportData = visibleStudents.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      NISN: s.nisn,
      Nama: s.name,
      JK: s.gender,
      Kelas: s.class,
      Status: s.status,
    }));
    exportToCSV(exportData, `Daftar_Siswa_Kelas_${selectedClass}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Printable School Header (Only visible in Print) */}
      <div className="hidden print:block border-b-2 border-black pb-3 mb-4 text-center">
        <h2 className="text-xl font-bold uppercase">{schoolProfile?.name || 'SD NEGERI 01 CEMARA INDAH'}</h2>
        <p className="text-xs">{schoolProfile?.address || 'Jl. Pendidikan No. 45'}</p>
        <p className="text-xs font-semibold mt-1">DAFTAR SISWA ROMBONGAN BELAJAR KELAS {selectedClass === 'ALL' ? '1–6' : selectedClass}</p>
        <p className="text-[10px] text-slate-500">Tahun Pelajaran: {schoolProfile?.academicYear} | Tanggal Cetak: {formatDateIndo(new Date())}</p>
      </div>

      {/* Top Action Bar (Screen Only) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Data Siswa</h2>
          <p className="text-xs text-slate-500">
            {isTeacher
              ? `Pengelolaan siswa binaan Kelas ${user?.assignedClasses.join(', ')}`
              : 'Daftar seluruh siswa aktif, nonaktif, dan riwayat mutasi kelas 1 sampai 6'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Student Button (Admin and Assigned Teachers) */}
          {(isAdmin || isTeacher) && (
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-school-navy text-white text-xs font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
          )}

          {/* Export Dropdown Buttons */}
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
            title="Ekspor Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
            title="Ekspor CSV"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs"
            title="Cetak A4"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap gap-3 items-center justify-between print:hidden">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa, NIS, atau NISN..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-school-lightBlue focus:outline-hidden"
          />
        </div>

        {/* Filter Kelas */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Kelas:</span>
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            disabled={isTeacher && user?.assignedClasses.length === 1}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-school-lightBlue bg-white disabled:bg-slate-100"
          >
            {isAdmin && <option value="ALL">Semua Kelas (1–6)</option>}
            <option value="1">Kelas 1</option>
            <option value="2">Kelas 2</option>
            <option value="3">Kelas 3</option>
            <option value="4">Kelas 4</option>
            <option value="5">Kelas 5</option>
            <option value="6">Kelas 6</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-school-lightBlue bg-white"
          >
            <option value="ALL">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Pindah">Pindah</option>
            <option value="Lulus">Lulus</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Menampilkan: <strong>{visibleStudents.length}</strong> siswa
        </span>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 text-center w-12">No.</th>
                <th className="py-3 px-4">NIS / NISN</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4 text-center">L/P</th>
                <th className="py-3 px-4 text-center">Kelas</th>
                <th className="py-3 px-4">Nama Orang Tua</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : visibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Tidak ada data siswa ditemukan</p>
                    <p className="text-[11px] mt-0.5">Coba sesuaikan kata kunci pencarian atau filter kelas.</p>
                  </td>
                </tr>
              ) : (
                visibleStudents.map((student, idx) => {
                  const statusColors: Record<StudentStatus, string> = {
                    Aktif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Pindah: 'bg-amber-50 text-amber-700 border-amber-200',
                    Lulus: 'bg-blue-50 text-blue-700 border-blue-200',
                    Nonaktif: 'bg-rose-50 text-rose-700 border-rose-200',
                  };

                  return (
                    <tr key={student.studentId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        <div>{student.nis || '-'}</div>
                        <div className="text-[10px] text-slate-400">{student.nisn || '-'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-[10px] text-slate-400">{student.birthPlace}, {student.birthDate}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${student.gender === 'Laki-laki' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                          {student.gender === 'Laki-laki' ? 'L' : 'P'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-school-navy">
                        Kelas {student.class}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{student.parentName || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[student.status]}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(student)}
                            className="p-1.5 text-slate-500 hover:text-school-blue hover:bg-blue-50 rounded-lg transition"
                            title="Detail Siswa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(isAdmin || (isTeacher && canAccessClass(student.class))) && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(student)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Edit Siswa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDeactivate(student)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Nonaktifkan / Mutasi"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isAddEditModalOpen}
        onClose={() => setIsAddEditModalOpen(false)}
        title={selectedStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Masukkan nama lengkap siswa"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-school-lightBlue"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NIS (Nomor Induk Siswa)</label>
              <input
                type="text"
                value={formData.nis || ''}
                onChange={e => setFormData({ ...formData, nis: e.target.value })}
                placeholder="Contoh: 1001"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NISN (Nomor Induk Siswa Nasional)</label>
              <input
                type="text"
                value={formData.nisn || ''}
                onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                placeholder="10 digit nomor NISN"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={formData.gender || 'Laki-laki'}
                onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
              <select
                value={formData.class || '1'}
                onChange={e => setFormData({ ...formData, class: e.target.value })}
                disabled={isTeacher && user?.assignedClasses.length === 1}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-100"
              >
                <option value="1">Kelas 1</option>
                <option value="2">Kelas 2</option>
                <option value="3">Kelas 3</option>
                <option value="4">Kelas 4</option>
                <option value="5">Kelas 5</option>
                <option value="6">Kelas 6</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={formData.birthPlace || ''}
                onChange={e => setFormData({ ...formData, birthPlace: e.target.value })}
                placeholder="Kota kelahiran"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.birthDate || ''}
                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
              <input
                type="text"
                value={formData.parentName || ''}
                onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="Nama ayah / ibu / wali"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
              <textarea
                value={formData.address || ''}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Alamat domisili lengkap"
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddEditModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-school-navy text-white font-semibold rounded-xl hover:bg-school-blue transition flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Data</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detail Siswa Lengkap"
        maxWidth="md"
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-4 bg-slate-50 rounded-2xl border flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-school-navy text-white text-xl font-bold flex items-center justify-center">
                {selectedStudent.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{selectedStudent.name}</h3>
                <p className="text-slate-500 font-mono">NIS: {selectedStudent.nis || '-'} | NISN: {selectedStudent.nisn || '-'}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold text-[10px]">
                  Kelas {selectedStudent.class} ({selectedStudent.status})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Jenis Kelamin</span>
                <span className="font-medium">{selectedStudent.gender}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Tempat, Tgl Lahir</span>
                <span className="font-medium">{selectedStudent.birthPlace || '-'}, {selectedStudent.birthDate || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Nama Orang Tua</span>
                <span className="font-medium">{selectedStudent.parentName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Tahun Pelajaran</span>
                <span className="font-medium">{selectedStudent.schoolYear}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] font-semibold">Alamat</span>
                <span className="font-medium">{selectedStudent.address || '-'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Deactivate / Mutasi Modal */}
      <Modal
        isOpen={isDeactivateModalOpen}
        onClose={() => setIsDeactivateModalOpen(false)}
        title="Ubah Status / Mutasi Siswa"
        maxWidth="md"
      >
        {selectedStudent && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Ketentuan Integritas Data</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Siswa tidak langsung dihapus permanen dari database guna menjaga keutuhan riwayat nilai dan absensi. Pilih status perubahan di bawah:
                </p>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Status Baru</label>
              <select
                value={newDeactivateStatus}
                onChange={e => setNewDeactivateStatus(e.target.value as StudentStatus)}
                className="w-full px-3 py-2 rounded-xl border text-xs bg-white font-medium"
              >
                <option value="Nonaktif">Nonaktif</option>
                <option value="Pindah">Pindah Sekolah (Mutasi Keluar)</option>
                <option value="Lulus">Lulus</option>
                <option value="Aktif">Aktifkan Kembali</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Keterangan / Alasan Mutasi</label>
              <textarea
                value={deactivateReason}
                onChange={e => setDeactivateReason(e.target.value)}
                placeholder="Contoh: Pindah domisili orang tua ke luar kota..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="px-5 py-2 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition shadow-sm"
              >
                Konfirmasi Perubahan
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
