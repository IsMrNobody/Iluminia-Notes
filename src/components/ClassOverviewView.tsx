import React, { useState, useMemo, useEffect } from "react";
import { ClassSection, Student } from "../types";
import { getWeightedFinalScore } from "../mockData";
import { getSubjectTheme } from "../utils/subjectThemes";
import { 
  Search, 
  ArrowLeft, 
  Filter, 
  ChevronRight, 
  Check, 
  AlertTriangle, 
  HelpCircle,
  GraduationCap,
  Users,
  Edit,
  TrendingUp,
  Award,
  Plus,
  Trash2,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClassOverviewViewProps {
  section: ClassSection;
  allSiblingSections?: ClassSection[];
  onSwitchSection?: (sectionId: string) => void;
  onBack: () => void;
  onSelectStudent: (studentId: string) => void;
  onAddStudent: (className: string) => void;
  onDeleteStudent?: (studentId: string) => void;
}

type FilterType = "TODOS" | "APROBADOS" | "APLAZADOS" | "NO PRESENTÓ";

export default function ClassOverviewView({
  section,
  allSiblingSections,
  onSwitchSection,
  onBack,
  onSelectStudent,
  onAddStudent,
  onDeleteStudent
}: ClassOverviewViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("TODOS");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Automatically scroll to top on mount or when switching to another section, especially on mobile devices
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
      if (mainEl) mainEl.scrollTop = 0;
    }, 20);
    return () => clearTimeout(timer);
  }, [section.id]);

  // Calculate final score for each student to facilitate filtering and sorting
  const studentsWithScores = useMemo(() => {
    return section.students.map(std => ({
      ...std,
      finalScore: getWeightedFinalScore(std.grades)
    }));
  }, [section.students]);

  // Handle Search and Filters in real time
  const filteredStudents = useMemo(() => {
    return studentsWithScores.filter(std => {
      // Search
      const fullName = `${std.firstName} ${std.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || std.id.includes(searchQuery);

      if (!matchesSearch) return false;

      // Filter
      switch (activeFilter) {
        case "APROBADOS":
          return std.finalScore >= 10.0;
        case "APLAZADOS":
          return std.finalScore < 10.0;
        case "NO PRESENTÓ":
          // Simulated "no presentó" as missing more than one grade parameter or specific flag
          return !std.hasSubmittedLastQuiz || std.finalScore === 0;
        case "TODOS":
        default:
          return true;
      }
    });
  }, [studentsWithScores, searchQuery, activeFilter]);

  // Class Aggregated Performance Stats
  const averages = useMemo(() => {
    if (studentsWithScores.length === 0) return { overall: 0, passing: 0, failing: 0 };
    
    const gradedStudents = studentsWithScores.filter(s => s.finalScore > 0);
    const count = gradedStudents.length > 0 ? gradedStudents.length : studentsWithScores.length;
    const overallSum = gradedStudents.reduce((acc, s) => acc + s.finalScore, 0);
    const passingCount = studentsWithScores.filter(s => s.finalScore >= 10.0).length;
    const failingCount = studentsWithScores.filter(s => s.finalScore < 10.0 && s.finalScore > 0).length;

    return {
      overall: count > 0 ? Number((overallSum / count).toFixed(1)) : 0,
      passing: passingCount,
      failing: failingCount
    };
  }, [studentsWithScores]);

  // Initials generator for avatar
  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName.trim().charAt(0) || "";
    const l = lastName.trim().charAt(0) || "";
    return `${f}${l}`.toUpperCase();
  };

  const theme = getSubjectTheme(section.subjectName);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-24"
    >
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={onBack}
            className="p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer group flex items-center gap-1.5 shadow-xs shrink-0"
            title="Volver a Mis Materias"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">Mis Materias</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className={`w-4 h-4 ${theme.primary} shrink-0`} />
              <span className="text-xs font-extrabold tracking-wider uppercase font-sans truncate">
                NÓMINA DE LA SECCIÓN
              </span>
              <span className="text-slate-300">•</span>
              <span className={`text-[10px] font-bold ${theme.pillText} ${theme.pillBg} px-2 py-0.5 rounded-full border ${theme.pillBorder} shrink-0`}>
                {section.subjectName}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 truncate">
              {section.gradeYear} • Sección {section.sectionLetter}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
              Asignatura: <span className={`font-semibold ${theme.primary}`}>{section.subjectName}</span> • {section.students.length} Estudiantes Inscritos • Lapso {section.lapso}
            </p>
          </div>
        </div>

        {/* Quick sibling section switcher */}
        {allSiblingSections && allSiblingSections.length > 1 && (
          <div className="w-full sm:w-auto max-w-full min-w-0 overflow-x-auto flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 self-stretch sm:self-center touch-pan-x">
            {allSiblingSections.map((sib) => {
              const isCurrent = sib.id === section.id;
              return (
                <button
                  key={sib.id}
                  onClick={() => onSwitchSection && onSwitchSection(sib.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isCurrent
                      ? `${theme.badgeBg} text-white shadow-xs`
                      : `bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 ${theme.primary.replace("text-", "hover:text-")}`
                  }`}
                  title={`Ver sección ${sib.sectionLetter}`}
                >
                  <span>{sib.sectionLetter}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isCurrent ? "bg-black/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {sib.students?.length || 0}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Search Bar & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar estudiante por nombre, apellido o cédula..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all shadow-xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>

          <button
            onClick={() => onAddStudent(`${section.gradeYear} - Sección ${section.sectionLetter}`)}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer shrink-0"
            title="Buscar y agregar alumnos de cualquier sección o año"
          >
            <UserPlus className="w-4 h-4" />
            <span>Agregar Alumnos</span>
          </button>
        </div>

        {/* Filter Badges Carousel */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {(["TODOS", "APROBADOS", "APLAZADOS", "NO PRESENTÓ"] as FilterType[]).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`py-2 px-4 rounded-full text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-100" 
                    : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Students List Container */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, idx) => {
              const score = student.finalScore;
              let scoreColorClass = "bg-blue-50 text-blue-800 border-blue-200";
              let dotColorClass = "bg-blue-600";
              let statusLabel = "Aprobado";
              
              if (score >= 15.0) {
                // High performer
                scoreColorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
                dotColorClass = "bg-emerald-500";
                statusLabel = "Destacado";
              } else if (score >= 10.0) {
                // Average passing
                scoreColorClass = "bg-blue-50 text-blue-800 border-blue-200";
                dotColorClass = "bg-blue-500";
                statusLabel = "Aprobado";
              } else {
                // Failing
                scoreColorClass = "bg-rose-50 text-rose-800 border-rose-200";
                dotColorClass = "bg-rose-500";
                statusLabel = "Aplazado";
              }

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: idx * 0.02 }}
                  key={student.id}
                  className="bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs p-3.5 sm:p-4 rounded-2xl transition-all duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 group"
                >
                  {/* Top / Main info row: avatar and text */}
                  <div className="flex items-start sm:items-center justify-between sm:justify-start gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      {/* Visual initials badge */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-slate-700 text-xs sm:text-sm tracking-tight shrink-0 shadow-2xs font-mono">
                        {getInitials(student.firstName, student.lastName)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 tracking-tight text-sm sm:text-base leading-tight truncate">
                          {student.lastName}, {student.firstName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${scoreColorClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`}></span>
                            <span>Prom: {score.toFixed(1)}</span>
                          </span>
                          {student.cedula && (
                            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {student.cedula}
                            </span>
                          )}
                          {(student.gradeYear || student.sectionLetter) && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {student.gradeYear || ""} {student.sectionLetter ? `• Sec. ${student.sectionLetter}` : ""}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                            • {statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* On mobile: Quick delete button placed discreetly at top right */}
                    {onDeleteStudent && (
                      <div className="sm:hidden shrink-0">
                        {confirmDeleteId === student.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteStudent(student.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase transition hover:bg-rose-700 cursor-pointer"
                            >
                              Borrar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(student.id);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Retirar alumno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions: On mobile placed BELOW the text (full-width touch target), on desktop integrated cleanly into the row */}
                  <div className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t border-slate-100 sm:border-0 shrink-0">
                    {/* On desktop: Delete button */}
                    {onDeleteStudent && (
                      <div className="hidden sm:block">
                        {confirmDeleteId === student.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteStudent(student.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1.5 bg-rose-600 text-white rounded-xl text-[11px] font-bold uppercase transition hover:bg-rose-700 cursor-pointer shadow-2xs"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(student.id);
                            }}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                            title="Retirar alumno de la sección"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Primary Action Button: Below text on mobile (touch pattern), integrated on desktop */}
                    <button 
                      onClick={() => onSelectStudent(student.id)}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                      title="Administrar Calificaciones"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Calificar Alumno</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto sm:hidden" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-dashed border-slate-300 text-center py-12 px-6 rounded-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-700">No se encontraron estudiantes</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                No hay resultados que coincidan con la búsqueda "{searchQuery}" o con el filtro seleccionado.
              </p>
              <button 
                onClick={() => { setSearchQuery(""); setActiveFilter("TODOS"); }}
                className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                Limpiar Filtros
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Class Statistics Widget (Asymmetric Data Card) */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {/* Main average banner */}
        <div className="bg-blue-600 rounded-2xl p-5 text-white col-span-2 relative overflow-hidden shadow-xs">
          <div className="relative z-10">
            <span className="text-xs font-bold tracking-widest text-blue-100 uppercase block">
              RENDIMIENTO DE LA SECCIÓN
            </span>
            <h4 className="text-3xl font-extrabold mt-1 tracking-tight">
              {averages.overall} Promedio
            </h4>
            <div className="w-full bg-white/20 h-2 rounded-full mt-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(averages.overall / 20) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-white h-full rounded-full"
              ></motion.div>
            </div>
          </div>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            className="absolute -right-6 -bottom-6 text-white text-9xl pointer-events-none"
          >
            <TrendingUp className="w-32 h-32" />
          </motion.div>
        </div>

        {/* Small metric box Aprobados */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            APROBADOS
          </span>
          <p className="text-xl font-mono font-extrabold text-emerald-600 mt-1 flex items-baseline gap-1">
            {averages.passing} 
            <span className="text-xs font-sans font-medium text-slate-400 block">alumnos</span>
          </p>
        </div>

        {/* Small metric box Aplazados */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            APLAZADOS
          </span>
          <p className="text-xl font-mono font-extrabold text-rose-600 mt-1 flex items-baseline gap-1">
            {averages.failing}
            <span className="text-xs font-sans font-medium text-slate-400 block">alumnos</span>
          </p>
        </div>
      </div>

      {/* Floating Action Button for adding a student */}
      <div className="fixed right-6 bottom-24 z-40">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onAddStudent(`${section.gradeYear} - Sección ${section.sectionLetter}`)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer"
          title="Agregar nuevo alumno"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
    </motion.div>
  );
}
