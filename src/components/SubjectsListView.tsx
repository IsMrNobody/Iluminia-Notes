import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  Layers, 
  Users, 
  Plus, 
  Search, 
  ChevronRight, 
  GraduationCap,
  Sparkles,
  Trash2,
  CheckSquare,
  Square,
  Check,
  AlertTriangle,
  X,
  Loader2
} from "lucide-react";
import { SubjectGroup } from "../types";
import { getSubjectTheme } from "../utils/subjectThemes";

interface SubjectsListViewProps {
  subjectGroups: SubjectGroup[];
  teacherName: string;
  onSelectSubject: (groupKey: string) => void;
  onSelectSection: (sectionId: string, groupKey: string) => void;
  onOpenAddClass: () => void;
  onDeleteSubjectGroups?: (groupKeys: string[]) => Promise<void> | void;
}

export default function SubjectsListView({
  subjectGroups,
  teacherName,
  onSelectSubject,
  onSelectSection,
  onOpenAddClass,
  onDeleteSubjectGroups
}: SubjectsListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingDeleteKeys, setPendingDeleteKeys] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredGroups = subjectGroups.filter(g => 
    g.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.gradeYear.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSections = subjectGroups.reduce((acc, g) => acc + g.sections.length, 0);
  const totalStudents = subjectGroups.reduce((acc, g) => acc + g.totalStudents, 0);
  const gradedGroups = subjectGroups.filter(g => g.averageScore > 0);
  const overallAvg = gradedGroups.length > 0
    ? (gradedGroups.reduce((acc, g) => acc + g.averageScore, 0) / gradedGroups.length).toFixed(1)
    : "0.0";

  // Toggle single card selection
  const handleToggleSelect = (groupKey: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  // Toggle all filtered cards
  const handleToggleSelectAll = () => {
    const allFilteredSelected = filteredGroups.length > 0 && filteredGroups.every(g => selectedKeys.has(g.key));
    if (allFilteredSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(filteredGroups.map(g => g.key)));
    }
  };

  // Prompt delete for selected cards
  const handlePromptDeleteSelected = () => {
    if (selectedKeys.size === 0) return;
    setPendingDeleteKeys(Array.from(selectedKeys));
    setShowConfirmModal(true);
  };

  // Prompt delete for a single card directly
  const handlePromptDeleteSingle = (groupKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteKeys([groupKey]);
    setShowConfirmModal(true);
  };

  // Confirm and execute deletion
  const handleConfirmDelete = async () => {
    if (!onDeleteSubjectGroups || pendingDeleteKeys.length === 0) return;
    try {
      setIsDeleting(true);
      await onDeleteSubjectGroups(pendingDeleteKeys);
      // Clean selection
      setSelectedKeys(prev => {
        const next = new Set(prev);
        pendingDeleteKeys.forEach(k => next.delete(k));
        return next;
      });
      if (selectedKeys.size <= pendingDeleteKeys.length) {
        setIsSelectionMode(false);
      }
      setShowConfirmModal(false);
      setPendingDeleteKeys([]);
    } catch (err) {
      console.error("Error deleting subjects:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const allFilteredSelected = filteredGroups.length > 0 && filteredGroups.every(g => selectedKeys.has(g.key));
  const groupsToDisplayInModal = subjectGroups.filter(g => pendingDeleteKeys.includes(g.key));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-24"
    >
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-44 h-44 bg-blue-50 rounded-full blur-3xl -z-10 opacity-70"></div>
        <div className="absolute left-1/2 bottom-0 w-36 h-36 bg-indigo-50 rounded-full blur-2xl -z-10 opacity-50"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase bg-blue-50 px-2.5 py-0.5 rounded-full">
                Plan de Estudios
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Docente: <strong className="text-slate-800">{teacherName}</strong>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Mis Asignaturas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Selecciona una materia para acceder a sus secciones, planillas de notas y nómina de estudiantes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {subjectGroups.length > 0 && onDeleteSubjectGroups && (
              <button
                type="button"
                onClick={() => {
                  if (isSelectionMode) {
                    setIsSelectionMode(false);
                    setSelectedKeys(new Set());
                  } else {
                    setIsSelectionMode(true);
                  }
                }}
                className={`font-bold text-xs tracking-wider uppercase px-3.5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 border ${
                  isSelectionMode
                    ? "bg-slate-800 hover:bg-slate-900 text-white border-slate-800 shadow-sm"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs"
                }`}
                title={isSelectionMode ? "Salir del modo de selección" : "Activar modo para seleccionar y eliminar materias"}
              >
                <CheckSquare className="w-4 h-4" />
                <span>{isSelectionMode ? "Cancelar Selección" : "Seleccionar"}</span>
              </button>
            )}

            <button
              onClick={onOpenAddClass}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Materia</span>
            </button>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Materias
            </span>
            <strong className="text-lg font-black text-slate-800 font-mono">
              {subjectGroups.length}
            </strong>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Secciones
            </span>
            <strong className="text-lg font-black text-blue-600 font-mono">
              {totalSections}
            </strong>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Estudiantes
            </span>
            <strong className="text-lg font-black text-slate-800 font-mono">
              {totalStudents}
            </strong>
          </div>
          <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
              Promedio
            </span>
            <strong className="text-lg font-black text-emerald-600 font-mono">
              {overallAvg} / 20
            </strong>
          </div>
        </div>
      </div>

      {/* Floating / Sticky Bulk Action Bar when selection mode or items selected */}
      {(isSelectionMode || selectedKeys.size > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-4 z-20"
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                allFilteredSelected 
                  ? "bg-blue-600 border-blue-600 text-white" 
                  : "border-slate-400 bg-transparent"
              }`}>
                {allFilteredSelected && <Check className="w-3 h-3" />}
              </div>
              <span>
                {allFilteredSelected ? "Deseleccionar todas" : "Seleccionar todas"}
              </span>
            </button>

            <span className="text-xs font-semibold text-slate-300">
              <strong className="text-white font-bold">{selectedKeys.size}</strong> {selectedKeys.size === 1 ? "materia seleccionada" : "materias seleccionadas"}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setSelectedKeys(new Set());
                setIsSelectionMode(false);
              }}
              className="text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={selectedKeys.size === 0}
              onClick={handlePromptDeleteSelected}
              className={`font-bold text-xs tracking-wider uppercase px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm ${
                selectedKeys.size > 0
                  ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar seleccionadas ({selectedKeys.size})</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por materia, año o departamento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-blue-600 focus:bg-white transition"
          />
        </div>

        <span className="text-xs font-bold text-slate-500">
          Mostrando {filteredGroups.length} de {subjectGroups.length} {subjectGroups.length === 1 ? "materia" : "materias"}
        </span>
      </div>

      {/* Subjects Grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGroups.map((group) => {
            const hasMultipleSections = group.sections.length > 1;
            const theme = getSubjectTheme(group.subjectName);
            const isSelected = selectedKeys.has(group.key);

            return (
              <div
                key={group.key}
                onClick={() => {
                  if (isSelectionMode) {
                    handleToggleSelect(group.key);
                  } else {
                    onSelectSubject(group.key);
                  }
                }}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer relative ${
                  isSelected
                    ? "ring-2 ring-blue-600 border-blue-500 shadow-md bg-blue-50/20"
                    : "border-slate-200/90 hover:shadow-md hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Card Cover Header with Subject Tone */}
                  <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
                    {group.coverUrl ? (
                      <img
                        src={group.coverUrl}
                        alt={group.subjectName}
                        className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-r ${theme.bgGradient} opacity-90 flex items-center justify-center`}>
                        <GraduationCap className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>

                    {/* Top Controls: Checkbox on left, Badges & Delete on right */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
                      {/* Selection checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          if (!isSelectionMode) setIsSelectionMode(true);
                          handleToggleSelect(group.key, e);
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition backdrop-blur-xs cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md ring-2 ring-white/50"
                            : isSelectionMode
                              ? "bg-black/50 hover:bg-black/70 text-white border border-white/60"
                              : "bg-black/35 hover:bg-black/60 text-white/70 hover:text-white border border-white/40 opacity-80 group-hover:opacity-100"
                        }`}
                        title={isSelected ? "Deseleccionar materia" : "Seleccionar materia"}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-xs border-2 border-white/70" />
                        )}
                      </button>

                      {/* Right side items: Badges & Direct Delete Button */}
                      <div className="flex items-center gap-1.5">
                        <span className={`${theme.badgeBg} text-white font-bold text-[10px] tracking-wider px-2 py-0.5 rounded-full uppercase backdrop-blur-xs shadow-xs`}>
                          {group.department}
                        </span>
                        <span className="bg-white/95 text-slate-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs shadow-2xs">
                          {group.gradeYear}
                        </span>

                        {onDeleteSubjectGroups && !isSelectionMode && (
                          <button
                            type="button"
                            onClick={(e) => handlePromptDeleteSingle(group.key, e)}
                            className="w-7 h-7 rounded-lg bg-black/40 hover:bg-rose-600 text-white/80 hover:text-white flex items-center justify-center transition backdrop-blur-xs cursor-pointer ml-0.5"
                            title="Eliminar esta materia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Subject Title */}
                    <div className="absolute bottom-2.5 left-3.5 right-3.5">
                      <h3 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                        {group.subjectName}
                      </h3>
                      <p className="text-[11px] text-white/80 font-medium">
                        {group.sections.length} {group.sections.length === 1 ? "Sección asignada" : "Secciones asignadas"}
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Section pills */}
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                        Secciones Disponibles
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {group.sections.map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={(e) => {
                              if (isSelectionMode) {
                                handleToggleSelect(group.key, e);
                              } else {
                                e.stopPropagation();
                                onSelectSection(sec.id, group.key);
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-black rounded-lg border transition cursor-pointer ${theme.pillBg} ${theme.pillText} ${theme.pillBorder} ${theme.pillHoverBg}`}
                            title={`Ir directamente a la Sección ${sec.sectionLetter}`}
                          >
                            Sec. {sec.sectionLetter}
                            <span className="ml-1 text-[10px] opacity-75 font-mono font-medium">
                              ({sec.students?.length || 0})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Metrics Bar */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Total Alumnos
                        </span>
                        <strong className="text-sm font-extrabold text-slate-800 font-mono">
                          {group.totalStudents}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Promedio
                        </span>
                        <strong className={`text-sm font-extrabold font-mono ${theme.statText}`}>
                          {group.averageScore > 0 ? `${group.averageScore.toFixed(1)} / 20` : "Sin notas"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
                  {isSelectionMode ? (
                    <button
                      type="button"
                      onClick={(e) => handleToggleSelect(group.key, e)}
                      className={`w-full font-bold text-xs tracking-wider uppercase py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSelected ? "Materia Seleccionada" : "Seleccionar"}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectSubject(group.key)}
                        className={`flex-1 ${theme.btnBg} text-white font-bold text-xs tracking-wider uppercase py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Ver Alumnos</span>
                        <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {onDeleteSubjectGroups && (
                        <button
                          type="button"
                          onClick={(e) => handlePromptDeleteSingle(group.key, e)}
                          className="p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Eliminar materia"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            {searchQuery ? "No se encontraron materias" : "Sin materias asignadas"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5 max-w-sm">
            {searchQuery 
              ? `No hay materias que coincidan con "${searchQuery}".` 
              : "Registra tu primera asignatura para gestionar secciones, estudiantes y cargar calificaciones."}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          ) : (
            <button
              onClick={onOpenAddClass}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase px-5 py-3 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Asignatura</span>
            </button>
          )}
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
            >
              {/* Header */}
              <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {groupsToDisplayInModal.length === 1
                      ? "¿Eliminar esta materia?"
                      : `¿Eliminar ${groupsToDisplayInModal.length} materias seleccionadas?`}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Esta acción retirará la materia y sus secciones de tu plan docente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isDeleting) {
                      setShowConfirmModal(false);
                      setPendingDeleteKeys([]);
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-rose-100/50 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    {groupsToDisplayInModal.length === 1 ? "Materia que se eliminará:" : "Materias a eliminar:"}
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {groupsToDisplayInModal.map((grp) => {
                      const theme = getSubjectTheme(grp.subjectName);
                      return (
                        <div
                          key={grp.key}
                          className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-black text-slate-900 truncate">
                              {grp.subjectName}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium mt-0.5">
                              <span className="font-semibold text-slate-700">{grp.gradeYear}</span>
                              <span>•</span>
                              <span>{grp.sections.length} {grp.sections.length === 1 ? "sección" : "secciones"} ({grp.sections.map(s => `Sec. ${s.sectionLetter}`).join(", ")})</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-extrabold text-slate-600 font-mono bg-white px-2 py-1 rounded-lg border border-slate-200 shrink-0">
                            {grp.totalStudents} alumnos
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                    <strong>Atención:</strong> Se eliminarán las secciones vinculadas y los registros de notas cargados para esta materia.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingDeleteKeys([]);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs tracking-wider uppercase px-5 py-2.5 rounded-xl transition shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>
                        {groupsToDisplayInModal.length === 1
                          ? "Eliminar Materia"
                          : `Eliminar ${groupsToDisplayInModal.length} Materias`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
