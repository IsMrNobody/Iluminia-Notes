import React, { useState, useEffect } from "react";
import { Student, StudentGrades } from "../types";
import { getWeightedFinalScore, getGradingProgressPercent } from "../mockData";
import { 
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Save,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  BookOpen,
  Info,
  Sliders,
  Check,
  Edit3,
  X,
  Percent,
  AlertCircle,
  RefreshCw,
  Clock,
  TrendingUp,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GradingViewProps {
  student: Student;
  className: string;
  onBack: () => void;
  onSave: (studentId: string, updatedGrades: Student["grades"]) => void;
  activeLapso?: 1 | 2 | 3;
  calendarCurrentLapso?: 1 | 2 | 3;
  onSelectLapso?: (lapso: 1 | 2 | 3) => void;
  onSyncCurrentLapso?: () => void;
  termProgressPercent?: number;
  termStartDate?: string;
  termEndDate?: string;
  todayDate?: string;
}

type AcademicKey = "homework" | "talentShow" | "assembly" | "essay" | "performance";
type EthicalKey = "responsibility" | "personalCare";

interface EditingItemState {
  category: "academic" | "ethical";
  key: AcademicKey | EthicalKey;
  name: string;
  description: string;
  weight: number;
}

export default function GradingView({
  student,
  className,
  onBack,
  onSave,
  activeLapso = 1,
  calendarCurrentLapso = 1,
  onSelectLapso,
  onSyncCurrentLapso,
  termProgressPercent = 0,
  termStartDate = "2026-10-01",
  termEndDate = "2026-12-18",
  todayDate = "2026-10-09"
}: GradingViewProps) {
  // Local state for all grade items to trigger real-time calculations
  const [hwScore, setHwScore] = useState<string>(student.grades.academic.homework.score?.toString() ?? "");
  const [talentScore, setTalentScore] = useState<string>(student.grades.academic.talentShow.score?.toString() ?? "");
  const [assemblyScore, setAssemblyScore] = useState<string>(student.grades.academic.assembly.score?.toString() ?? "");
  const [essayScore, setEssayScore] = useState<string>(student.grades.academic.essay.score?.toString() ?? "");
  const [performanceScore, setPerformanceScore] = useState<string>(student.grades.academic.performance.score?.toString() ?? "");
  
  const [responsibilityScore, setResponsibilityScore] = useState<string>(student.grades.ethical.responsibility.score?.toString() ?? "");
  const [personalCareScore, setPersonalCareScore] = useState<string>(student.grades.ethical.personalCare.score?.toString() ?? "");

  // Criteria metadata state (name, description, weight)
  const [criteria, setCriteria] = useState({
    academic: {
      homework: {
        name: student.grades.academic?.homework?.name || "Hoja de tarea",
        description: student.grades.academic?.homework?.description || "Comprensión conceptual y precisión en tareas.",
        weight: student.grades.academic?.homework?.weight ?? 20,
      },
      talentShow: {
        name: student.grades.academic?.talentShow?.name || "Muestra de talentos",
        description: student.grades.academic?.talentShow?.description || "Demostración práctica de habilidades adquiridas.",
        weight: student.grades.academic?.talentShow?.weight ?? 20,
      },
      assembly: {
        name: student.grades.academic?.assembly?.name || "Montaje",
        description: student.grades.academic?.assembly?.description || "Ensamblaje, estructura y coherencia del proyecto.",
        weight: student.grades.academic?.assembly?.weight ?? 20,
      },
      essay: {
        name: student.grades.academic?.essay?.name || "Ensayo",
        description: student.grades.academic?.essay?.description || "Calidad de preparación y repetición técnica.",
        weight: student.grades.academic?.essay?.weight ?? 20,
      },
      performance: {
        name: student.grades.academic?.performance?.name || "Puesta en escena",
        description: student.grades.academic?.performance?.description || "Presentación final y expresión creativa.",
        weight: student.grades.academic?.performance?.weight ?? 10,
      },
    },
    ethical: {
      responsibility: {
        name: student.grades.ethical?.responsibility?.name || "Responsabilidad",
        description: student.grades.ethical?.responsibility?.description || "Entrega a tiempo y compromiso con los plazos.",
        weight: student.grades.ethical?.responsibility?.weight ?? 5,
      },
      personalCare: {
        name: student.grades.ethical?.personalCare?.name || "Presentación Personal",
        description: student.grades.ethical?.personalCare?.description || "Cumplimiento del uniforme y estándares de higiene.",
        weight: student.grades.ethical?.personalCare?.weight ?? 5,
      },
    }
  });

  // State for active criterion being edited in modal
  const [editingItem, setEditingItem] = useState<EditingItemState | null>(null);
  const [feedbackToast, setFeedbackToast] = useState("");
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showLapsoInfoModal, setShowLapsoInfoModal] = useState<boolean>(false);

  // Sync state if student changes
  useEffect(() => {
    setHwScore(student.grades.academic.homework.score?.toString() ?? "");
    setTalentScore(student.grades.academic.talentShow.score?.toString() ?? "");
    setAssemblyScore(student.grades.academic.assembly.score?.toString() ?? "");
    setEssayScore(student.grades.academic.essay.score?.toString() ?? "");
    setPerformanceScore(student.grades.academic.performance.score?.toString() ?? "");
    setResponsibilityScore(student.grades.ethical.responsibility.score?.toString() ?? "");
    setPersonalCareScore(student.grades.ethical.personalCare.score?.toString() ?? "");

    setCriteria({
      academic: {
        homework: {
          name: student.grades.academic?.homework?.name || "Hoja de tarea",
          description: student.grades.academic?.homework?.description || "Comprensión conceptual y precisión en tareas.",
          weight: student.grades.academic?.homework?.weight ?? 20,
        },
        talentShow: {
          name: student.grades.academic?.talentShow?.name || "Muestra de talentos",
          description: student.grades.academic?.talentShow?.description || "Demostración práctica de habilidades adquiridas.",
          weight: student.grades.academic?.talentShow?.weight ?? 20,
        },
        assembly: {
          name: student.grades.academic?.assembly?.name || "Montaje",
          description: student.grades.academic?.assembly?.description || "Ensamblaje, estructura y coherencia del proyecto.",
          weight: student.grades.academic?.assembly?.weight ?? 20,
        },
        essay: {
          name: student.grades.academic?.essay?.name || "Ensayo",
          description: student.grades.academic?.essay?.description || "Calidad de preparación y repetición técnica.",
          weight: student.grades.academic?.essay?.weight ?? 20,
        },
        performance: {
          name: student.grades.academic?.performance?.name || "Puesta en escena",
          description: student.grades.academic?.performance?.description || "Presentación final y expresión creativa.",
          weight: student.grades.academic?.performance?.weight ?? 10,
        },
      },
      ethical: {
        responsibility: {
          name: student.grades.ethical?.responsibility?.name || "Responsabilidad",
          description: student.grades.ethical?.responsibility?.description || "Entrega a tiempo y compromiso con los plazos.",
          weight: student.grades.ethical?.responsibility?.weight ?? 5,
        },
        personalCare: {
          name: student.grades.ethical?.personalCare?.name || "Presentación Personal",
          description: student.grades.ethical?.personalCare?.description || "Cumplimiento del uniforme y estándares de higiene.",
          weight: student.grades.ethical?.personalCare?.weight ?? 5,
        },
      }
    });
  }, [student]);

  // Parse score string helper
  const parseInputValue = (v: string): number | undefined => {
    if (v.trim() === "") return undefined;
    const num = parseFloat(v);
    if (isNaN(num)) return undefined;
    return Math.max(0, Math.min(20, num));
  };

  // Build the live grades object with dynamic criteria and scores
  const liveGrades: StudentGrades = {
    academic: {
      homework: {
        ...student.grades.academic.homework,
        name: criteria.academic.homework.name,
        description: criteria.academic.homework.description,
        weight: criteria.academic.homework.weight,
        score: parseInputValue(hwScore),
      },
      talentShow: {
        ...student.grades.academic.talentShow,
        name: criteria.academic.talentShow.name,
        description: criteria.academic.talentShow.description,
        weight: criteria.academic.talentShow.weight,
        score: parseInputValue(talentScore),
      },
      assembly: {
        ...student.grades.academic.assembly,
        name: criteria.academic.assembly.name,
        description: criteria.academic.assembly.description,
        weight: criteria.academic.assembly.weight,
        score: parseInputValue(assemblyScore),
      },
      essay: {
        ...student.grades.academic.essay,
        name: criteria.academic.essay.name,
        description: criteria.academic.essay.description,
        weight: criteria.academic.essay.weight,
        score: parseInputValue(essayScore),
      },
      performance: {
        ...student.grades.academic.performance,
        name: criteria.academic.performance.name,
        description: criteria.academic.performance.description,
        weight: criteria.academic.performance.weight,
        score: parseInputValue(performanceScore),
      },
    },
    ethical: {
      responsibility: {
        ...student.grades.ethical.responsibility,
        name: criteria.ethical.responsibility.name,
        description: criteria.ethical.responsibility.description,
        weight: criteria.ethical.responsibility.weight,
        score: parseInputValue(responsibilityScore),
      },
      personalCare: {
        ...student.grades.ethical.personalCare,
        name: criteria.ethical.personalCare.name,
        description: criteria.ethical.personalCare.description,
        weight: criteria.ethical.personalCare.weight,
        score: parseInputValue(personalCareScore),
      },
    }
  };

  // Weight totals
  const academicTotalWeight = (Object.values(criteria.academic) as Array<{ weight: number }>).reduce((sum, item) => sum + (item.weight || 0), 0);
  const ethicalTotalWeight = (Object.values(criteria.ethical) as Array<{ weight: number }>).reduce((sum, item) => sum + (item.weight || 0), 0);
  const totalAllWeight = academicTotalWeight + ethicalTotalWeight;

  const calculatedFinalScore = getWeightedFinalScore(liveGrades);
  const gradingProgressPercent = getGradingProgressPercent(liveGrades);

  // Synchronized lapso and calendar calculations
  const lapsoTitle = `${activeLapso === 1 ? "1er" : activeLapso === 2 ? "2do" : "3er"} Lapso`;
  const isSynchronizedWithCalendar = activeLapso === calendarCurrentLapso;

  const totalDays = React.useMemo(() => {
    if (!termStartDate || !termEndDate) return 78;
    const start = new Date(termStartDate + "T00:00:00").getTime();
    const end = new Date(termEndDate + "T00:00:00").getTime();
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }, [termStartDate, termEndDate]);

  const daysElapsed = React.useMemo(() => {
    if (!termStartDate || !todayDate) return 8;
    const start = new Date(termStartDate + "T00:00:00").getTime();
    const current = new Date(todayDate + "T00:00:00").getTime();
    const diff = Math.round((current - start) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(totalDays, diff));
  }, [termStartDate, todayDate, totalDays]);

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
      }
    } catch (e) {}
    return dateStr;
  };

  // Save handler for editing criteria (name, description, weight)
  const handleSaveEditedCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const trimmedName = editingItem.name.trim();
    if (!trimmedName) return;

    const finalWeight = Math.max(1, Math.min(100, Number(editingItem.weight) || 1));

    setCriteria(prev => {
      if (editingItem.category === "academic") {
        return {
          ...prev,
          academic: {
            ...prev.academic,
            [editingItem.key as AcademicKey]: {
              name: trimmedName,
              description: editingItem.description.trim(),
              weight: finalWeight,
            }
          }
        };
      } else {
        return {
          ...prev,
          ethical: {
            ...prev.ethical,
            [editingItem.key as EthicalKey]: {
              name: trimmedName,
              description: editingItem.description.trim(),
              weight: finalWeight,
            }
          }
        };
      }
    });

    setFeedbackToast("¡Evaluación actualizada!");
    setTimeout(() => setFeedbackToast(""), 3000);
    setEditingItem(null);
  };

  // Full Save handling
  const handleSave = () => {
    onSave(student.id, liveGrades);
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
      onBack();
    }, 1200);
  };

  // Preset setter helper
  const adjustScore = (currentVal: string, amount: number, setter: (v: string) => void) => {
    let base = parseFloat(currentVal) || 0;
    let next = Math.max(0, Math.min(20, base + amount));
    setter((Math.round(next * 10) / 10).toString());
  };

  // Grade badge styling
  let scoreClass = "text-blue-600";
  if (calculatedFinalScore >= 15.0) {
    scoreClass = "text-emerald-600";
  } else if (calculatedFinalScore < 10.0 && calculatedFinalScore > 0) {
    scoreClass = "text-rose-600 font-bold";
  }

  // Lists for mapping
  const academicEvaluations = [
    { key: "homework" as const, item: criteria.academic.homework, val: hwScore, set: setHwScore, cat: "academic" as const },
    { key: "talentShow" as const, item: criteria.academic.talentShow, val: talentScore, set: setTalentScore, cat: "academic" as const },
    { key: "assembly" as const, item: criteria.academic.assembly, val: assemblyScore, set: setAssemblyScore, cat: "academic" as const },
    { key: "essay" as const, item: criteria.academic.essay, val: essayScore, set: setEssayScore, cat: "academic" as const },
    { key: "performance" as const, item: criteria.academic.performance, val: performanceScore, set: setPerformanceScore, cat: "academic" as const },
  ];

  const ethicalEvaluations = [
    { key: "responsibility" as const, item: criteria.ethical.responsibility, val: responsibilityScore, set: setResponsibilityScore, cat: "ethical" as const },
    { key: "personalCare" as const, item: criteria.ethical.personalCare, val: personalCareScore, set: setPersonalCareScore, cat: "ethical" as const },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
      className="space-y-6 pb-48 relative"
    >
      {/* Toast alert */}
      <AnimatePresence>
        {showSaveToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 30 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-xs tracking-wider uppercase"
          >
            <Check className="w-4 h-4" />
            ¡Notas guardadas!
          </motion.div>
        )}

        {feedbackToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 30 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-bold text-xs tracking-wider uppercase"
          >
            <CheckCircle2 className="w-4 h-4" />
            {feedbackToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={onBack}
            className="p-2.5 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-blue-600 tracking-tight leading-tight">
              Gestión de Notas y Plan de Evaluación
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Edita nombres, descripciones y porcentajes de cada criterio o carga calificaciones directamente.
            </p>
          </div>
        </div>

        {/* Total weight badge indicator */}
        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 self-start sm:self-auto text-xs font-mono font-bold ${
          totalAllWeight === 100
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-amber-50 text-amber-800 border-amber-200"
        }`}>
          <Percent className="w-3.5 h-3.5" />
          <span>Ponderación Total: {totalAllWeight}%</span>
          {totalAllWeight === 100 ? (
            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-sans uppercase">Correcto</span>
          ) : (
            <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-sans uppercase">Ajustar a 100%</span>
          )}
        </div>
      </div>

      {/* Student Profile Card Header - Compact & Clean */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Nombre del Estudiante
              </span>
              {!isSynchronizedWithCalendar && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Visualizando {lapsoTitle}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
                {student.lastName} {student.firstName}
              </h2>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-lg font-mono shadow-2xs">
                  Nota: {calculatedFinalScore !== undefined ? calculatedFinalScore.toFixed(1) : "—"}/20
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg font-mono shadow-2xs">
                  Avance: {gradingProgressPercent}%
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium font-mono mt-0.5">
              <span>Clase: {className}</span>
              <span>•</span>
              <span>ID: #{student.id.includes("-") ? `2024-${student.id.split("-")[1]}` : student.id}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            {/* Sync Button when out of sync */}
            {onSyncCurrentLapso && !isSynchronizedWithCalendar && (
              <button
                type="button"
                onClick={onSyncCurrentLapso}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer active:scale-95 transition-all"
                title="Sincronizar con el lapso escolar actual de hoy"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin-reverse" />
                <span className="hidden sm:inline">Sincronizar a {calendarCurrentLapso}° Lapso</span>
              </button>
            )}

            {/* Active Lapso Badge */}
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-2xs ${
              isSynchronizedWithCalendar
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-white"
            }`}>
              {isSynchronizedWithCalendar && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
              <span>{lapsoTitle} ACTIVO</span>
            </div>

            {/* Button with Dialog trigger to view lapso details and progress */}
            <button
              type="button"
              onClick={() => setShowLapsoInfoModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Ver detalles, calendario escolar y progreso del lapso en un diálogo"
            >
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Ver Información</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modal Diálogo: Información y Progreso del Lapso */}
      <AnimatePresence>
        {showLapsoInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLapsoInfoModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      Información del Lapso y Progreso
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {student.lastName} {student.firstName} • {className}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLapsoInfoModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                {/* Academic Lapso Selector */}
                {onSelectLapso && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <span>Seleccionar Lapso Académico</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {lapsoTitle} en curso
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {([1, 2, 3] as const).map((lNum) => {
                        const isCurrentActive = activeLapso === lNum;
                        const isCalendarLapso = calendarCurrentLapso === lNum;
                        return (
                          <button
                            key={lNum}
                            type="button"
                            onClick={() => onSelectLapso(lNum)}
                            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer border ${
                              isCurrentActive
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span className="font-sans">{lNum}° Lapso</span>
                            {isCalendarLapso && (
                              <span className={`text-[9px] font-semibold uppercase ${
                                isCurrentActive ? "text-emerald-200" : "text-emerald-600 font-bold"
                              }`}>
                                ● Fecha Actual
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Out of sync notice and sync button */}
                    {onSyncCurrentLapso && !isSynchronizedWithCalendar && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 shrink-0" /> Estás viendo un lapso distinto a la fecha actual
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onSyncCurrentLapso();
                          }}
                          className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Sincronizar a {calendarCurrentLapso}° Lapso</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Grid with the 2 progress cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 1. Term Progress (Calendar) */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-bold text-slate-700">
                          Progreso del Calendario
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-700">
                        {termProgressPercent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden mb-2">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out" 
                        style={{ width: `${Math.min(100, Math.max(0, termProgressPercent))}%` }}
                      ></div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center justify-between">
                        <span>Días cursados:</span>
                        <span className="font-bold text-slate-700 font-mono">{daysElapsed} de {totalDays}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Período:</span>
                        <span className="font-semibold text-slate-700">{formatDateDisplay(termStartDate)} — {formatDateDisplay(termEndDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Student Evaluation Progress */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-700">
                          Progreso de Evaluación
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {gradingProgressPercent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden mb-2">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out" 
                        style={{ width: `${Math.min(100, Math.max(0, gradingProgressPercent))}%` }}
                      ></div>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-500 font-medium">
                      <div className="flex items-center justify-between">
                        <span>Ponderación cargada:</span>
                        <span className="font-bold text-slate-700 font-mono">{totalAllWeight}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Estado:</span>
                        {gradingProgressPercent >= termProgressPercent ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Al día con el calendario
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold flex items-center gap-1 text-[10px]">
                            <Clock className="w-3 h-3 text-amber-600" /> Carga de notas pendiente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Snapshot summary */}
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/70 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium block">Calificación final calculada:</span>
                    <span className="text-base font-extrabold text-blue-900 font-mono">
                      {calculatedFinalScore !== undefined ? calculatedFinalScore.toFixed(2) : "0.00"} / 20.0
                    </span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-500 font-medium block">Lapso en visualización:</span>
                    <span className="font-extrabold text-blue-950 uppercase">{lapsoTitle}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowLapsoInfoModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm active:scale-95"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Criteria Details Input Container */}
      <div className="space-y-6">
        
        {/* EVALUACIÓN ACADÉMICA */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 flex items-center gap-2 uppercase">
              <BookOpen className="w-4 h-4 text-blue-600" />
              EVALUACIÓN ACADÉMICA ({academicTotalWeight}%)
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              5 evaluaciones configurables
            </span>
          </div>
          
          <div className="space-y-3">
            {academicEvaluations.map((item) => (
              <div 
                key={item.key}
                className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-blue-400 transition-colors shadow-xs group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                      {item.item.name}
                    </h4>
                    <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {item.item.weight}%
                    </span>

                    {/* Edit Evaluation Details Button */}
                    <button
                      type="button"
                      onClick={() => setEditingItem({
                        category: item.cat,
                        key: item.key,
                        name: item.item.name,
                        description: item.item.description,
                        weight: item.item.weight
                      })}
                      className="px-2 py-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      title="Editar nombre, descripción y porcentaje de esta evaluación"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.item.description || "Sin descripción asignada."}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {/* Quick helpers score adjusters */}
                  <div className="flex gap-1">
                    <button 
                      type="button"
                      onClick={() => adjustScore(item.val, -0.5, item.set)}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded-md font-mono text-xs text-slate-600 border border-slate-200 active:scale-90 cursor-pointer"
                      title="Restar 0.5 puntos"
                    >
                      -0.5
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustScore(item.val, 0.5, item.set)}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded-md font-mono text-xs text-slate-600 border border-slate-200 active:scale-90 cursor-pointer"
                      title="Sumar 0.5 puntos"
                    >
                      +0.5
                    </button>
                  </div>

                  <input 
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={item.val}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || (parseFloat(v) >= 0 && parseFloat(v) <= 20)) {
                        item.set(v);
                      }
                    }}
                    placeholder="0.0"
                    className="w-20 text-center font-mono font-extrabold text-lg text-slate-800 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REFERENTES ÉTICOS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 flex items-center gap-2 uppercase">
              <Award className="w-4 h-4 text-emerald-600" />
              REFERENTES ÉTICOS ({ethicalTotalWeight}%)
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              2 evaluaciones configurables
            </span>
          </div>

          <div className="space-y-3">
            {ethicalEvaluations.map((item) => (
              <div 
                key={item.key}
                className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-emerald-400 transition-colors shadow-xs group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                      {item.item.name}
                    </h4>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {item.item.weight}%
                    </span>

                    {/* Edit Evaluation Details Button */}
                    <button
                      type="button"
                      onClick={() => setEditingItem({
                        category: item.cat,
                        key: item.key,
                        name: item.item.name,
                        description: item.item.description,
                        weight: item.item.weight
                      })}
                      className="px-2 py-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      title="Editar nombre, descripción y porcentaje de esta evaluación ética"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.item.description || "Sin descripción asignada."}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <div className="flex gap-1">
                    <button 
                      type="button"
                      onClick={() => adjustScore(item.val, -0.5, item.set)}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded-md font-mono text-xs text-slate-600 border border-slate-200 active:scale-90 cursor-pointer"
                      title="Restar 0.5 puntos"
                    >
                      -0.5
                    </button>
                    <button 
                      type="button"
                      onClick={() => adjustScore(item.val, 0.5, item.set)}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded-md font-mono text-xs text-slate-600 border border-slate-200 active:scale-90 cursor-pointer"
                      title="Sumar 0.5 puntos"
                    >
                      +0.5
                    </button>
                  </div>

                  <input 
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={item.val}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || (parseFloat(v) >= 0 && parseFloat(v) <= 20)) {
                        item.set(v);
                      }
                    }}
                    placeholder="0.0"
                    className="w-20 text-center font-mono font-extrabold text-lg text-slate-800 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden bg-slate-50/50 focus:bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL: EDIT EVALUATION DETAILS (NOMBRE, DESCRIPCIÓN, PORCENTAJE) */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                      Configurar Criterio de Evaluación
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {editingItem.category === "academic" ? "Área Académica" : "Área Ética"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedCriterion} className="p-5 space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombre de la Evaluación *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="Ej: Examen Parcial, Taller Práctico, Proyecto Final"
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Nombre oficial visible en boletines y planillas.
                  </p>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Descripción / Pautas de Evaluación
                  </label>
                  <textarea
                    rows={3}
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    placeholder="Describe los temas a evaluar, pautas o rúbrica de calificación..."
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition resize-none leading-relaxed"
                  />
                </div>

                {/* Porcentaje / Peso */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ponderación / Porcentaje (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      required
                      value={editingItem.weight}
                      onChange={(e) => setEditingItem({ ...editingItem, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full text-sm font-mono font-bold px-3 py-2.5 pr-8 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                      %
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>Peso relativo en el cálculo de la nota final sobre 20.</span>
                    <span className="font-mono font-bold text-blue-600">Actual: {editingItem.weight}%</span>
                  </p>
                </div>

                {/* Action buttons */}
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm shadow-blue-200 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Criterio</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Sticky Action Footer Bar */}
      <div className="fixed bottom-16 left-0 w-full bg-white border-t border-slate-200 px-6 py-4 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase font-sans">
              CALIFICACIÓN FINAL (CALCULADA)
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-3xl font-mono font-extrabold leading-none ${scoreClass}`}>
                {calculatedFinalScore.toFixed(2)}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 20.0</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs tracking-widest uppercase px-7 py-3 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            GUARDAR NOTAS
          </button>
        </div>
      </div>
    </motion.div>
  );
}
