import React, { useState, useEffect, useMemo } from "react";
import { 
  TeacherProfile, 
  RegisteredStudent, 
  ClassSection 
} from "../types";
import { 
  getAllTeachers, 
  createTeacherByAdmin, 
  updateTeacherByAdmin, 
  deleteTeacherByAdmin,
  getRegisteredStudents,
  fetchRegisteredStudentsFromDatabase,
  saveRegisteredStudent,
  deleteRegisteredStudent,
  syncRegisteredStudentsWithClasses
} from "../lib/adminService";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Users, 
  GraduationCap, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  AlertCircle, 
  Sparkles, 
  BookOpen, 
  Mail, 
  IdCard, 
  Key, 
  RefreshCw, 
  School,
  X,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelViewProps {
  currentTeacher: TeacherProfile;
  classes: ClassSection[];
  onBack: () => void;
  onUpdateClasses?: (updatedClasses: ClassSection[]) => void;
  onCurrentTeacherUpdated?: (updatedTeacher: TeacherProfile) => void;
}

const GRADE_YEAR_OPTIONS = [
  "1er Año",
  "2do Año",
  "3er Año",
  "4to Año",
  "5to Año"
];

const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F"];

const DEPARTMENT_OPTIONS = [
  "Ciencias Exactas",
  "Ciencias Naturales",
  "Humanidades y Arte",
  "Idiomas Modernos",
  "Educación Física y Deportes",
  "Tecnología e Informática"
];

const RANK_OPTIONS = [
  "DOCENTE TITULAR",
  "DOCENTE ASOCIADO",
  "DOCENTE ADJUNTO",
  "COORDINADOR DE ÁREA",
  "DIRECTOR ACADÉMICO"
];

