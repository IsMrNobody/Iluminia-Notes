import React, { useMemo } from "react";
import { ClassSection, PendingGradeTask, TeacherProfile, SubjectGroup } from "../types";
import { getWeightedFinalScore } from "../mockData";
import { getSubjectTheme } from "../utils/subjectThemes";
import { 
  Bell, 
  ChevronRight, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Plus,
  Check,
  Layers,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardViewProps {
  teacher: TeacherProfile;
  classes: ClassSection[];
  pendingTasks: PendingGradeTask[];
  activeLapso: 1 | 2 | 3;
  calendarCurrentLapso?: 1 | 2 | 3;
  termStartDate: string;
  termEndDate: string;
  currentDate?: string;
  termProgressPercent: number;
  onUpdateLapso: (lapso: 1 | 2 | 3) => void;
  onSyncCurrentLapso?: () => void;
  onUpdateDates: (dates: { start: string; end: string }) => void;
  onSelectClass: (classId: string) => void;
  onSelectSubject?: (subjectKey: string) => void;
  onQuickGrade: (studentId: string, classId: string) => void;
  onOpenNotifications: () => void;
  onOpenAlerts: () => void;
  onOpenAddClass?: () => void;
}

export default function DashboardView({
  teacher,
  classes,
  pendingTasks,
  activeLapso,
  calendarCurrentLapso = 1,
  termStartDate,
  termEndDate,
  currentDate,
  termProgressPercent,
  onUpdateLapso,
  onSyncCurrentLapso,
  onUpdateDates,
  onSelectClass,
  onSelectSubject,
  onQuickGrade,
  onOpenNotifications,
  onOpenAlerts,
  onOpenAddClass
}: DashboardViewProps) {
  // Synchronized current date (real-time system date)
  const todayStr = currentDate || (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  // Real calculations
  const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);
  const allStudents = classes.flatMap(c => c.students || []);

  // Real evaluations calculation
  let totalEvalsCount = 0;
  let completedEvalsCount = 0;
  if (allStudents.length > 0) {
    allStudents.forEach(std => {
      if (std.grades?.academic) {
        Object.values(std.grades.academic).forEach(item => {
          totalEvalsCount += 1;
          if (item?.score !== undefined && item.score > 0) {
            completedEvalsCount += 1;
          }
        });
      }
    });
  }

  // Real attendance average
  const avgAttendance = totalStudents > 0
    ? Math.round(allStudents.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / totalStudents)
    : 0;

  // Real submitted tasks percentage
  const submittedTasksPercent = totalStudents > 0
    ? Math.round((allStudents.filter(s => s.hasSubmittedLastQuiz).length / totalStudents) * 100)
    : 0;

  // Active classes count
  const activeClassesCount = classes.filter(c => c.isActive).length;

  // Group classes by Subject + Grade Year for hierarchical subject-sections navigation
  const subjectGroups = useMemo<SubjectGroup[]>(() => {
    const map = new Map<string, SubjectGroup>();
    classes.forEach(cls => {
      const key = `${cls.subjectName.trim().toLowerCase()}___${cls.gradeYear.trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          subjectName: cls.subjectName,
          gradeYear: cls.gradeYear,
          department: cls.department,
          lapso: cls.lapso,
          sections: [],
          totalStudents: 0,
          averageScore: 0,
          coverUrl: cls.coverUrl,
        });
      }
      const group = map.get(key)!;
      group.sections.push(cls);
    });

    return Array.from(map.values()).map(group => {
      group.sections.sort((a, b) => a.sectionLetter.localeCompare(b.sectionLetter));
      const groupStudents = group.sections.flatMap(s => s.students || []);
      group.totalStudents = groupStudents.length;
      let scoreSum = 0;
      let graded = 0;
      groupStudents.forEach(std => {
        const sc = getWeightedFinalScore(std.grades);
        if (sc > 0) {
          scoreSum += sc;
          graded += 1;
        }
      });
      group.averageScore = graded > 0 ? Number((scoreSum / graded).toFixed(1)) : 0;
      return group;
    });
  }, [classes]);

  // Real alert students count (score < 10 and score > 0)
  const alertStudentsCount = classes.reduce((acc, c) => {
    return acc + (c.students || []).filter(s => {
      const avg = getWeightedFinalScore(s.grades);
      return avg < 10 && avg > 0;
    }).length;
  }, 0);

  // Real-time term progress percentage (reflects current calendar elapsed time)
  const effectiveProgressPercent = termProgressPercent;

  // Dynamic date calculations based on actual synchronized calendar
  const totalDays = React.useMemo(() => {
    const start = new Date(termStartDate + "T00:00:00").getTime();
    const end = new Date(termEndDate + "T00:00:00").getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return 0;
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }, [termStartDate, termEndDate]);

  const elapsedDays = React.useMemo(() => {
    const start = new Date(termStartDate + "T00:00:00").getTime();
    const current = new Date(todayStr + "T00:00:00").getTime();
    const end = new Date(termEndDate + "T00:00:00").getTime();
    if (isNaN(start) || isNaN(current)) return 0;
    if (current <= start) return 0;
    if (current >= end) return totalDays;
    return Math.ceil((current - start) / (1000 * 60 * 60 * 24));
  }, [termStartDate, todayStr, termEndDate, totalDays]);

  const remainingDays = Math.max(0, totalDays - elapsedDays);

  const getLapsoOrdinalOption = (lapso: number) => {
    if (lapso === 1) return "1er";
    if (lapso === 2) return "2do";
    return "3er";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-24"
    >
      {/* Top Welcome Card */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        {/* Glow effect spans */}
        <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -z-10 opacity-60" />
        <span aria-hidden="true" className="pointer-events-none absolute left-1/3 bottom-0 w-24 h-24 bg-teal-50 rounded-full blur-2xl -z-10 opacity-40" />
        
        <div className="flex flex-col gap-3.5 mb-6">
          <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase bg-blue-50 border border-blue-200/60 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 self-start shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{teacher.schoolYear} • {activeLapso === calendarCurrentLapso ? `${getLapsoOrdinalOption(activeLapso)} Lapso Activo` : `${getLapsoOrdinalOption(activeLapso)} Lapso Seleccionado`}</span>
          </span>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Bienvenido de nuevo, {teacher.name || "Profesor"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {classes.length > 0
                  ? "Gestión académica y seguimiento de notas de sus estudiantes."
                  : "Aún no tienes asignaturas a cargo. Registra tu primera clase para comenzar."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start shrink-0">
              {activeLapso === calendarCurrentLapso ? (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold tracking-wide uppercase">
                    {getLapsoOrdinalOption(activeLapso).toUpperCase()} LAPSO ACTIVO
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onSyncCurrentLapso}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl transition shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                  title="Sincronizar y volver al lapso actual de hoy"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sincronizar a {getLapsoOrdinalOption(calendarCurrentLapso)} Lapso Actual</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <div className="flex justify-between items-end mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Progreso General del Lapso {activeLapso}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{elapsedDays} / {totalDays} días</span>
              </span>
            </div>
            <span className="text-sm font-extrabold text-blue-600 font-mono">{effectiveProgressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${effectiveProgressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-linear-to-r from-blue-600 to-indigo-600 rounded-full relative"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"></div>
            </motion.div>
          </div>
          <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-slate-400 font-medium pt-0.5">
            <span>Inicio: {termStartDate ? new Date(termStartDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}</span>
            <span className="text-slate-500 font-semibold">Quedan {remainingDays} días de clase</span>
            <span>Cierre: {termEndDate ? new Date(termEndDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}</span>
          </div>
        </div>
      </section>

      {/* Lapso and Date Controls Panel */}
      <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 sm:pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Gestión de Lapsos y Calendario Académico
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Configura el lapso activo y las fechas del período escolar sincronizadas con el calendario.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSyncCurrentLapso}
              className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs ${
                activeLapso === calendarCurrentLapso
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeLapso === calendarCurrentLapso ? "bg-emerald-500 animate-pulse" : "bg-white animate-ping"}`}></span>
              <span>{activeLapso === calendarCurrentLapso ? "Sincronizado con Hoy" : `Sincronizar a ${getLapsoOrdinalOption(calendarCurrentLapso)} Lapso`}</span>
            </button>
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0">
              <span>Hoy: {new Date(todayStr + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          {/* Active Lapso Selection - 5 cols */}
          <div className="md:col-span-5 space-y-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
              Lapso Activo Seleccionado
            </span>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onUpdateLapso(l)}
                  className={`py-2 sm:py-2.5 px-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    activeLapso === l
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/15 ring-2 ring-blue-600 ring-offset-1 sm:ring-offset-2"
                      : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span>{l}º Lapso</span>
                  {calendarCurrentLapso === l && (
                    <span className={`text-[9px] font-bold tracking-tight px-1.5 py-0.2 rounded-full ${
                      activeLapso === l ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      Actual
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Date Calendars Picker - 7 cols (compact 2 columns on mobile & desktop) */}
          <div className="md:col-span-7 grid grid-cols-2 gap-3 sm:gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block truncate">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={termStartDate}
                onChange={(e) => onUpdateDates({ start: e.target.value, end: termEndDate })}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 sm:p-3 focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-slate-50 font-mono tracking-tight text-slate-800"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block truncate">
                Fecha de Cierre
              </label>
              <input
                type="date"
                value={termEndDate}
                onChange={(e) => onUpdateDates({ start: termStartDate, end: e.target.value })}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 sm:p-3 focus:ring-1 focus:ring-blue-600 focus:outline-hidden bg-slate-50 font-mono tracking-tight text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Timeline Visualizer & Real-time Progress */}
        <div className="bg-slate-50/70 rounded-xl p-3.5 sm:p-4 border border-slate-200/60 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Cronograma Escolar: <strong className="text-slate-800 font-mono">{elapsedDays} / {totalDays} días</strong> transcurridos</span>
            </span>
            <span className="text-xs font-bold text-slate-500">
              Quedan <strong className="font-mono text-blue-600 text-[13px]">{remainingDays}</strong> días de clase
            </span>
          </div>

          {/* Timeline Bar representation */}
          <div className="relative pt-1">
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider mb-1.5 gap-1">
              <span className="truncate">Inicio: {termStartDate ? new Date(termStartDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}</span>
              <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0 flex items-center gap-1 text-[9px] sm:text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Hoy: {todayStr ? new Date(todayStr + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}
              </span>
              <span className="truncate text-right">Cierre: {termEndDate ? new Date(termEndDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}</span>
            </div>

            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden relative">
              <div 
                className="absolute left-0 top-0 h-full bg-blue-600 rounded-full"
                style={{ width: `${effectiveProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Real-time Status notifications */}
          {new Date(todayStr) < new Date(termStartDate) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="p-2 sm:p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-[11px] font-semibold flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Inicia el {termStartDate}.</span>
            </motion.div>
          )}

          {new Date(todayStr) > new Date(termEndDate) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="p-2 sm:p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800 text-[11px] font-semibold flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Lapso culminado.</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* Subjects & Sections (Mis Asignaturas a Cargo) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">
              Mis Asignaturas a Cargo
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {classes.length > 0 ? `Mostrando ${classes.length} clases activas` : "0 asignaturas registradas"}
            </span>
          </div>

          {onOpenAddClass && (
            <button
              onClick={onOpenAddClass}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Asignatura</span>
            </button>
          )}
        </div>

        {subjectGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjectGroups.map((group) => {
              const theme = getSubjectTheme(group.subjectName);

              return (
                <div 
                  key={group.key}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Graphics Cover */}
                  <div 
                    className="h-28 relative overflow-hidden bg-slate-900 cursor-pointer" 
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                      document.documentElement.scrollTop = 0;
                      document.body.scrollTop = 0;
                      const mainEl = document.querySelector("main");
                      if (mainEl) mainEl.scrollTop = 0;
                      if (onSelectSubject) {
                        onSelectSubject(group.key);
                      } else {
                        onSelectClass(group.sections[0].id);
                      }
                    }}
                  >
                    {group.coverUrl ? (
                      <img 
                        src={group.coverUrl} 
                        alt={group.subjectName} 
                        className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-r ${theme.bgGradient} opacity-85`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-950/40 to-transparent"></div>
                    
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 flex-wrap">
                      <span className={`${theme.badgeBg} text-white font-bold text-[10px] tracking-widest px-2.5 py-1 rounded-full uppercase backdrop-blur-xs shadow-xs`}>
                        {group.department}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold text-white tracking-tight">
                          {group.subjectName}
                        </h4>
                        <span className="bg-white/20 text-white font-bold text-xs px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {group.gradeYear}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/80 font-medium truncate mt-0.5">
                        Profesor: <strong className="text-white">{teacher.name}</strong> • {group.sections.length} {group.sections.length === 1 ? "sección" : "secciones"}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Secciones:</span>
                        {group.sections.map((sec) => (
                          <button
                            key={sec.id}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                              document.documentElement.scrollTop = 0;
                              document.body.scrollTop = 0;
                              const mainEl = document.querySelector("main");
                              if (mainEl) mainEl.scrollTop = 0;
                              onSelectClass(sec.id); 
                            }}
                            className={`text-xs font-black px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${theme.pillBg} ${theme.pillText} ${theme.pillBorder} ${theme.pillHoverBg}`}
                            title={`Ir a nómina de Sección ${sec.sectionLetter}`}
                          >
                            Sec. {sec.sectionLetter}
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-mono bg-slate-50 text-slate-700 font-bold px-2 py-1 rounded-md border border-slate-200/60 whitespace-nowrap">
                        Prom: <strong className={theme.statText}>{group.averageScore > 0 ? `${group.averageScore} / 20` : "S/N"}</strong> ({group.totalStudents} {group.totalStudents === 1 ? "alumno" : "alumnos"})
                      </span>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                          document.documentElement.scrollTop = 0;
                          document.body.scrollTop = 0;
                          const mainEl = document.querySelector("main");
                          if (mainEl) mainEl.scrollTop = 0;
                          if (onSelectSubject) {
                            onSelectSubject(group.key);
                          } else {
                            onSelectClass(group.sections[0].id);
                          }
                        }}
                        className={`flex-1 ${theme.btnBg} text-white font-bold text-xs tracking-wider uppercase py-2.5 px-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer group`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Ver Alumnos ({group.totalStudents})</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <BookOpen className="w-7 h-7" />
            </div>
            <h4 className="text-base font-extrabold text-slate-800">
              Sin asignaturas a cargo registradas
            </h4>
            <p className="text-xs text-slate-500 max-w-md mt-1.5 mb-5 leading-relaxed">
              No tienes asignaturas registradas actualmente. Si no tienes materias a cargo, todo se mantiene en cero hasta que agregues tu primera aula.
            </p>
            {onOpenAddClass && (
              <button
                onClick={onOpenAddClass}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase px-5 py-3 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Primera Asignatura</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Stats Quick Grid Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-8">
        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center flex flex-col justify-center items-center">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
            <Users className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xl font-mono font-extrabold text-slate-900 block mt-1">
            {totalStudents}
          </span>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Alumnos Totales
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center flex flex-col justify-center items-center">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xl font-mono font-extrabold text-slate-900 block mt-1">
            {submittedTasksPercent}%
          </span>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Tareas Entregadas
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center flex flex-col justify-center items-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xl font-mono font-extrabold text-slate-900 block mt-1">
            {activeClassesCount < 10 ? `0${activeClassesCount}` : activeClassesCount}
          </span>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Asignaturas Activas
          </span>
        </div>

        <button 
          onClick={onOpenAlerts}
          className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs text-center hover:bg-rose-50/50 hover:border-rose-100 transition-all flex flex-col justify-center items-center group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 group-hover:animate-bounce flex items-center justify-center mb-1">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          <span className="text-2xl font-mono font-extrabold text-rose-600 block mt-1">
            {alertStudentsCount < 10 ? `0${alertStudentsCount}` : alertStudentsCount}
          </span>
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase group-hover:text-rose-600 transition-colors">
            Alertas de Rendimiento
          </span>
        </button>
      </section>
    </motion.div>
  );
}
