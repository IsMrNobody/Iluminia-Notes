import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  getWeightedFinalScore, 
  createEmptyGrades 
} from "./mockData";
import { ClassSection, Student, TeacherProfile, PendingGradeTask, SubjectGroup } from "./types";
import DashboardView from "./components/DashboardView";
import ClassOverviewView from "./components/ClassOverviewView";
import SubjectSectionsView from "./components/SubjectSectionsView";
import SubjectsListView from "./components/SubjectsListView";
import GradingView from "./components/GradingView";
import ProfileView from "./components/ProfileView";
import TeacherRegisterView from "./components/TeacherRegisterView";
import AdminPanelView from "./components/AdminPanelView";
import { 
  isUserAdmin, 
  getRegisteredStudentsForSection, 
  convertRegisteredToClassStudents 
} from "./lib/adminService";
import { 
  getSupabaseClient, 
  createSubjectInSupabase, 
  getTeacherClassesFromSupabase,
  addStudentToSupabase,
  saveGradesToSupabase,
  removeStudentFromClassInSupabase
} from "./lib/supabase";
import { 
  Sparkles,
  Bell, 
  Home, 
  School, 
  User, 
  X, 
  Plus, 
  Check, 
  AlertTriangle, 
  UserPlus, 
  ChevronRight, 
  LogOut,
  BookOpen,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function calculateProgressPercent(start: string, end: string, current: string): number {
  const startTime = new Date(start + "T00:00:00").getTime();
  const endTime = new Date(end + "T00:00:00").getTime();
  const currentTime = new Date(current + "T00:00:00").getTime();

  if (isNaN(startTime) || isNaN(endTime) || isNaN(currentTime)) return 0;
  if (endTime <= startTime) return 100;
  
  if (currentTime <= startTime) return 0;
  if (currentTime >= endTime) return 100;

  const total = endTime - startTime;
  const elapsed = currentTime - startTime;
  return Math.round((elapsed / total) * 100);
}

export function getCalendarLapsoForDate(
  dateStr: string,
  dates: Record<1 | 2 | 3, { start: string; end: string }>
): 1 | 2 | 3 {
  const target = new Date(dateStr + "T00:00:00").getTime();
  if (isNaN(target)) return 1;

  const l1Start = new Date(dates[1].start + "T00:00:00").getTime();
  const l1End = new Date(dates[1].end + "T23:59:59").getTime();
  if (target >= l1Start && target <= l1End) return 1;

  const l2Start = new Date(dates[2].start + "T00:00:00").getTime();
  const l2End = new Date(dates[2].end + "T23:59:59").getTime();
  if (target >= l2Start && target <= l2End) return 2;

  const l3Start = new Date(dates[3].start + "T00:00:00").getTime();
  const l3End = new Date(dates[3].end + "T23:59:59").getTime();
  if (target >= l3Start && target <= l3End) return 3;

  if (target < l1Start) return 1;
  if (target > l1End && target < l2Start) return 1;
  if (target > l2End && target < l3Start) return 2;
  return 3;
}

export default function App() {
  // Teacher session state (null when not logged in)
  const [teacher, setTeacher] = useState<TeacherProfile | null>(() => {
    const saved = localStorage.getItem("ilumina_current_teacher");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) {
          if (!parsed.email) {
            const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
            const firstEmail = Object.keys(creds)[0];
            parsed.email = firstEmail || "profesor@ilumina.edu";
          }
          return parsed;
        }
      } catch (e) {
        console.error("Error loading saved teacher:", e);
      }
    }
    return null;
  });

  // Classes state (empty or loaded from local storage, without any dummy example subjects)
  const [classes, setClasses] = useState<ClassSection[]>(() => {
    // Purge old mock storage
    localStorage.removeItem("ilumina_classes_state");
    const savedTeacher = localStorage.getItem("ilumina_current_teacher");
    if (savedTeacher) {
      try {
        const teacherObj = JSON.parse(savedTeacher);
        const emailKey = teacherObj?.email || teacherObj?.id || "default";
        const saved = localStorage.getItem(`ilumina_classes_${emailKey.toLowerCase()}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed.filter(c => 
              !c.id.startsWith("class-math-") && 
              !c.id.startsWith("class-crp-") && 
              !c.id.startsWith("mock-") &&
              c.id !== "class-init" && 
              !c.subjectName?.includes("Aula 1") && 
              c.subjectName !== "Cátedra Principal"
            );
          }
        }
      } catch (e) {
        console.error("Error loading saved classes:", e);
      }
    }
    return [];
  });

  // Automatically fetch teacher's real subjects from Supabase whenever teacher changes
  useEffect(() => {
    if (!teacher) {
      setClasses([]);
      return;
    }

    const teacherIdentifier = teacher.id || teacher.email || "";
    if (!teacherIdentifier) return;

    let isMounted = true;
    getTeacherClassesFromSupabase(teacherIdentifier, teacher.name)
      .then((supaClasses) => {
        if (!isMounted) return;
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        if (supaClasses && supaClasses.length > 0) {
          // Auto-fill students registered for this year and section if class has none
          const enriched = supaClasses.map(cls => {
            if (!cls.students || cls.students.length === 0) {
              const matching = getRegisteredStudentsForSection(cls.gradeYear, cls.sectionLetter);
              if (matching.length > 0) {
                return {
                  ...cls,
                  students: convertRegisteredToClassStudents(matching),
                };
              }
            }
            return cls;
          });
          setClasses(enriched);
          localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(enriched));
        } else {
          // If classes were saved locally for this teacher, check and retain them
          const localSaved = localStorage.getItem(`ilumina_classes_${storageKey}`);
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setClasses(parsed);
                return;
              }
            } catch {}
          }
          setClasses([]);
          localStorage.removeItem(`ilumina_classes_${storageKey}`);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch classes from Supabase:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [teacher?.id, teacher?.email]);

  // Synchronize teacher admin status live from Supabase (e.g. when modified in Supabase Table Editor)
  useEffect(() => {
    if (!teacher?.email && !teacher?.id) return;
    const client: any = getSupabaseClient();
    const query = teacher.id
      ? client.from("profesores").select("*").eq("id", teacher.id)
      : client.from("profesores").select("*").eq("email", teacher.email.toLowerCase());

    let isMounted = true;
    query.maybeSingle().then(({ data }: any) => {
      if (!isMounted || !data) return;
      const adminFromDb = Boolean(
        data.is_admin === true ||
        data.admin === true ||
        data.isAdmin === true ||
        String(data.status || "").toLowerCase().includes("admin") ||
        String(data.rango || "").toLowerCase().includes("admin") ||
        String(data.rol || data.role || "").toLowerCase() === "admin"
      );

      if (adminFromDb !== Boolean(teacher.isAdmin) || (data.status && data.status !== teacher.status)) {
        setTeacher(prev => prev ? {
          ...prev,
          isAdmin: adminFromDb,
          status: data.status || (adminFromDb ? "ADMIN" : prev.status),
        } : prev);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [teacher?.id, teacher?.email]);

  const [pendingTasks, setPendingTasks] = useState<PendingGradeTask[]>([]);

  // Helper to obtain actual real-world today date (YYYY-MM-DD)
  const getTodayDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDateString();

  // Term and Date Management states
  const [lapsoDates, setLapsoDates] = useState<Record<1 | 2 | 3, { start: string; end: string }>>(() => {
    const saved = localStorage.getItem("ilumina_lapso_dates");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[1]?.start && parsed[1]?.end) {
          return {
            1: { start: parsed[1].start, end: parsed[1].end },
            2: { start: parsed[2].start, end: parsed[2].end },
            3: { start: parsed[3].start, end: parsed[3].end },
          };
        }
      } catch (e) {}
    }
    return {
      1: { start: "2026-10-01", end: "2026-12-18" },
      2: { start: "2027-01-08", end: "2027-03-26" },
      3: { start: "2027-04-12", end: "2027-07-16" }
    };
  });

  // Calculate calendar real-time current lapso based on today's date
  const calendarCurrentLapso = useMemo(() => {
    return getCalendarLapsoForDate(todayDate, lapsoDates);
  }, [todayDate, lapsoDates]);

  const [activeLapso, setActiveLapso] = useState<1 | 2 | 3>(() => {
    const saved = localStorage.getItem("ilumina_active_lapso");
    if (saved) {
      const parsed = parseInt(saved);
      if (parsed === 1 || parsed === 2 || parsed === 3) {
        return parsed as 1 | 2 | 3;
      }
    }
    // Synchronize by default with the calendar current lapso in real time
    return getCalendarLapsoForDate(getTodayDateString(), {
      1: { start: "2026-10-01", end: "2026-12-18" },
      2: { start: "2027-01-08", end: "2027-03-26" },
      3: { start: "2027-04-12", end: "2027-07-16" }
    });
  });

  const handleSyncWithCurrentLapso = () => {
    setActiveLapso(calendarCurrentLapso);
  };

  // Calculate dynamic progress synchronized with real-time current date
  const currentLapsoPeriod = lapsoDates[activeLapso] || { start: "2026-10-01", end: "2026-12-18" };
  const termProgressPercent = calculateProgressPercent(
    currentLapsoPeriod.start,
    currentLapsoPeriod.end,
    todayDate
  );

  // Keep teacher's termProgressPercent in sync
  useEffect(() => {
    if (teacher && teacher.termProgressPercent !== termProgressPercent) {
      setTeacher(prev => prev ? { ...prev, termProgressPercent } : prev);
    }
  }, [termProgressPercent]);

  // Persist teacher profile to localStorage
  useEffect(() => {
    if (teacher) {
      localStorage.setItem("ilumina_current_teacher", JSON.stringify(teacher));
    } else {
      localStorage.removeItem("ilumina_current_teacher");
    }
  }, [teacher]);

  // Persist settings to localstorage
  useEffect(() => {
    localStorage.setItem("ilumina_active_lapso", activeLapso.toString());
  }, [activeLapso]);

  useEffect(() => {
    localStorage.setItem("ilumina_lapso_dates", JSON.stringify(lapsoDates));
  }, [lapsoDates]);

  // Synchronize dynamic terms and percentages across all ClassSection states
  useEffect(() => {
    setClasses(prevClasses => {
      const hasDiff = prevClasses.some(c => c.lapso !== activeLapso || c.termPercentage !== termProgressPercent);
      if (!hasDiff) return prevClasses;
      return prevClasses.map(cls => ({
        ...cls,
        lapso: activeLapso,
        termPercentage: termProgressPercent
      }));
    });
  }, [activeLapso, termProgressPercent]);

  // Layout and routing states
  const [activeTab, setActiveTab] = useState<"home" | "classes" | "profile" | "admin">("home");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"subjects_list" | "subject_sections" | "section_students">("subjects_list");
  const mainContentRef = useRef<HTMLElement>(null);

  // Automatically scroll to the top when navigating between views, sections, or students
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
      }
      const mainEl = document.querySelector("main");
      if (mainEl) {
        mainEl.scrollTop = 0;
      }
    };

    scrollToTop();
    const animFrame = requestAnimationFrame(scrollToTop);
    const timer = setTimeout(scrollToTop, 20);

    return () => {
      cancelAnimationFrame(animFrame);
      clearTimeout(timer);
    };
  }, [activeTab, viewMode, selectedClassId, selectedStudentId]);

  // Overlay states
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudentFirst, setNewStudentFirst] = useState("");
  const [newStudentLast, setNewStudentLast] = useState("");
  const [successToast, setSuccessToast] = useState("");

  // Add class modal state - default with all sections selected (A, B, C, D, E, F)
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClassSubject, setNewClassSubject] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("1er Año");
  const [newClassSection, setNewClassSection] = useState("A");
  const [selectedSections, setSelectedSections] = useState<string[]>(["A", "B", "C", "D", "E", "F"]);
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // Group classes by Subject + Grade Year for hierarchical subject-sections navigation
  const subjectGroups = React.useMemo<SubjectGroup[]>(() => {
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

  // Persist state to localstorage scoped to current teacher
  useEffect(() => {
    if (teacher?.email) {
      if (classes.length > 0) {
        localStorage.setItem(`ilumina_classes_${teacher.email.toLowerCase()}`, JSON.stringify(classes));
      } else {
        localStorage.removeItem(`ilumina_classes_${teacher.email.toLowerCase()}`);
      }
    }
  }, [classes, teacher?.email]);

  // Current selected class (null if no classes exist)
  const currentClass: ClassSection | null = classes.find(c => c.id === selectedClassId) || classes[0] || null;

  // Current active subject group
  const currentSubjectGroup: SubjectGroup | null = React.useMemo(() => {
    if (selectedSubjectKey) {
      const found = subjectGroups.find(g => g.key === selectedSubjectKey);
      if (found) return found;
    }
    if (currentClass) {
      const key = `${currentClass.subjectName.trim().toLowerCase()}___${currentClass.gradeYear.trim().toLowerCase()}`;
      const found = subjectGroups.find(g => g.key === key);
      if (found) return found;
    }
    return subjectGroups[0] || null;
  }, [subjectGroups, selectedSubjectKey, currentClass]);

  // Sibling sections for the active class (same subject & gradeYear)
  const siblingSections = React.useMemo(() => {
    if (!currentClass) return [];
    return classes.filter(
      c => c.subjectName.trim().toLowerCase() === currentClass.subjectName.trim().toLowerCase() &&
           c.gradeYear.trim().toLowerCase() === currentClass.gradeYear.trim().toLowerCase()
    ).sort((a, b) => a.sectionLetter.localeCompare(b.sectionLetter));
  }, [classes, currentClass]);

  const currentStudent = selectedStudentId && currentClass?.students
    ? currentClass.students.find(s => s.id === selectedStudentId) || null 
    : null;

  // Handle saving student grades and evaluation criteria
  const handleSaveStudentGrades = async (studentId: string, updatedGrades: Student["grades"]) => {
    if (!currentClass) return;

    // 1. Optimistic UI update
    setClasses(prevClasses => {
      const nextClasses = prevClasses.map(cls => {
        const studentIndex = cls.students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) return cls;

        const updatedStudents = cls.students.map(s => {
          if (s.id === studentId) {
            return {
              ...s,
              grades: updatedGrades
            };
          }
          // Propagate updated evaluation criteria (name, description, weight) to other students in the section
          return {
            ...s,
            grades: {
              academic: {
                homework: { ...s.grades.academic.homework, name: updatedGrades.academic.homework.name, description: updatedGrades.academic.homework.description, weight: updatedGrades.academic.homework.weight },
                talentShow: { ...s.grades.academic.talentShow, name: updatedGrades.academic.talentShow.name, description: updatedGrades.academic.talentShow.description, weight: updatedGrades.academic.talentShow.weight },
                assembly: { ...s.grades.academic.assembly, name: updatedGrades.academic.assembly.name, description: updatedGrades.academic.assembly.description, weight: updatedGrades.academic.assembly.weight },
                essay: { ...s.grades.academic.essay, name: updatedGrades.academic.essay.name, description: updatedGrades.academic.essay.description, weight: updatedGrades.academic.essay.weight },
                performance: { ...s.grades.academic.performance, name: updatedGrades.academic.performance.name, description: updatedGrades.academic.performance.description, weight: updatedGrades.academic.performance.weight },
              },
              ethical: {
                responsibility: { ...s.grades.ethical.responsibility, name: updatedGrades.ethical.responsibility.name, description: updatedGrades.ethical.responsibility.description, weight: updatedGrades.ethical.responsibility.weight },
                personalCare: { ...s.grades.ethical.personalCare, name: updatedGrades.ethical.personalCare.name, description: updatedGrades.ethical.personalCare.description, weight: updatedGrades.ethical.personalCare.weight },
              }
            }
          };
        });

        return {
          ...cls,
          students: updatedStudents
        };
      });

      if (teacher?.email || teacher?.id) {
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(nextClasses));
      }
      return nextClasses;
    });

    // 2. Persist to database silently and reliably
    try {
      await saveGradesToSupabase(currentClass.id, studentId, updatedGrades, currentClass.lapso || activeLapso);
    } catch (e) {
      console.warn("Could not persist grades to Supabase:", e);
    }

    setSuccessToast("¡Notas guardadas!");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Handle adding a student to the selected class
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentFirst.trim() || !newStudentLast.trim() || !currentClass) return;

    const firstName = newStudentFirst.trim();
    const lastName = newStudentLast.trim().toUpperCase();

    // Reset form inputs immediately
    setNewStudentFirst("");
    setNewStudentLast("");
    setIsAddStudentOpen(false);

    // Call Supabase persistence
    const res = await addStudentToSupabase(currentClass.id, {
      firstName,
      lastName,
      currentClassStudentsCount: currentClass.students.length,
    });

    const newStudent = res.student;

    setClasses(prevClasses => {
      const nextClasses = prevClasses.map(cls => {
        if (cls.id !== currentClass.id) return cls;
        return {
          ...cls,
          students: [...cls.students, newStudent]
        };
      });

      if (teacher?.email || teacher?.id) {
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(nextClasses));
      }
      return nextClasses;
    });

    setSuccessToast("¡Alumno guardado!");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Handle removing a student from the selected class
  const handleDeleteStudent = async (studentId: string) => {
    if (!currentClass) return;
    const std = currentClass.students.find(s => s.id === studentId);
    const stdName = std ? `${std.firstName}` : "Estudiante";

    // Update UI state immediately
    setClasses(prevClasses => {
      const nextClasses = prevClasses.map(cls => {
        if (cls.id !== currentClass.id) return cls;
        return {
          ...cls,
          students: cls.students.filter(s => s.id !== studentId)
        };
      });

      if (teacher?.email || teacher?.id) {
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(nextClasses));
      }
      return nextClasses;
    });

    // Delete from Supabase in background
    try {
      await removeStudentFromClassInSupabase(currentClass.id, studentId);
    } catch {}

    setSuccessToast("¡Alumno retirado!");
    setTimeout(() => setSuccessToast(""), 3000);
  };

  // Handle adding an additional section to an existing subject
  const handleAddNewSectionToSubject = async (sectionLetter: string) => {
    if (!currentSubjectGroup || !teacher) return;
    const cleanLetter = sectionLetter.trim().toUpperCase();
    if (currentSubjectGroup.sections.some(s => s.sectionLetter.toUpperCase() === cleanLetter)) {
      setSuccessToast(`Sección ${cleanLetter} ya existe.`);
      setTimeout(() => setSuccessToast(""), 3000);
      return;
    }

    const teacherIdentifier = teacher.id || teacher.email || "";
    const result = await createSubjectInSupabase(teacherIdentifier, {
      subjectName: currentSubjectGroup.subjectName,
      gradeYear: currentSubjectGroup.gradeYear,
      sectionLetter: cleanLetter,
      sections: [cleanLetter],
      department: currentSubjectGroup.department || teacher.department,
      lapso: activeLapso,
      teacherId: teacher.id,
      teacherName: teacher.name,
    });

    if (result.success) {
      const createdList = result.newClasses && result.newClasses.length > 0 
        ? result.newClasses 
        : (result.newClass ? [result.newClass] : []);

      if (createdList.length > 0) {
        // Automatically populate with pre-registered students for this year and section
        const enrichedList = createdList.map(cls => {
          if (!cls.students || cls.students.length === 0) {
            const matching = getRegisteredStudentsForSection(cls.gradeYear, cls.sectionLetter);
            if (matching.length > 0) {
              return {
                ...cls,
                students: convertRegisteredToClassStudents(matching),
              };
            }
          }
          return cls;
        });

        setClasses(prev => {
          const next = [...prev, ...enrichedList];
          const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
          localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(next));
          return next;
        });
        setSuccessToast(`¡Sección ${cleanLetter} agregada con alumnos!`);
        setTimeout(() => setSuccessToast(""), 3000);
      }
    } else {
      setSuccessToast("Error al agregar sección.");
      setTimeout(() => setSuccessToast(""), 3000);
    }
  };

  // Handle creating a real subject in Supabase & local state assigned to teacher with all sections
  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassSubject.trim() || !teacher) return;
    setIsCreatingClass(true);

    const teacherIdentifier = teacher.id || teacher.email || "";
    const sectionsToSave = selectedSections.length > 0 ? selectedSections : ["A"];

    const result = await createSubjectInSupabase(teacherIdentifier, {
      subjectName: newClassSubject.trim(),
      gradeYear: newClassGrade,
      sectionLetter: sectionsToSave[0],
      sections: sectionsToSave,
      department: teacher.department,
      lapso: activeLapso,
      teacherId: teacher.id,
      teacherName: teacher.name,
    });

    setIsCreatingClass(false);
    const createdList = result.newClasses && result.newClasses.length > 0 
      ? result.newClasses 
      : (result.newClass ? [result.newClass] : []);

    if (result.success && createdList.length > 0) {
      // Auto-fill students registered for this year and section
      const enrichedList = createdList.map(cls => {
        if (!cls.students || cls.students.length === 0) {
          const matching = getRegisteredStudentsForSection(cls.gradeYear, cls.sectionLetter);
          if (matching.length > 0) {
            return {
              ...cls,
              students: convertRegisteredToClassStudents(matching),
            };
          }
        }
        return cls;
      });

      setClasses(prev => {
        const next = [...prev];
        enrichedList.forEach(item => {
          const idx = next.findIndex(c => c.id === item.id);
          if (idx >= 0) {
            next[idx] = item;
          } else {
            next.push(item);
          }
        });
        const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
        localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(next));
        return next;
      });

      setSelectedClassId(enrichedList[0].id);
      const groupKey = `${enrichedList[0].subjectName.trim().toLowerCase()}___${enrichedList[0].gradeYear.trim().toLowerCase()}`;
      setSelectedSubjectKey(groupKey);
      setViewMode("section_students");
      setActiveTab("classes");
      setIsAddClassOpen(false);
      setNewClassSubject("");
      setSelectedSections(["A", "B", "C", "D", "E", "F"]);

      // If teacher did not have id stored, update profile with real database profesorId
      if (result.profesorId && !teacher.id) {
        setTeacher(prev => prev ? { ...prev, id: result.profesorId } : null);
      }

      setSuccessToast("¡Materia agregada con nómina de alumnos!");
      setTimeout(() => setSuccessToast(""), 3000);
    } else {
      setSuccessToast("Error al registrar materia.");
      setTimeout(() => setSuccessToast(""), 3000);
    }
  };

  // Global dynamic statistics aggregate for teacher profiles
  const globalAggregates = React.useMemo(() => {
    let totalScoreSum = 0;
    let totalStudentsWeighted = 0;
    classes.forEach(cls => {
      cls.students?.forEach(std => {
        totalScoreSum += getWeightedFinalScore(std.grades);
        totalStudentsWeighted += 1;
      });
    });

    return {
      averageScore: totalStudentsWeighted > 0 ? Number((totalScoreSum / totalStudentsWeighted).toFixed(1)) : 0.0,
      totalStudents: totalStudentsWeighted
    };
  }, [classes]);

  // Finding students with low averages (<10) for real-time alerts drawer
  const alertStudents = React.useMemo(() => {
    const list: Array<{ student: Student; className: string; score: number }> = [];
    classes.forEach(cls => {
      cls.students?.forEach(std => {
        const avg = getWeightedFinalScore(std.grades);
        if (avg < 10 && avg > 0) {
          list.push({
            student: std,
            className: `${cls.gradeYear} - Sección ${cls.sectionLetter}`,
            score: avg
          });
        }
      });
    });
    return list;
  }, [classes]);

  // 1. ENTRY SCREEN: If no teacher is logged in, show Register / Login Portal directly!
  if (!teacher) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 text-slate-900">
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 15, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs tracking-wider uppercase px-6 py-3 shadow-xl rounded-full flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {successToast}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-4xl mx-auto">
          <TeacherRegisterView
            onRegisterSuccess={(newTeacher, initialClassOrClasses, message) => {
              setTeacher(newTeacher);
              const rawClasses: ClassSection[] = Array.isArray(initialClassOrClasses)
                ? initialClassOrClasses
                : initialClassOrClasses ? [initialClassOrClasses] : [];
              const loadedClasses: ClassSection[] = rawClasses.map(cls => {
                if (!cls.students || cls.students.length === 0) {
                  const matching = getRegisteredStudentsForSection(cls.gradeYear, cls.sectionLetter);
                  if (matching.length > 0) {
                    return {
                      ...cls,
                      students: convertRegisteredToClassStudents(matching),
                    };
                  }
                }
                return cls;
              });
              setClasses(loadedClasses);
              const teacherKey = (newTeacher.email || "default").toLowerCase();
              if (loadedClasses.length > 0) {
                setSelectedClassId(loadedClasses[0].id);
                localStorage.setItem(`ilumina_classes_${teacherKey}`, JSON.stringify(loadedClasses));
              } else {
                setSelectedClassId("");
                localStorage.removeItem(`ilumina_classes_${teacherKey}`);
              }
              setActiveTab("home");
              setSelectedStudentId(null);
              setSuccessToast("¡Bienvenido(a)!");
              setTimeout(() => setSuccessToast(""), 3000);
            }}
          />
        </div>
      </div>
    );
  }

  // 2. MAIN TEACHER DASHBOARD: When teacher is logged in
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 15, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs tracking-wider uppercase px-6 py-3 shadow-xl rounded-full flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {successToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Left side) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider text-white">ILUMINA</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                Central Academy
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Buttons */}
        <nav className="flex-1 p-4 space-y-1.5 pt-6">
          <button
            onClick={() => { setActiveTab("home"); setSelectedStudentId(null); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold text-xs tracking-wider uppercase transition-colors text-left cursor-pointer ${
              activeTab === "home" && !selectedStudentId
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Home className="w-4.5 h-4.5" />
            Panel de Control
          </button>

          <button
            onClick={() => { setActiveTab("classes"); setViewMode("subjects_list"); setSelectedStudentId(null); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold text-xs tracking-wider uppercase transition-colors text-left cursor-pointer ${
              activeTab === "classes" && !selectedStudentId
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <School className="w-4.5 h-4.5" />
            Mis Clases
          </button>

          <button
            onClick={() => { setActiveTab("profile"); setSelectedStudentId(null); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold text-xs tracking-wider uppercase transition-colors text-left cursor-pointer ${
              activeTab === "profile" && !selectedStudentId
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <User className="w-4.5 h-4.5" />
            Mi Perfil
          </button>

          {isUserAdmin(teacher) && (
            <button
              onClick={() => { setActiveTab("admin"); setSelectedStudentId(null); }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg font-bold text-xs tracking-wider uppercase transition-colors text-left cursor-pointer ${
                activeTab === "admin" && !selectedStudentId
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-amber-400 hover:bg-slate-800 hover:text-amber-300"
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              Administrador
            </button>
          )}
        </nav>

        {/* Current Teacher mini card & Logout in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <img 
              src={teacher.avatarUrl} 
              alt={teacher.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-700"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{teacher.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{teacher.rank}</p>
            </div>
          </div>

          <button
            onClick={() => {
              getSupabaseClient().auth.signOut().catch(() => {});
              if (teacher?.email) {
                localStorage.removeItem(`ilumina_classes_${teacher.email.toLowerCase()}`);
              }
              localStorage.removeItem("ilumina_classes_state");
              localStorage.removeItem("ilumina_current_teacher");
              setClasses([]);
              setTeacher(null);
              setSuccessToast("Sesión cerrada.");
              setTimeout(() => setSuccessToast(""), 3000);
            }}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-rose-400 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* Global Toolbar Header */}
        <header className="fixed md:sticky top-0 w-full z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 leading-none">
                Ilumina
              </h1>
              <span className="text-[9px] font-bold text-blue-600 tracking-wider">
                Central Academy
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => { setActiveTab("home"); setSelectedStudentId(null); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              Docente
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            {activeTab === "home" && (
              <span className="text-xs font-mono font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">
                Panel General
              </span>
            )}
            {activeTab === "profile" && (
              <span className="text-xs font-mono font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">
                Perfil
              </span>
            )}
            {activeTab === "admin" && (
              <span className="text-xs font-mono font-bold text-amber-700 uppercase bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Administración
              </span>
            )}
            {activeTab === "classes" && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => { setViewMode("subjects_list"); setSelectedStudentId(null); }}
                  className={`text-xs font-bold transition cursor-pointer ${
                    viewMode === "subjects_list" && !selectedStudentId
                      ? "text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono uppercase"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Mis Materias
                </button>
                {viewMode !== "subjects_list" && currentSubjectGroup && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <button
                      onClick={() => { setViewMode("subject_sections"); setSelectedStudentId(null); }}
                      className={`text-xs font-bold transition cursor-pointer ${
                        viewMode === "subject_sections" && !selectedStudentId
                          ? "text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-mono"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {currentSubjectGroup.subjectName} ({currentSubjectGroup.gradeYear})
                    </button>
                  </>
                )}
                {viewMode === "section_students" && currentClass && !selectedStudentId && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-xs font-mono font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">
                      Sec. {currentClass.sectionLetter}
                    </span>
                  </>
                )}
                {selectedStudentId && currentStudent && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="text-xs font-mono font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">
                      Calificar: {currentStudent.lastName}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Quick alert indicator button */}
            <button
              onClick={() => setIsAlertsOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 relative cursor-pointer"
              title="Alertas Académicas"
            >
              <AlertTriangle className="w-5 h-5" />
              {alertStudents.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>

            {/* Notification button */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            </button>

            {/* Profile Picture thumbnail */}
            <div 
              onClick={() => { setActiveTab("profile"); setSelectedStudentId(null); }}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition p-1 rounded-full hover:bg-slate-100"
              title={`Perfil de ${teacher.name}`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                <img 
                  src={teacher.avatarUrl} 
                  alt={teacher.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="hidden sm:inline text-xs font-bold text-slate-700 pr-1 truncate max-w-32">
                {teacher.name}
              </span>
            </div>
          </div>
        </header>

        {/* Content Box */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto px-6 py-8 mt-16 md:mt-0 max-w-5xl w-full mx-auto">
          {selectedStudentId && currentStudent && currentClass ? (
            <GradingView
              student={currentStudent}
              className={`${currentClass.gradeYear} • ${currentClass.subjectName}`}
              onBack={() => setSelectedStudentId(null)}
              onSave={handleSaveStudentGrades}
              activeLapso={activeLapso}
              calendarCurrentLapso={calendarCurrentLapso}
              onSelectLapso={(lapso) => setActiveLapso(lapso)}
              onSyncCurrentLapso={handleSyncWithCurrentLapso}
              termProgressPercent={termProgressPercent}
              termStartDate={currentLapsoPeriod.start}
              termEndDate={currentLapsoPeriod.end}
              todayDate={todayDate}
            />
          ) : (
            <>
              {activeTab === "home" && (
                <DashboardView
                  teacher={teacher}
                  classes={classes}
                  pendingTasks={pendingTasks}
                  activeLapso={activeLapso}
                  calendarCurrentLapso={calendarCurrentLapso}
                  termStartDate={currentLapsoPeriod.start}
                  termEndDate={currentLapsoPeriod.end}
                  currentDate={todayDate}
                  termProgressPercent={termProgressPercent}
                  onUpdateLapso={(l) => setActiveLapso(l)}
                  onSyncCurrentLapso={handleSyncWithCurrentLapso}
                  onUpdateDates={(newDates) => {
                    setLapsoDates(prev => ({
                      ...prev,
                      [activeLapso]: newDates
                    }));
                  }}
                  onSelectSubject={(groupKey) => {
                    setSelectedSubjectKey(groupKey);
                    const grp = subjectGroups.find(g => g.key === groupKey);
                    if (grp && grp.sections.length > 0) {
                      setSelectedClassId(grp.sections[0].id);
                    }
                    setViewMode("section_students");
                    setActiveTab("classes");
                  }}
                  onSelectClass={(id) => { 
                    setSelectedClassId(id); 
                    const found = classes.find(c => c.id === id);
                    if (found) {
                      const key = `${found.subjectName.trim().toLowerCase()}___${found.gradeYear.trim().toLowerCase()}`;
                      setSelectedSubjectKey(key);
                    }
                    setViewMode("section_students"); 
                    setActiveTab("classes"); 
                  }}
                  onQuickGrade={(stdId, classId) => { setSelectedClassId(classId); setSelectedStudentId(stdId); }}
                  onOpenNotifications={() => setIsNotificationsOpen(true)}
                  onOpenAlerts={() => setIsAlertsOpen(true)}
                  onOpenAddClass={() => setIsAddClassOpen(true)}
                />
              )}

              {activeTab === "classes" && (
                classes.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <School className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-800">
                      Sin asignaturas a cargo
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-5">
                      No tienes materias registradas para gestionar nóminas. Agrega tu primera clase para inscribir alumnos y cargar notas.
                    </p>
                    <button
                      onClick={() => setIsAddClassOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase px-5 py-3 rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Registrar Asignatura</span>
                    </button>
                  </div>
                ) : viewMode === "subjects_list" ? (
                  <SubjectsListView
                    subjectGroups={subjectGroups}
                    teacherName={teacher.name}
                    onSelectSubject={(groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      const grp = subjectGroups.find(g => g.key === groupKey);
                      if (grp && grp.sections.length > 0) {
                        setSelectedClassId(grp.sections[0].id);
                      }
                      setViewMode("section_students");
                    }}
                    onSelectSection={(secId, groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      setSelectedClassId(secId);
                      setViewMode("section_students");
                    }}
                    onOpenAddClass={() => setIsAddClassOpen(true)}
                  />
                ) : viewMode === "subject_sections" && currentSubjectGroup ? (
                  <SubjectSectionsView
                    subjectGroup={currentSubjectGroup}
                    allSubjectGroups={subjectGroups}
                    onSelectSubjectGroup={(groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      const grp = subjectGroups.find(g => g.key === groupKey);
                      if (grp && grp.sections.length > 0) {
                        setSelectedClassId(grp.sections[0].id);
                      }
                    }}
                    teacherName={teacher.name}
                    onBack={() => setViewMode("subjects_list")}
                    onSelectSection={(secId) => {
                      setSelectedClassId(secId);
                      setViewMode("section_students");
                    }}
                    onAddNewSection={handleAddNewSectionToSubject}
                  />
                ) : currentClass ? (
                  <ClassOverviewView
                    section={currentClass}
                    allSiblingSections={siblingSections}
                    onSwitchSection={(secId) => setSelectedClassId(secId)}
                    onBack={() => setViewMode("subjects_list")}
                    onSelectStudent={(stdId) => setSelectedStudentId(stdId)}
                    onAddStudent={() => setIsAddStudentOpen(true)}
                    onDeleteStudent={handleDeleteStudent}
                  />
                ) : (
                  <SubjectsListView
                    subjectGroups={subjectGroups}
                    teacherName={teacher.name}
                    onSelectSubject={(groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      const grp = subjectGroups.find(g => g.key === groupKey);
                      if (grp && grp.sections.length > 0) {
                        setSelectedClassId(grp.sections[0].id);
                      }
                      setViewMode("section_students");
                    }}
                    onSelectSection={(secId, groupKey) => {
                      setSelectedSubjectKey(groupKey);
                      setSelectedClassId(secId);
                      setViewMode("section_students");
                    }}
                    onOpenAddClass={() => setIsAddClassOpen(true)}
                  />
                )
              )}

              {activeTab === "profile" && (
                <ProfileView
                  teacher={teacher}
                  classAveragePerformance={globalAggregates.averageScore}
                  totalStudentsCount={globalAggregates.totalStudents}
                  onNavigateToRegister={() => {
                    setTeacher(null);
                  }}
                  onNavigateToAdmin={() => {
                    setActiveTab("admin");
                    setSelectedStudentId(null);
                  }}
                  onLogout={() => {
                    getSupabaseClient().auth.signOut().catch(() => {});
                    if (teacher?.email) {
                      localStorage.removeItem(`ilumina_classes_${teacher.email.toLowerCase()}`);
                    }
                    localStorage.removeItem("ilumina_classes_state");
                    localStorage.removeItem("ilumina_current_teacher");
                    setClasses([]);
                    setTeacher(null);
                    setSuccessToast("Sesión cerrada.");
                    setTimeout(() => setSuccessToast(""), 3000);
                  }}
                />
              )}

              {activeTab === "admin" && (
                <AdminPanelView
                  currentTeacher={teacher}
                  classes={classes}
                  onBack={() => {
                    setActiveTab("profile");
                    setSelectedStudentId(null);
                  }}
                  onUpdateClasses={(updatedClasses) => {
                    setClasses(updatedClasses);
                    const storageKey = (teacher.email || teacher.id || "default").toLowerCase();
                    localStorage.setItem(`ilumina_classes_${storageKey}`, JSON.stringify(updatedClasses));
                  }}
                  onCurrentTeacherUpdated={(updatedTeacher) => {
                    setTeacher(updatedTeacher);
                    localStorage.setItem("ilumina_current_teacher", JSON.stringify(updatedTeacher));
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Navigation mobile screen (strictly <= md screen size) */}
        <nav className="fixed bottom-0 left-0 w-full z-40 bg-white border-t border-slate-200 shadow-sm flex justify-around items-center h-16 md:hidden px-4">
          <button
            onClick={() => { setActiveTab("home"); setSelectedStudentId(null); }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              activeTab === "home" && !selectedStudentId ? "text-blue-600 bg-blue-50/50 rounded-xl font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold">Inicio</span>
          </button>

          <button
            onClick={() => { setActiveTab("classes"); setViewMode("subjects_list"); setSelectedStudentId(null); }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              activeTab === "classes" && !selectedStudentId ? "text-blue-600 bg-blue-50/50 rounded-xl font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <School className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold">Clases</span>
          </button>

          <button
            onClick={() => { setActiveTab("profile"); setSelectedStudentId(null); }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
              activeTab === "profile" && !selectedStudentId ? "text-blue-600 bg-blue-50/50 rounded-xl font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold">Perfil</span>
          </button>

          {isUserAdmin(teacher) && (
            <button
              onClick={() => { setActiveTab("admin"); setSelectedStudentId(null); }}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                activeTab === "admin" && !selectedStudentId ? "text-amber-600 bg-amber-50/50 rounded-xl font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-semibold">Admin</span>
            </button>
          )}
        </nav>
      </div>

      {/* Adding Student Modal overlay the Dialog */}
      <AnimatePresence>
        {isAddStudentOpen && (
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
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                    Inscribir Alumno
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddStudentOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddStudentSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Nombres del Alumno
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: David Alejandro"
                    value={newStudentFirst}
                    onChange={(e) => setNewStudentFirst(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Apellidos del Alumno
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: PÉREZ ROJAS"
                    value={newStudentLast}
                    onChange={(e) => setNewStudentLast(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
                  >
                    Guardar e Inscribir
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Adding Class/Subject Modal */}
        {isAddClassOpen && (
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
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">
                    Registrar Asignatura a Cargo
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddClassOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClassSubmit} className="p-5 space-y-4">
                {/* Professor attribution banner */}
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Profesor Asignado:</span>
                    <strong className="text-blue-900 font-bold">{teacher.name}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Correo / ID:</span>
                    <span className="font-mono text-slate-600 truncate max-w-[200px]">{teacher.email || teacher.id || "Vinculado"}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Nombre de la Asignatura *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Matemáticas, Física, Castellano"
                    value={newClassSubject}
                    onChange={(e) => setNewClassSubject(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Año o Grado
                    </label>
                    <select
                      value={newClassGrade}
                      onChange={(e) => setNewClassGrade(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition cursor-pointer"
                    >
                      <option value="1er Año">1er Año</option>
                      <option value="2do Año">2do Año</option>
                      <option value="3er Año">3er Año</option>
                      <option value="4to Año">4to Año</option>
                      <option value="5to Año">5to Año</option>
                      <option value="6to Grado">6to Grado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Secciones Asignadas
                    </label>
                    <select
                      value={
                        selectedSections.length === 6 && ["A", "B", "C", "D", "E", "F"].every(s => selectedSections.includes(s))
                          ? "ALL"
                          : selectedSections.length === 4 && ["A", "B", "C", "D"].every(s => selectedSections.includes(s))
                          ? "ABCD"
                          : selectedSections.length === 3 && ["A", "B", "C"].every(s => selectedSections.includes(s))
                          ? "ABC"
                          : selectedSections.length === 1
                          ? selectedSections[0]
                          : "CUSTOM"
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewClassSection(val);
                        if (val === "ALL") {
                          setSelectedSections(["A", "B", "C", "D", "E", "F"]);
                        } else if (val === "ABCD") {
                          setSelectedSections(["A", "B", "C", "D"]);
                        } else if (val === "ABC") {
                          setSelectedSections(["A", "B", "C"]);
                        } else if (val === "CUSTOM") {
                          // keep current selection
                        } else {
                          setSelectedSections([val]);
                        }
                      }}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition cursor-pointer"
                    >
                      <option value="ALL">Todas las secciones (A a F) — Por defecto</option>
                      <option value="ABCD">Secciones (A, B, C, D)</option>
                      <option value="ABC">Secciones (A, B, C)</option>
                      <option value="A">Solo Sección A</option>
                      <option value="B">Solo Sección B</option>
                      <option value="C">Solo Sección C</option>
                      <option value="D">Solo Sección D</option>
                      <option value="E">Solo Sección E</option>
                      <option value="F">Solo Sección F</option>
                      <option value="U">Sección Única (U)</option>
                      {selectedSections.length !== 6 && selectedSections.length !== 4 && selectedSections.length !== 3 && selectedSections.length !== 1 && (
                        <option value="CUSTOM">Personalizadas ({selectedSections.join(", ")})</option>
                      )}
                    </select>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {["A", "B", "C", "D", "E", "F", "U"].map((sec) => {
                        const isChecked = selectedSections.includes(sec);
                        return (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => {
                              setSelectedSections(prev => 
                                prev.includes(sec)
                                  ? (prev.length > 1 ? prev.filter(s => s !== sec) : prev)
                                  : [...prev, sec].sort()
                              );
                            }}
                            className={`px-2.5 py-1 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                              isChecked
                                ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {isChecked ? `✓ Sec. ${sec}` : `Sec. ${sec}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>
                    Se registrarán <strong>{selectedSections.length} {selectedSections.length === 1 ? "sección" : "secciones"} ({selectedSections.join(", ")})</strong> para <strong>{newClassGrade}</strong>.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSections.length >= 6) {
                        setSelectedSections(["A"]);
                      } else {
                        setSelectedSections(["A", "B", "C", "D", "E", "F"]);
                      }
                    }}
                    className="text-blue-600 font-bold hover:underline cursor-pointer ml-2 whitespace-nowrap text-[10px]"
                  >
                    {selectedSections.length >= 6 ? "Desmarcar" : "Todas (A a F)"}
                  </button>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddClassOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingClass}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm shadow-blue-200 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isCreatingClass ? "Registrando..." : "Registrar Asignatura"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Academic Alerts Drawer */}
      <AnimatePresence>
        {isAlertsOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
                <div className="flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="font-extrabold text-sm uppercase tracking-tight">
                    Alertas
                  </h3>
                </div>
                <button
                  onClick={() => setIsAlertsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {alertStudents.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-medium">
                    Sin alertas activas.
                  </div>
                ) : (
                  alertStudents.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedClassId(item.classId);
                        setSelectedStudentId(item.student.id);
                        setIsAlertsOpen(false);
                      }}
                      className="p-3 bg-rose-50/60 hover:bg-rose-100/70 rounded-xl border border-rose-100 flex items-center justify-between cursor-pointer transition"
                      title="Ir a calificar alumno"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {item.student.lastName}, {item.student.firstName}
                        </p>
                        <p className="text-[10px] text-slate-500">{item.className}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                          {item.score} / 20
                        </span>
                        <p className="text-[9px] text-rose-500 font-semibold mt-0.5">Bajo promedio</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications Drawer */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-sm h-full shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 text-slate-800">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-sm uppercase tracking-tight">
                    Notificaciones
                  </h3>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <p className="text-xs font-bold text-slate-900">Lapso {activeLapso} Activo</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Calificaciones al día.
                  </p>
                  <span className="text-[9px] text-blue-600 font-mono mt-1 block">Sincronizado</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