export default function AdminPanelView({
  currentTeacher,
  classes,
  onBack,
  onUpdateClasses,
  onCurrentTeacherUpdated
}: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState<"teachers" | "students">("teachers");

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // ==================== TEACHERS STATE ====================
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [teacherSearch, setTeacherSearch] = useState("");

  // Modals for Teachers
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherProfile | null>(null);

  // New Teacher Form
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [newTeacherDept, setNewTeacherDept] = useState("Ciencias Exactas");
  const [newTeacherRank, setNewTeacherRank] = useState("DOCENTE TITULAR");
  const [newTeacherYear, setNewTeacherYear] = useState("2025 - 2026");
  const [newTeacherIsAdmin, setNewTeacherIsAdmin] = useState(false);
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);

  // Edit Teacher Form
  const [editTeacherName, setEditTeacherName] = useState("");
  const [editTeacherEmail, setEditTeacherEmail] = useState("");
  const [editTeacherDept, setEditTeacherDept] = useState("");
  const [editTeacherRank, setEditTeacherRank] = useState("");
  const [editTeacherYear, setEditTeacherYear] = useState("");
  const [editTeacherIsAdmin, setEditTeacherIsAdmin] = useState(false);
  const [editTeacherNewPassword, setEditTeacherNewPassword] = useState("");

  // ==================== STUDENTS STATE ====================
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentYearFilter, setStudentYearFilter] = useState("1er Año");
  const [studentSectionFilter, setStudentSectionFilter] = useState("ALL");

  // Modals for Students
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<RegisteredStudent | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<RegisteredStudent | null>(null);

  // New Student Form
  const [newStudentFirst, setNewStudentFirst] = useState("");
  const [newStudentLast, setNewStudentLast] = useState("");
  const [newStudentCedula, setNewStudentCedula] = useState("");
  const [newStudentYear, setNewStudentYear] = useState("1er Año");
  const [newStudentSection, setNewStudentSection] = useState("A");

  // Edit Student Form
  const [editStudentFirst, setEditStudentFirst] = useState("");
  const [editStudentLast, setEditStudentLast] = useState("");
  const [editStudentCedula, setEditStudentCedula] = useState("");
  const [editStudentYear, setEditStudentYear] = useState("1er Año");
  const [editStudentSection, setEditStudentSection] = useState("A");

  // Load Initial Data
  useEffect(() => {
    loadTeachers();
    loadStudents();
  }, []);

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const list = await getAllTeachers();
      setTeachers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const [loadingStudents, setLoadingStudents] = useState(false);

  const loadStudents = async (targetYear?: string) => {
    setLoadingStudents(true);
    const yr = targetYear || studentYearFilter;
    try {
      const list = await fetchRegisteredStudentsFromDatabase(yr);
      setRegisteredStudents(list);
    } catch (e) {
      console.error(e);
      setRegisteredStudents(getRegisteredStudents());
    } finally {
      setLoadingStudents(false);
    }
  };

  // ==================== TEACHER HANDLERS ====================
  const handleOpenAddTeacher = () => {
    setNewTeacherName("");
    setNewTeacherEmail("");
    setNewTeacherPassword("");
    setNewTeacherDept("Ciencias Exactas");
    setNewTeacherRank("DOCENTE TITULAR");
    setNewTeacherYear("2025 - 2026");
    setNewTeacherIsAdmin(false);
    setIsAddTeacherOpen(true);
  };

  const handleCreateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim() || !newTeacherEmail.trim()) {
      showToast("Por favor ingresa nombre y correo.");
      return;
    }

    setIsSavingTeacher(true);
    const res = await createTeacherByAdmin({
      name: newTeacherName.trim(),
      email: newTeacherEmail.trim(),
      password: newTeacherPassword.trim(),
      department: newTeacherDept,
      rank: newTeacherRank,
      schoolYear: newTeacherYear,
      isAdmin: newTeacherIsAdmin,
    });
    setIsSavingTeacher(false);

    if (res.success) {
      showToast(res.message);
      setIsAddTeacherOpen(false);
      loadTeachers();
    } else {
      showToast("Error al crear docente.");
    }
  };

  const handleOpenEditTeacher = (t: TeacherProfile) => {
    setEditingTeacher(t);
    setEditTeacherName(t.name);
    setEditTeacherEmail(t.email);
    setEditTeacherDept(t.department);
    setEditTeacherRank(t.rank);
    setEditTeacherYear(t.schoolYear);
    setEditTeacherIsAdmin(Boolean(t.isAdmin));
    setEditTeacherNewPassword("");
  };

  const handleUpdateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    const updated: TeacherProfile = {
      ...editingTeacher,
      name: editTeacherName.trim(),
      email: editTeacherEmail.trim(),
      department: editTeacherDept,
      rank: editTeacherRank,
      schoolYear: editTeacherYear,
      isAdmin: editTeacherIsAdmin,
      status: editTeacherIsAdmin ? "ADMIN" : "ACTIVO",
    };

    setIsSavingTeacher(true);
    const res = await updateTeacherByAdmin(updated, editTeacherNewPassword);
    setIsSavingTeacher(false);

    if (res.success) {
      showToast(res.message);
      setEditingTeacher(null);
      loadTeachers();
      if (currentTeacher.email?.toLowerCase() === updated.email.toLowerCase()) {
        onCurrentTeacherUpdated?.(updated);
      }
    } else {
      showToast("Error al actualizar docente.");
    }
  };

  const handleDeleteTeacherConfirm = async () => {
    if (!teacherToDelete) return;
    const res = await deleteTeacherByAdmin(teacherToDelete.id || teacherToDelete.email);
    setTeacherToDelete(null);
    showToast(res.message);
    loadTeachers();
  };

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(t => 
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.rank.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  // ==================== STUDENT HANDLERS ====================
  const handleOpenAddStudent = () => {
    setNewStudentFirst("");
    setNewStudentLast("");
    setNewStudentCedula(`V-${31000000 + Math.floor(Math.random() * 8999999)}`);
    setNewStudentYear("1er Año");
    setNewStudentSection("A");
    setIsAddStudentOpen(true);
  };

  const handleCreateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentFirst.trim() || !newStudentLast.trim()) {
      showToast("Ingresa nombre y apellido del estudiante.");
      return;
    }

    const created = await saveRegisteredStudent({
      firstName: newStudentFirst.trim(),
      lastName: newStudentLast.trim(),
      cedula: newStudentCedula.trim() || `V-${Date.now().toString().slice(-8)}`,
      gradeYear: newStudentYear,
      sectionLetter: newStudentSection,
    });

    setIsAddStudentOpen(false);
    await loadStudents();
    showToast(`¡Alumno ${created.firstName} ${created.lastName} registrado en ${created.gradeYear} (${created.sectionLetter})!`);

    // Retroactively update matching classes loaded in app if any
    if (onUpdateClasses && classes.length > 0) {
      const { updatedClasses, addedCount } = syncRegisteredStudentsWithClasses(classes);
      if (addedCount > 0) {
        onUpdateClasses(updatedClasses);
      }
    }
  };

  const handleOpenEditStudent = (s: RegisteredStudent) => {
    setEditingStudent(s);
    setEditStudentFirst(s.firstName);
    setEditStudentLast(s.lastName);
    setEditStudentCedula(s.cedula);
    setEditStudentYear(s.gradeYear);
    setEditStudentSection(s.sectionLetter);
  };

  const handleUpdateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    await saveRegisteredStudent({
      id: editingStudent.id,
      firstName: editStudentFirst.trim(),
      lastName: editStudentLast.trim(),
      cedula: editStudentCedula.trim(),
      gradeYear: editStudentYear,
      sectionLetter: editStudentSection,
      avatarUrl: editingStudent.avatarUrl,
      createdAt: editingStudent.createdAt,
    });

    setEditingStudent(null);
    await loadStudents();
    showToast("¡Datos del alumno actualizados!");
  };

  const handleDeleteStudentConfirm = async () => {
    if (!studentToDelete) return;
    await deleteRegisteredStudent(studentToDelete.id);
    setStudentToDelete(null);
    await loadStudents();
    showToast("Alumno eliminado del padrón escolar.");
  };

  const handleSyncClassesWithStudents = () => {
    if (!onUpdateClasses) return;
    const { updatedClasses, addedCount } = syncRegisteredStudentsWithClasses(classes);
    onUpdateClasses(updatedClasses);
    if (addedCount > 0) {
      showToast(`¡Sincronización completa! Se incorporaron ${addedCount} alumnos a las asignaturas.`);
    } else {
      showToast("Todas las materias ya cuentan con los alumnos registrados.");
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return registeredStudents.filter(s => {
      const q = studentSearch.toLowerCase().trim();
      const matchSearch = !q || 
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.cedula.toLowerCase().includes(q);

      const matchYear = s.gradeYear === studentYearFilter;
      const matchSec = studentSectionFilter === "ALL" || s.sectionLetter === studentSectionFilter;

      return matchSearch && matchYear && matchSec;
    });
  }, [registeredStudents, studentSearch, studentYearFilter, studentSectionFilter]);

  // Aggregate stats
  const studentsByYear = useMemo(() => {
    const counts: Record<string, number> = {};
    GRADE_YEAR_OPTIONS.forEach(y => counts[y] = 0);
    registeredStudents.forEach(s => {
      if (counts[s.gradeYear] !== undefined) {
        counts[s.gradeYear] += 1;
      }
    });
    return counts;
  }, [registeredStudents]);

  return (
    <div className="space-y-6 pb-28 text-slate-900 animate-fade-in">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 15, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-bold text-xs tracking-wider uppercase px-6 py-3 shadow-2xl rounded-full flex items-center gap-2 border border-slate-700"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition mb-3 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver a Mi Perfil
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  Panel de Administrador
                </h1>
                <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] tracking-wider px-2.5 py-0.5 rounded-full uppercase border border-amber-200">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión de nómina de docentes y padrón institucional de alumnos
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/60 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("teachers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === "teachers"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            Docentes ({teachers.length})
          </button>

          <button
            onClick={() => setActiveTab("students")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-extrabold text-xs tracking-wider uppercase transition-all cursor-pointer ${
              activeTab === "students"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            Alumnos ({registeredStudents.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GESTIÓN DE DOCENTES                                                */}
      {/* ========================================================================= */}
      {activeTab === "teachers" && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                Total Docentes
              </span>
              <p className="text-2xl font-black font-mono text-slate-900 mt-1">
                {teachers.length}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Registrados en la plataforma</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                Administradores
              </span>
              <p className="text-2xl font-black font-mono text-amber-600 mt-1">
                {teachers.filter(t => t.isAdmin).length}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Con permisos de gestión central</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                Año Escolar
              </span>
              <p className="text-2xl font-black font-mono text-blue-600 mt-1">
                2025 - 2026
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Periodo académico activo</p>
            </div>
          </div>

          {/* Search Bar & Actions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar docente por nombre, email o área..."
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {teacherSearch && (
                <button 
                  onClick={() => setTeacherSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadTeachers}
                title="Refrescar lista"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTeachers ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleOpenAddTeacher}
                className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Docente</span>
              </button>
            </div>
          </div>

          {/* Teachers Grid/List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase">
                Plantilla de Docentes ({filteredTeachers.length})
              </span>
            </div>

            {filteredTeachers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No se encontraron docentes</p>
                <p className="text-xs text-slate-400 mt-1">Prueba con otro término de búsqueda o crea un nuevo docente.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredTeachers.map((t) => (
                  <div 
                    key={t.id || t.email} 
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition group"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={t.avatarUrl}
                          alt={t.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                          referrerPolicy="no-referrer"
                        />
                        {t.isAdmin && (
                          <div 
                            className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-sm"
                            title="Administrador"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                            {t.name}
                          </h4>
                          {t.isAdmin && (
                            <span className="bg-amber-50 text-amber-700 font-extrabold text-[9px] tracking-wider px-2 py-0.5 rounded-full uppercase border border-amber-200">
                              Admin
                            </span>
                          )}
                          <span className="bg-blue-50 text-blue-700 font-bold text-[9px] tracking-wider px-2 py-0.5 rounded-full uppercase">
                            {t.rank}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {t.email}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-1">
                          Área: <span className="text-slate-700 font-bold">{t.department}</span> • Año Escolar: <span className="text-slate-700">{t.schoolYear}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleOpenEditTeacher(t)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </button>

                      <button
                        onClick={() => setTeacherToDelete(t)}
                        className="p-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        title="Eliminar docente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GESTIÓN DE ALUMNOS (PADRÓN ESCOLAR)                                */}
      {/* ========================================================================= */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Informative Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 flex items-start gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">
                Relleno e Inscripción Automática en Cátedras
              </h4>
              <p className="text-xs text-blue-800/85 mt-1 leading-relaxed">
                Cada estudiante registrado con su <strong>Año</strong> y <strong>Sección</strong> se incorporará automáticamente a la lista de alumnos cuando cualquier docente cree su materia para ese año. No tendrás que inscribirlos manualmente uno a uno en cada clase.
              </p>
            </div>
          </div>

          {/* Quick Metrics by Year */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {GRADE_YEAR_OPTIONS.map((yr) => (
              <button
                key={yr}
                onClick={() => {
                  setStudentYearFilter(yr);
                  loadStudents(yr);
                }}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  studentYearFilter === yr
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-800 border-slate-200/80 hover:border-blue-300"
                }`}
              >
                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${studentYearFilter === yr ? "text-blue-100" : "text-slate-400"}`}>
                  {yr}
                </span>
                <p className="text-xl font-black font-mono mt-1">
                  {studentsByYear[yr] || 0}
                </p>
                <span className={`text-[10px] font-semibold ${studentYearFilter === yr ? "text-blue-100" : "text-slate-400"}`}>
                  alumnos
                </span>
              </button>
            ))}
          </div>

          {/* Search, Filter & Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o cédula..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                {studentSearch && (
                  <button 
                    onClick={() => setStudentSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Year filter select */}
              <select
                value={studentYearFilter}
                onChange={(e) => {
                  const yr = e.target.value;
                  setStudentYearFilter(yr);
                  loadStudents(yr);
                }}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                {GRADE_YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {/* Section filter select */}
              <select
                value={studentSectionFilter}
                onChange={(e) => setStudentSectionFilter(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Todas las Secciones</option>
                {SECTION_OPTIONS.map(s => (
                  <option key={s} value={s}>Sección {s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadStudents}
                title="Refrescar lista desde la base de datos"
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStudents ? "animate-spin" : ""}`} />
              </button>

              {classes.length > 0 && onUpdateClasses && (
                <button
                  onClick={handleSyncClassesWithStudents}
                  title="Sincronizar alumnos registrados con las clases existentes"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Sincronizar Materias</span>
                </button>
              )}

              <button
                onClick={handleOpenAddStudent}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Alumno</span>
              </button>
            </div>
          </div>

          {/* Students Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-extrabold tracking-widest text-slate-500 uppercase">
                Padrón Estudiantil • {studentYearFilter} ({filteredStudents.length} {filteredStudents.length === 1 ? "alumno" : "alumnos"})
              </span>
              {loadingStudents && (
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                  Consultando base de datos...
                </span>
              )}
            </div>

            {filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <GraduationCap className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                {registeredStudents.length === 0 ? (
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="text-sm font-bold text-slate-700">Sin alumnos en la base de datos</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      El padrón escolar no tiene alumnos registrados en la base de datos de Supabase. Los alumnos de ejemplo han sido removidos.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={handleOpenAddStudent}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Registrar Primer Alumno</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-700">No se encontraron alumnos</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando los filtros de búsqueda, año o sección.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/30">
                      <th className="p-4">Estudiante</th>
                      <th className="p-4">Cédula</th>
                      <th className="p-4">Año Escolar</th>
                      <th className="p-4">Sección</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 font-bold text-slate-800">
                          <div className="flex items-center gap-3">
                            <img
                              src={s.avatarUrl}
                              alt={s.firstName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{s.firstName} {s.lastName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-semibold text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {s.cedula}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-700">
                          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] uppercase font-extrabold">
                            {s.gradeYear}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-900">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-xs">
                            Sección {s.sectionLetter}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditStudent(s)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition cursor-pointer"
                              title="Editar alumno"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setStudentToDelete(s)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Eliminar alumno"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREAR DOCENTE                                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddTeacherOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Registrar Nuevo Docente
                </h3>
                <button
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTeacherSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Prof. Roberto Méndez"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Correo Institucional
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="docente@ilumina.edu"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Contraseña Temporal
                    </label>
                    <input
                      type="text"
                      placeholder="Mínimo 6 caracteres"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Departamento / Área
                    </label>
                    <select
                      value={newTeacherDept}
                      onChange={(e) => setNewTeacherDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      {DEPARTMENT_OPTIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Rango / Cargo
                    </label>
                    <select
                      value={newTeacherRank}
                      onChange={(e) => setNewTeacherRank(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                    >
                      {RANK_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Año Escolar
                  </label>
                  <input
                    type="text"
                    value={newTeacherYear}
                    onChange={(e) => setNewTeacherYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                {/* Admin Status Toggle */}
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">
                        Rol de Administrador (admin true)
                      </p>
                      <p className="text-[11px] text-amber-800/80">
                        Permite ver este panel administrativo y gestionar docentes y alumnos.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newTeacherIsAdmin}
                    onChange={(e) => setNewTeacherIsAdmin(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddTeacherOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTeacher}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    {isSavingTeacher ? "Guardando..." : "Crear Docente"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR DOCENTE                                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingTeacher && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-blue-600" />
                  Editar Docente
                </h3>
                <button
                  onClick={() => setEditingTeacher(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateTeacherSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={editTeacherName}
                    onChange={(e) => setEditTeacherName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={editTeacherEmail}
                      onChange={(e) => setEditTeacherEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Nueva Contraseña (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Dejar en blanco para mantener"
                      value={editTeacherNewPassword}
                      onChange={(e) => setEditTeacherNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Departamento
                    </label>
                    <select
                      value={editTeacherDept}
                      onChange={(e) => setEditTeacherDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {DEPARTMENT_OPTIONS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Rango / Cargo
                    </label>
                    <select
                      value={editTeacherRank}
                      onChange={(e) => setEditTeacherRank(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {RANK_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Año Escolar
                  </label>
                  <input
                    type="text"
                    value={editTeacherYear}
                    onChange={(e) => setEditTeacherYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                {/* Admin Status Toggle */}
                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">
                        Estado Administrador (admin true)
                      </p>
                      <p className="text-[11px] text-amber-800/80">
                        Habilita el botón del panel de administrador en el perfil de este docente.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editTeacherIsAdmin}
                    onChange={(e) => setEditTeacherIsAdmin(e.target.checked)}
                    className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingTeacher(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTeacher}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    {isSavingTeacher ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ELIMINAR DOCENTE (CONFIRMACIÓN)                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {teacherToDelete && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-extrabold text-slate-900">
                  ¿Eliminar Docente?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ¿Estás seguro de que deseas eliminar a <strong>{teacherToDelete.name}</strong> ({teacherToDelete.email})? Esta acción removerá el acceso institucional.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setTeacherToDelete(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteTeacherConfirm}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-rose-600/20 transition cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR ALUMNO                                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddStudentOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                  Registrar Alumno en Padrón Escolar
                </h3>
                <button
                  onClick={() => setIsAddStudentOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Carlos Eduardo"
                      value={newStudentFirst}
                      onChange={(e) => setNewStudentFirst(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Gómez Silva"
                      value={newStudentLast}
                      onChange={(e) => setNewStudentLast(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Cédula de Identidad
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="V-32.450.891"
                    value={newStudentCedula}
                    onChange={(e) => setNewStudentCedula(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Año Académico
                    </label>
                    <select
                      value={newStudentYear}
                      onChange={(e) => setNewStudentYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                    >
                      {GRADE_YEAR_OPTIONS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Sección Asignada
                    </label>
                    <select
                      value={newStudentSection}
                      onChange={(e) => setNewStudentSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                    >
                      {SECTION_OPTIONS.map(s => (
                        <option key={s} value={s}>Sección {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 leading-relaxed">
                  ℹ️ Una vez creado, este alumno aparecerá de forma inmediata en las materias que los docentes creen para <strong>{newStudentYear}</strong> (Sección <strong>{newStudentSection}</strong>).
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    Registrar Alumno
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR ALUMNO                                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-600" />
                  Editar Alumno
                </h3>
                <button
                  onClick={() => setEditingStudent(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateStudentSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Nombres
                    </label>
                    <input
                      type="text"
                      required
                      value={editStudentFirst}
                      onChange={(e) => setEditStudentFirst(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      required
                      value={editStudentLast}
                      onChange={(e) => setEditStudentLast(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                    Cédula de Identidad
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentCedula}
                    onChange={(e) => setEditStudentCedula(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Año Académico
                    </label>
                    <select
                      value={editStudentYear}
                      onChange={(e) => setEditStudentYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {GRADE_YEAR_OPTIONS.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
                      Sección Asignada
                    </label>
                    <select
                      value={editStudentSection}
                      onChange={(e) => setEditStudentSection(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      {SECTION_OPTIONS.map(s => (
                        <option key={s} value={s}>Sección {s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: ELIMINAR ALUMNO (CONFIRMACIÓN)                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {studentToDelete && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-extrabold text-slate-900">
                  ¿Eliminar Alumno?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  ¿Estás seguro de que deseas eliminar a <strong>{studentToDelete.firstName} {studentToDelete.lastName}</strong> ({studentToDelete.cedula}) del padrón escolar?
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setStudentToDelete(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteStudentConfirm}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md shadow-rose-600/20 transition cursor-pointer"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
