import React, { useState, useMemo } from 'react';
import { ClassRoom, User, Grade } from '../../types';
import { 
  GraduationCap, Plus, Search, Edit3, Trash2, Users, Calendar, 
  ArrowRight, CheckSquare, Square, UserPlus, UserMinus, ShieldAlert,
  Sparkles, Check, ChevronRight, X, ArrowUpRight, FolderPlus, Layers
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ClassManagerProps {
  classes: ClassRoom[];
  students: User[];
  onSaveClass: (c: ClassRoom) => Promise<void>;
  onDeleteClass: (id: string, name: string) => Promise<void>;
  onAssignStudents: (studentIds: string[], classInfo: { classId?: string; className?: string; academicYear?: string; grade?: Grade } | null) => Promise<void>;
  onRefresh: () => void;
}

export default function ClassManager({
  classes,
  students,
  onSaveClass,
  onDeleteClass,
  onAssignStudents,
  onRefresh
}: ClassManagerProps) {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<Grade | 'all'>('all');

  // Active view: List or Detail (class member inspection)
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [classForm, setClassForm] = useState<{
    name: string;
    academicYear: string;
    grade: Grade;
    description: string;
  }>({
    name: '',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    grade: '12',
    description: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Add Students to Class Modal
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIdsToAdd, setSelectedStudentIdsToAdd] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Batch Promote / Transfer Modal (Chuyển niên khóa / Thăng lớp)
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promoteTargetClassId, setPromoteTargetClassId] = useState<string>('');
  const [selectedStudentIdsToPromote, setSelectedStudentIdsToPromote] = useState<string[]>([]);

  // Unique academic years
  const academicYears = useMemo(() => {
    const years = new Set<string>();
    classes.forEach(c => {
      if (c.academicYear) years.add(c.academicYear.trim());
    });
    // Add current and next year suggestions
    const currentYear = new Date().getFullYear();
    years.add(`${currentYear}-${currentYear + 1}`);
    years.add(`${currentYear + 1}-${currentYear + 2}`);
    return Array.from(years).sort().reverse();
  }, [classes]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchYear = selectedYear === 'all' || c.academicYear === selectedYear;
      const matchGrade = selectedGrade === 'all' || c.grade === selectedGrade;
      return matchSearch && matchYear && matchGrade;
    }).sort((a, b) => {
      // Sort by academic year desc, then grade desc, then name asc
      if (b.academicYear !== a.academicYear) return b.academicYear.localeCompare(a.academicYear);
      if (b.grade !== a.grade) return b.grade.localeCompare(a.grade);
      return a.name.localeCompare(b.name);
    });
  }, [classes, searchQuery, selectedYear, selectedGrade]);

  // Students belonging to selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => 
      s.classId === selectedClass.id || 
      (s.className === selectedClass.name && s.academicYear === selectedClass.academicYear)
    );
  }, [students, selectedClass]);

  // Count unassigned students
  const unassignedStudentsCount = useMemo(() => {
    return students.filter(s => !s.classId && !s.className).length;
  }, [students]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingClass(null);
    const currentYear = new Date().getFullYear();
    setClassForm({
      name: '',
      academicYear: selectedYear !== 'all' ? selectedYear : `${currentYear}-${currentYear + 1}`,
      grade: selectedGrade !== 'all' ? selectedGrade : '12',
      description: ''
    });
    setIsClassModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c: ClassRoom) => {
    setEditingClass(c);
    setClassForm({
      name: c.name,
      academicYear: c.academicYear,
      grade: c.grade,
      description: c.description || ''
    });
    setIsClassModalOpen(true);
  };

  // Save Class
  const handleSaveClass = async () => {
    if (!classForm.name.trim()) {
      alert("Vui lòng nhập tên lớp (Ví dụ: 12A1, 11A2, Lớp Nâng Cao...)");
      return;
    }
    if (!classForm.academicYear.trim()) {
      alert("Vui lòng nhập hoặc chọn Niên khóa (Ví dụ: 2025-2026)");
      return;
    }

    setIsSaving(true);
    try {
      const classId = editingClass ? editingClass.id : `class_${classForm.name.trim().replace(/\s+/g, '')}_${classForm.academicYear.trim().replace(/[^a-zA-Z0-9]/g, '')}_${uuidv4().slice(0, 6)}`;
      const saved: ClassRoom = {
        id: classId,
        name: classForm.name.trim().toUpperCase(),
        academicYear: classForm.academicYear.trim(),
        grade: classForm.grade,
        description: classForm.description.trim(),
        createdAt: editingClass?.createdAt || new Date().toISOString()
      };
      await onSaveClass(saved);
      setIsClassModalOpen(false);
      if (selectedClass && selectedClass.id === saved.id) {
        setSelectedClass(saved);
      }
    } catch (e) {
      alert("Lỗi lưu lớp học. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Class
  const handleDeleteClass = async (c: ClassRoom) => {
    const studentCount = students.filter(s => s.classId === c.id || (s.className === c.name && s.academicYear === c.academicYear)).length;
    const msg = studentCount > 0 
      ? `Lớp "${c.name} (${c.academicYear})" hiện có ${studentCount} học sinh.\nNếu xóa lớp, các học sinh sẽ trở về trạng thái "Chưa phân lớp" (tài khoản và điểm số vẫn giữ nguyên).\nBạn có chắc chắn muốn xóa?`
      : `Bạn có chắc chắn muốn xóa lớp "${c.name} (${c.academicYear})"?`;
    
    if (confirm(msg)) {
      await onDeleteClass(c.id, `${c.name} (${c.academicYear})`);
      if (selectedClass?.id === c.id) {
        setSelectedClass(null);
      }
    }
  };

  // Assign Students to Class
  const handleConfirmAddStudents = async () => {
    if (!selectedClass || selectedStudentIdsToAdd.length === 0) return;
    setIsAssigning(true);
    try {
      await onAssignStudents(selectedStudentIdsToAdd, {
        classId: selectedClass.id,
        className: selectedClass.name,
        academicYear: selectedClass.academicYear,
        grade: selectedClass.grade
      });
      setIsAddStudentModalOpen(false);
      setSelectedStudentIdsToAdd([]);
    } catch (e) {
      alert("Lỗi gán học sinh vào lớp.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Remove single student from class
  const handleRemoveStudentFromClass = async (studentId: string, studentName: string) => {
    if (confirm(`Gỡ học sinh "${studentName}" khỏi lớp ${selectedClass?.name}? (Tài khoản và điểm số không bị mất)`)) {
      await onAssignStudents([studentId], null);
    }
  };

  // Batch Promote / Transfer
  const handleConfirmPromote = async () => {
    if (!promoteTargetClassId) {
      alert("Vui lòng chọn lớp đích để chuyển tới!");
      return;
    }
    const target = classes.find(c => c.id === promoteTargetClassId);
    if (!target) return;

    if (selectedStudentIdsToPromote.length === 0) {
      alert("Vui lòng chọn ít nhất 1 học sinh để chuyển lớp!");
      return;
    }

    setIsAssigning(true);
    try {
      await onAssignStudents(selectedStudentIdsToPromote, {
        classId: target.id,
        className: target.name,
        academicYear: target.academicYear,
        grade: target.grade
      });
      alert(`Đã chuyển thành công ${selectedStudentIdsToPromote.length} học sinh sang lớp ${target.name} (${target.academicYear})!`);
      setIsPromoteModalOpen(false);
      setSelectedStudentIdsToPromote([]);
    } catch (e) {
      alert("Lỗi khi chuyển lớp.");
    } finally {
      setIsAssigning(false);
    }
  };

  // Students available to add into the current class
  const availableStudentsToAdd = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter(s => {
      const isAlreadyInThisClass = s.classId === selectedClass.id || 
        (s.className === selectedClass.name && s.academicYear === selectedClass.academicYear);
      if (isAlreadyInThisClass) return false;

      if (!studentSearch.trim()) return true;
      const q = studentSearch.toLowerCase();
      return s.fullName.toLowerCase().includes(q) || 
             (s.studentCode && s.studentCode.toLowerCase().includes(q)) ||
             (s.className && s.className.toLowerCase().includes(q));
    });
  }, [students, selectedClass, studentSearch]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/40 border border-indigo-400/30 rounded-2xl">
              <GraduationCap size={28} className="text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Quản Lý Lớp Học & Niên Khóa</h2>
              <p className="text-slate-400 text-xs font-bold">
                Phân loại học sinh theo trình độ & niên khóa • Giao đề đích danh cho từng lớp
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-black text-indigo-300 uppercase block">Tổng số lớp</span>
            <span className="text-xl font-black text-white">{classes.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-black text-emerald-300 uppercase block">Đã vào lớp</span>
            <span className="text-xl font-black text-emerald-400">{students.length - unassignedStudentsCount} HS</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-black text-amber-300 uppercase block">Chưa phân lớp</span>
            <span className="text-xl font-black text-amber-400">{unassignedStudentsCount} HS</span>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-indigo-500 shadow-xl transition-all active:scale-95"
          >
            <Plus size={18} /> THÊM LỚP MỚI
          </button>
        </div>
      </div>

      {/* Main Container */}
      {!selectedClass ? (
        // VIEW 1: CLASS LIST
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-6 rounded-[2rem] border shadow-sm">
            <div className="flex-1 w-full relative">
              <input
                className="w-full p-4 bg-slate-50 border rounded-2xl outline-none text-xs font-bold pl-10"
                placeholder="Tìm tên lớp hoặc mô tả..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            </div>

            <div className="flex gap-3 w-full lg:w-auto flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-xl border">
                <Calendar size={14} className="text-slate-400" />
                <select
                  className="bg-transparent py-2 text-[10px] font-black uppercase outline-none"
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                >
                  <option value="all">TẤT CẢ NIÊN KHÓA</option>
                  {academicYears.map(yr => (
                    <option key={yr} value={yr}>NIÊN KHÓA {yr}</option>
                  ))}
                </select>
              </div>

              <select
                className="px-4 py-3 bg-white border rounded-xl text-[10px] font-black uppercase outline-none"
                value={selectedGrade}
                onChange={e => setSelectedGrade(e.target.value as any)}
              >
                <option value="all">TẤT CẢ KHỐI</option>
                <option value="12">KHỐI 12</option>
                <option value="11">KHỐI 11</option>
                <option value="10">KHỐI 10</option>
              </select>
            </div>
          </div>

          {/* Classes Grid */}
          {filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredClasses.map(c => {
                const count = students.filter(s => 
                  s.classId === c.id || 
                  (s.className === c.name && s.academicYear === c.academicYear)
                ).length;

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all flex flex-col group relative overflow-hidden border-b-8 border-b-indigo-600"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-[9px] uppercase border border-indigo-100">
                            Khối {c.grade}
                          </span>
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 font-black rounded-lg text-[9px] uppercase">
                            📅 {c.academicYear}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 bg-slate-50 border rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
                          title="Sửa thông tin lớp"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(c)}
                          className="p-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                          title="Xóa lớp"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight mb-2">
                      {c.name}
                    </h3>

                    {c.description ? (
                      <p className="text-xs text-slate-500 font-medium line-clamp-2 min-h-[32px] mb-4 leading-relaxed">
                        {c.description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic min-h-[32px] mb-4">
                        Chưa có ghi chú / phân loại trình độ
                      </p>
                    )}

                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border mb-6">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users size={16} className="text-indigo-600" />
                        <span className="text-xs font-bold">Học sinh:</span>
                      </div>
                      <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                        {count} thành viên
                      </span>
                    </div>

                    <div className="mt-auto">
                      <button
                        onClick={() => setSelectedClass(c)}
                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-md active:scale-95"
                      >
                        <Users size={15} /> Xem danh sách & Gán HS <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-[2.5rem] border border-dashed p-12 space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase">Chưa có lớp học nào phù hợp</h3>
              <p className="text-xs text-slate-400 font-bold max-w-md mx-auto">
                Tạo các lớp học (Ví dụ: 12A1, 12A2, 10A1...) và gán học sinh vào để bắt đầu giao đề phân hóa theo từng lớp.
              </p>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-indigo-700 shadow-lg"
              >
                <Plus size={16} /> TẠO LỚP HỌC ĐẦU TIÊN
              </button>
            </div>
          )}
        </div>
      ) : (
        // VIEW 2: CLASS DETAIL & MEMBERS INSPECTION
        <div className="space-y-6">
          {/* Header of selected class */}
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="p-3 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-2xl transition-all"
                  title="Quay lại danh sách lớp"
                >
                  <X size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                      Lớp {selectedClass.name}
                    </h2>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-xs uppercase border border-indigo-100">
                      Khối {selectedClass.grade}
                    </span>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 font-black rounded-lg text-xs uppercase">
                      Niên khóa: {selectedClass.academicYear}
                    </span>
                  </div>
                  {selectedClass.description && (
                    <p className="text-xs text-slate-500 font-bold mt-1">
                      {selectedClass.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedStudentIdsToPromote(classStudents.map(s => s.id));
                    setIsPromoteModalOpen(true);
                  }}
                  disabled={classStudents.length === 0}
                  className="flex items-center gap-2 px-5 py-3.5 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase hover:bg-amber-600 shadow-lg disabled:opacity-50 transition-all"
                  title="Chuyển toàn bộ hoặc chọn lọc học sinh sang lớp mới / niên khóa mới"
                >
                  <ArrowUpRight size={16} /> Chuyển Niên Khóa / Thăng Lớp
                </button>
                <button
                  onClick={() => {
                    setSelectedStudentIdsToAdd([]);
                    setIsAddStudentModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-indigo-700 shadow-lg transition-all"
                >
                  <UserPlus size={16} /> Thêm học sinh vào lớp
                </button>
              </div>
            </div>

            {/* Members table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Users size={16} className="text-indigo-600" />
                  Danh sách thành viên ({classStudents.length} học sinh)
                </h4>
              </div>

              {classStudents.length > 0 ? (
                <div className="overflow-x-auto border rounded-2xl">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="p-4 w-12 text-center">STT</th>
                        <th className="p-4">Họ và tên</th>
                        <th className="p-4 text-center">Mã số (MAHS)</th>
                        <th className="p-4 text-center">Khối</th>
                        <th className="p-4 text-center">Tài khoản</th>
                        <th className="p-4 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {classStudents.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 text-center text-xs font-black text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-4">
                            <p className="font-black text-slate-800 uppercase text-sm leading-tight">
                              {s.fullName}
                            </p>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-xs">
                              {s.studentCode || 'N/A'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg text-xs">
                              Khối {s.grade || selectedClass.grade}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-xs text-slate-500 font-mono">
                              {s.username}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleRemoveStudentFromClass(s.id, s.fullName)}
                              className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Gỡ khỏi lớp này"
                            >
                              <UserMinus size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed space-y-3">
                  <Users size={32} className="text-slate-300 mx-auto" />
                  <p className="text-xs font-black text-slate-400 uppercase">
                    Lớp chưa có học sinh nào
                  </p>
                  <button
                    onClick={() => {
                      setSelectedStudentIdsToAdd([]);
                      setIsAddStudentModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700"
                  >
                    <UserPlus size={14} /> Thêm học sinh ngay
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE / EDIT CLASS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden border shadow-2xl animate-scale-up">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-xl">
                  <GraduationCap size={20} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight">
                  {editingClass ? 'Sửa thông tin Lớp học' : 'Tạo Lớp học mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-600 uppercase ml-1">
                  1. Tên Lớp (Ví dụ: 12A1, 11A2, 10A1, Lớp Nâng Cao...)
                </label>
                <input
                  className="w-full p-4 bg-slate-50 border rounded-2xl font-black uppercase text-sm outline-none focus:border-indigo-500 transition-all"
                  value={classForm.name}
                  onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="VÍ DỤ: 12A1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                    2. Niên khóa / Năm học
                  </label>
                  <input
                    className="w-full p-4 bg-slate-50 border rounded-2xl font-bold text-xs outline-none focus:border-indigo-500"
                    value={classForm.academicYear}
                    onChange={e => setClassForm({ ...classForm, academicYear: e.target.value })}
                    placeholder="2025-2026"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                    3. Khối
                  </label>
                  <select
                    className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-xs outline-none focus:border-indigo-500"
                    value={classForm.grade}
                    onChange={e => setClassForm({ ...classForm, grade: e.target.value as Grade })}
                  >
                    <option value="12">Khối 12</option>
                    <option value="11">Khối 11</option>
                    <option value="10">Khối 10</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                  4. Ghi chú / Trình độ phân hóa (Tùy chọn)
                </label>
                <input
                  className="w-full p-4 bg-slate-50 border rounded-2xl font-medium text-xs outline-none focus:border-indigo-500"
                  value={classForm.description}
                  onChange={e => setClassForm({ ...classForm, description: e.target.value })}
                  placeholder="Ví dụ: Trình độ Nâng cao, GVCN Thầy Nam..."
                />
              </div>

              <button
                onClick={handleSaveClass}
                disabled={isSaving}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all mt-4 disabled:opacity-50"
              >
                <Check size={18} /> {isSaving ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN LỚP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD STUDENTS TO CLASS */}
      {isAddStudentModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden border shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-xl">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">
                    Thêm học sinh vào Lớp {selectedClass.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Niên khóa {selectedClass.academicYear} • Khối {selectedClass.grade}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 border-b shrink-0 flex gap-4 items-center bg-slate-50">
              <div className="flex-1 relative">
                <input
                  className="w-full p-3 bg-white border rounded-xl outline-none text-xs font-bold pl-9"
                  placeholder="Tìm học sinh theo tên hoặc MAHS..."
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              </div>
              <button
                onClick={() => {
                  if (selectedStudentIdsToAdd.length === availableStudentsToAdd.length) {
                    setSelectedStudentIdsToAdd([]);
                  } else {
                    setSelectedStudentIdsToAdd(availableStudentsToAdd.map(s => s.id));
                  }
                }}
                className="px-4 py-3 bg-white border rounded-xl text-[10px] font-black uppercase hover:bg-slate-100"
              >
                {selectedStudentIdsToAdd.length === availableStudentsToAdd.length ? 'Bỏ chọn' : 'Chọn tất cả'}
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-2">
              {availableStudentsToAdd.length > 0 ? (
                availableStudentsToAdd.map(s => {
                  const isChecked = selectedStudentIdsToAdd.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedStudentIdsToAdd(prev => 
                          prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id]
                        );
                      }}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${isChecked ? 'bg-indigo-50/80 border-indigo-300 shadow-sm' : 'bg-white hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isChecked ? 'text-indigo-600' : 'text-slate-300'}`}>
                          {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-xs">
                            {s.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Mã: <span className="font-mono text-blue-600 font-bold">{s.studentCode || 'N/A'}</span> • Khối {s.grade || '12'}
                            {s.className ? (
                              <span className="text-amber-600 ml-1">
                                (Hiện đang ở lớp: {s.className} - {s.academicYear || ''})
                              </span>
                            ) : (
                              <span className="text-slate-400 ml-1">(Chưa vào lớp nào)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-bold">
                  Không tìm thấy học sinh nào phù hợp
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t shrink-0 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600">
                Đã chọn: <strong className="text-indigo-600">{selectedStudentIdsToAdd.length}</strong> học sinh
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-5 py-2.5 bg-white border text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmAddStudents}
                  disabled={selectedStudentIdsToAdd.length === 0 || isAssigning}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 disabled:opacity-50 shadow-md flex items-center gap-2"
                >
                  <UserPlus size={14} /> {isAssigning ? 'Đang gán...' : 'Gán vào lớp'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BATCH PROMOTE / TRANSFER ACROSS ACADEMIC YEARS */}
      {isPromoteModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[5000] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden border shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
            <div className="p-6 bg-amber-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">
                    Chuyển Niên Khóa / Thăng Lớp Hàng Loạt
                  </h3>
                  <p className="text-[10px] text-amber-100 font-bold">
                    Từ Lớp: <strong>{selectedClass.name} ({selectedClass.academicYear})</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPromoteModalOpen(false)}
                className="p-2 hover:bg-amber-700 rounded-xl transition-colors text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 leading-relaxed space-y-1">
                <p className="font-black uppercase text-[11px] text-amber-800">
                  💡 Giữ nguyên tài khoản & Lịch sử thi cử
                </p>
                <p>
                  Khi chuyển sang niên khóa mới (Ví dụ từ <strong>11A1 niên học 2025</strong> lên <strong>12A1 niên học 2026</strong>), tài khoản đăng nhập, mã học sinh và điểm rèn luyện của các bạn sẽ <strong>không bao giờ bị thay đổi</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                  1. Chọn Lớp & Niên khóa đích để chuyển tới:
                </label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-xs outline-none focus:border-amber-500"
                  value={promoteTargetClassId}
                  onChange={e => setPromoteTargetClassId(e.target.value)}
                >
                  <option value="">-- BẤM ĐỂ CHỌN LỚP ĐÍCH --</option>
                  {classes
                    .filter(c => c.id !== selectedClass.id)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} • Niên khóa {c.academicYear} (Khối {c.grade})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">
                    2. Chọn học sinh cần chuyển ({selectedStudentIdsToPromote.length}/{classStudents.length}):
                  </label>
                  <button
                    onClick={() => {
                      if (selectedStudentIdsToPromote.length === classStudents.length) {
                        setSelectedStudentIdsToPromote([]);
                      } else {
                        setSelectedStudentIdsToPromote(classStudents.map(s => s.id));
                      }
                    }}
                    className="text-[10px] font-black text-amber-600 uppercase hover:underline"
                  >
                    {selectedStudentIdsToPromote.length === classStudents.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto border rounded-2xl divide-y bg-slate-50">
                  {classStudents.map(s => {
                    const isChecked = selectedStudentIdsToPromote.includes(s.id);
                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudentIdsToPromote(prev => 
                            prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={`p-3 text-xs flex items-center justify-between cursor-pointer ${isChecked ? 'bg-amber-100/60 font-black text-slate-900' : 'text-slate-600'}`}
                      >
                        <div className="flex items-center gap-2">
                          {isChecked ? <CheckSquare size={16} className="text-amber-600" /> : <Square size={16} className="text-slate-300" />}
                          <span>{s.fullName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{s.studentCode}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t shrink-0 flex justify-end gap-3">
              <button
                onClick={() => setIsPromoteModalOpen(false)}
                className="px-5 py-2.5 bg-white border text-slate-600 rounded-xl text-xs font-black uppercase hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPromote}
                disabled={!promoteTargetClassId || selectedStudentIdsToPromote.length === 0 || isAssigning}
                className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black uppercase hover:bg-amber-700 disabled:opacity-50 shadow-md flex items-center gap-2"
              >
                <ArrowRight size={14} /> {isAssigning ? 'Đang chuyển...' : `Chuyển ${selectedStudentIdsToPromote.length} học sinh`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
