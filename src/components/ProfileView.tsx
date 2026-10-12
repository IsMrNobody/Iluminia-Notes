import React, { useState } from "react";
import { TeacherProfile } from "../types";
import { isUserAdmin, getCurrentSchoolYear } from "../lib/adminService";
import { 
  User, 
  ShieldCheck, 
  Settings, 
  Bell, 
  Calendar, 
  ChevronRight, 
  LogOut, 
  TrendingUp, 
  Star, 
  Heart,
  Plus,
  Info,
  Check,
  UserPlus,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProfileViewProps {
  teacher: TeacherProfile;
  classAveragePerformance: number;
  totalStudentsCount: number;
  onLogout: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToAdmin?: () => void;
}

export default function ProfileView({
  teacher,
  classAveragePerformance,
  totalStudentsCount,
  onLogout,
  onNavigateToRegister,
  onNavigateToAdmin
}: ProfileViewProps) {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const isAdmin = isUserAdmin(teacher);

  const handleSettingsClick = (title: string) => {
    setActiveDialog(title);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-28 text-slate-900"
    >
      {/* Settings Modal Dialog Overlay */}
      <AnimatePresence>
        {activeDialog && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4"
            >
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                {activeDialog}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Esta sección de administración está protegida para conservar la integridad del expediente académico. 
                Los cambios requieren autenticación con firma digital institucional en la oficina central.
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveDialog(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Profile Banner Header */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar Container */}
          <div className="relative">
            <img 
              src={teacher.avatarUrl} 
              alt={teacher.name} 
              className="w-24 h-24 rounded-full border-2 border-blue-600 object-cover shadow-sm"
              referrerPolicy="no-referrer"
            />
            {/* Green Badge check */}
            <div className="absolute bottom-1 right-1 bg-emerald-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md">
              <Check className="text-white w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {teacher.name}
            </h2>
            <p className="text-xs font-semibold text-slate-400">
              Área: {teacher.department} • Año Escolar: {teacher.schoolYear}
            </p>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <span className="bg-blue-50 text-blue-700 font-bold text-[10px] tracking-widest px-3 py-1 rounded-full uppercase">
                {teacher.rank}
              </span>
              <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] tracking-widest px-3 py-1 rounded-full uppercase">
                {teacher.status}
              </span>
              {isAdmin && (
                <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] tracking-widest px-3 py-1 rounded-full uppercase flex items-center gap-1 border border-amber-200">
                  <ShieldCheck className="w-3 h-3 text-amber-600" />
                  ADMINISTRADOR
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bento Grid inside same section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Total de Alumnos
            </span>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-mono font-extrabold text-slate-900">
                {totalStudentsCount}
              </span>
              {totalStudentsCount > 0 ? (
                <span className="text-emerald-600 font-mono font-bold text-xs flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +{teacher.totalStudentsGrowthPercent || 0}%
                </span>
              ) : (
                <span className="text-slate-400 font-mono text-xs">
                  0 activos
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 flex flex-col justify-between">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Rendimiento Promedio
            </span>
            <div className="mt-2.5 flex items-baseline gap-1">
              <span className="text-3xl font-mono font-extrabold text-slate-900">
                {classAveragePerformance.toFixed(1)}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 20</span>
            </div>
          </div>

          <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                PROGRESO DEL LAPSO (LAPSO ACTIVO)
              </span>
              <span className="text-xs font-mono font-bold text-blue-600">
                {teacher.termProgressPercent || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full" 
                style={{ width: `${teacher.termProgressPercent || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </section>

      {/* Administrative Settings Option List */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-extrabold tracking-widest text-slate-400 px-1 uppercase">
          Configuración Administrativa
        </h3>
        
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          {[
            { 
              title: "Información Personal", 
              desc: "Actualiza tus datos de contacto y biografía", 
              icon: <User className="w-5 h-5 text-slate-400" /> 
            },
            { 
              title: "Seguridad y Privacidad", 
              desc: "Contraseña y autenticación de dos pasos", 
              icon: <ShieldCheck className="w-5 h-5 text-slate-400" /> 
            },
            { 
              title: "Preferencias de Notificaciones", 
              desc: "Gestiona alertas de notas y mensajes", 
              icon: <Bell className="w-5 h-5 text-slate-400" /> 
            },
            { 
              title: "Calendario Académico", 
              desc: `Ver horario del periodo ${teacher.schoolYear || getCurrentSchoolYear()}`, 
              icon: <Calendar className="w-5 h-5 text-slate-400" /> 
            }
          ].map((item, idx) => (
            <button 
              key={idx}
              onClick={() => handleSettingsClick(item.title)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-b-0 cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-slate-500">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-450 mt-0.5">{item.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-350 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-6 pt-2 space-y-3">
          {/* Admin Panel Button: Strictly visible only when user is admin (admin true / isAdmin) */}
          {isAdmin && onNavigateToAdmin && (
            <button 
              onClick={onNavigateToAdmin}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-widest uppercase p-4 rounded-2xl active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-slate-900/15 border border-slate-700 group"
            >
              <ShieldCheck className="w-4.5 h-4.5 text-amber-400 group-hover:rotate-6 transition-transform" />
              <span>PANEL DE ADMINISTRADOR</span>
            </button>
          )}

          {onNavigateToRegister && (
            <button 
              onClick={onNavigateToRegister}
              className="w-full bg-blue-600 text-white font-extrabold text-xs tracking-widest uppercase p-4 rounded-2xl hover:bg-blue-500 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <UserPlus className="w-4 h-4 text-white" />
              REGISTRAR NUEVO DOCENTE / CAMBIAR CUENTA
            </button>
          )}

          <button 
            onClick={onLogout}
            className="w-full bg-white text-rose-600 font-extrabold text-xs tracking-widest uppercase border border-slate-200 hover:border-rose-100 p-4 rounded-2xl hover:bg-rose-50/50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            CERRAR SESIÓN DOCENTE
          </button>
        </div>
      </section>
    </motion.div>
  );
}
