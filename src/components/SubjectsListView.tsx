import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Layers, 
  Users, 
  Plus, 
  Search, 
  ChevronRight, 
  GraduationCap,
  Sparkles
} from "lucide-react";
import { SubjectGroup } from "../types";

interface SubjectsListViewProps {
  subjectGroups: SubjectGroup[];
  teacherName: string;
  onSelectSubject: (groupKey: string) => void;
  onSelectSection: (sectionId: string, groupKey: string) => void;
  onOpenAddClass: () => void;
}

export default function SubjectsListView({
  subjectGroups,
  teacherName,
  onSelectSubject,
  onSelectSection,
  onOpenAddClass
}: SubjectsListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = subjectGroups.filter(g => 
    g.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.gradeYear.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSections = subjectGroups.reduce((acc, g) => acc + g.sections.length, 0);
  const totalStudents = subjectGroups.reduce((acc, g) => acc + g.totalStudents, 0);
  const overallAvg = subjectGroups.length > 0
    ? (subjectGroups.reduce((acc, g) => acc + g.averageScore, 0) / subjectGroups.filter(g => g.averageScore > 0).length || 0).toFixed(1)
    : "0.0";

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

          <button
            onClick={onOpenAddClass}
            className="self-start sm:self-auto bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-xl transition shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Materia</span>
          </button>
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

            return (
              <div
                key={group.key}
                onClick={() => onSelectSubject(group.key)}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-400/80 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  {/* Card Cover Header */}
                  <div className="relative h-28 w-full bg-slate-900 overflow-hidden">
                    {group.coverUrl ? (
                      <img
                        src={group.coverUrl}
                        alt={group.subjectName}
                        className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 opacity-90 flex items-center justify-center">
                        <GraduationCap className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent"></div>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="bg-blue-600/90 text-white font-bold text-[10px] tracking-wider px-2.5 py-0.5 rounded-full uppercase backdrop-blur-xs shadow-xs">
                        {group.department}
                      </span>
                      <span className="bg-white/90 text-slate-800 font-extrabold text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {group.gradeYear}
                      </span>
                    </div>

                    {/* Subject Title */}
                    <div className="absolute bottom-2.5 left-3.5 right-3.5">
                      <h3 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                        {group.subjectName}
                      </h3>
                      <p className="text-[11px] text-blue-200 font-medium">
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
                              e.stopPropagation();
                              onSelectSection(sec.id, group.key);
                            }}
                            className="px-2.5 py-1 text-xs font-black rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-slate-700 transition cursor-pointer"
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
                        <strong className="text-sm font-extrabold text-blue-600 font-mono">
                          {group.averageScore > 0 ? `${group.averageScore.toFixed(1)} / 20` : "Sin notas"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
                  <button
                    type="button"
                    onClick={() => onSelectSubject(group.key)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Ver Alumnos</span>
                    <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
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
    </motion.div>
  );
}
