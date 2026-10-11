import { TeacherProfile, RegisteredStudent, Student, ClassSection } from "../types";
import { getSupabaseClient, hashPassword } from "./supabase";
import { createEmptyGrades } from "../mockData";

const REGISTERED_STUDENTS_KEY = "ilumina_registered_students";
const STUDENTS_METADATA_KEY = "ilumina_students_metadata";

// Known mock student IDs and cedulas to actively purge from local storage
const MOCK_STUDENT_IDS = new Set([
  "reg-std-101", "reg-std-102", "reg-std-103", "reg-std-104", "reg-std-105", "reg-std-106",
  "reg-std-201", "reg-std-202", "reg-std-301", "reg-std-302", "reg-std-401", "reg-std-501"
]);

const MOCK_CEDULAS = new Set([
  "V-32.410.892", "V-32.185.304", "V-32.994.110", "V-32.651.488", "V-32.883.219", "V-32.741.002",
  "V-31.849.201", "V-31.520.198", "V-30.988.114", "V-30.771.829", "V-29.810.450", "V-28.901.320"
]);

export function isMockStudent(student: { id?: string; cedula?: string }): boolean {
  if (student.id && MOCK_STUDENT_IDS.has(student.id)) return true;
  if (student.cedula && MOCK_CEDULAS.has(student.cedula)) return true;
  return false;
}

export function purgeMockStudents(): void {
  if (typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(REGISTERED_STUDENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(s => !isMockStudent(s));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(cleaned));
        }
      }
    }
  } catch {}
}

export function getStudentsMetadataMap(): Record<string, { gradeYear: string; sectionLetter: string; createdAt?: string }> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(STUDENTS_METADATA_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

export function setStudentMetadata(key: string, data: { gradeYear: string; sectionLetter: string; createdAt?: string }) {
  if (typeof window === "undefined") return;
  try {
    const current = getStudentsMetadataMap();
    current[key] = data;
    localStorage.setItem(STUDENTS_METADATA_KEY, JSON.stringify(current));
  } catch {}
}

/**
 * Check if the current user/teacher has administrator privileges.
 * Accommodates:
 * - teacher.isAdmin === true
 * - (teacher as any).admin === true
 * - teacher.status containing "admin" or "admin true"
 * - teacher.rank containing "admin"
 * - LocalStorage flags for this user's email or general ilumina_is_admin
 */
export function isUserAdmin(teacher: TeacherProfile | null): boolean {
  if (!teacher) return false;

  // 1. Direct boolean flags
  if (teacher.isAdmin === true) return true;
  if ((teacher as any).admin === true) return true;

  // 2. Status string checks (case-insensitive)
  const statusStr = String(teacher.status || "").toLowerCase().trim();
  if (statusStr === "admin" || statusStr === "admin true" || statusStr.includes("admin")) {
    return true;
  }

  // 3. Rank string checks
  const rankStr = String(teacher.rank || "").toLowerCase().trim();
  if (rankStr.includes("admin") || rankStr.includes("administrador") || rankStr.includes("director")) {
    return true;
  }

  // 4. LocalStorage keys
  if (typeof window !== "undefined") {
    if (localStorage.getItem("ilumina_is_admin") === "true") return true;
    const cleanEmail = (teacher.email || "").toLowerCase().trim();
    if (cleanEmail) {
      if (localStorage.getItem(`ilumina_admin_${cleanEmail}`) === "true") return true;
      try {
        const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
        if (creds[cleanEmail]?.isAdmin || creds[cleanEmail]?.status === "admin true" || creds[cleanEmail]?.status === "admin") {
          return true;
        }
      } catch {}
    }
  }

  return false;
}

/**
 * Set the admin status for a teacher
 */
export function setTeacherAdminStatus(email: string, isAdmin: boolean) {
  if (typeof window === "undefined") return;
  const cleanEmail = email.toLowerCase().trim();
  localStorage.setItem(`ilumina_admin_${cleanEmail}`, isAdmin ? "true" : "false");
  try {
    const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
    if (creds[cleanEmail]) {
      creds[cleanEmail].isAdmin = isAdmin;
      creds[cleanEmail].status = isAdmin ? "ADMIN" : "ACTIVO";
      localStorage.setItem("ilumina_user_credentials", JSON.stringify(creds));
    }
    const currentTeacherStr = localStorage.getItem("ilumina_current_teacher");
    if (currentTeacherStr) {
      const cur = JSON.parse(currentTeacherStr);
      if ((cur.email || "").toLowerCase() === cleanEmail) {
        cur.isAdmin = isAdmin;
        cur.status = isAdmin ? "ADMIN" : "ACTIVO";
        localStorage.setItem("ilumina_current_teacher", JSON.stringify(cur));
      }
    }
  } catch {}
}

/**
 * Get all registered students from cache (strictly excluding mock/example students)
 */
export function getRegisteredStudents(): RegisteredStudent[] {
  if (typeof window === "undefined") return [];
  purgeMockStudents();
  try {
    const saved = localStorage.getItem(REGISTERED_STUDENTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => !isMockStudent(s));
      }
    }
  } catch (e) {
    console.error("Error loading registered students:", e);
  }
  return [];
}

/**
 * Fetch registered students directly from Supabase database (alumnos table)
 * Optionally filters by selectedYear to optimize read operations on large databases
 */
export async function fetchRegisteredStudentsFromDatabase(selectedYear?: string): Promise<RegisteredStudent[]> {
  purgeMockStudents();
  const client: any = getSupabaseClient();

  try {
    let supaAlumnos: any[] | null = null;
    let queryErr: any = null;

    if (selectedYear) {
      try {
        const { data: byYear, error: byYearErr } = await client
          .from("alumnos")
          .select("*")
          .eq("grado_ano", selectedYear)
          .order("nombres", { ascending: true });
        if (!byYearErr && byYear && byYear.length > 0) {
          supaAlumnos = byYear;
        }
      } catch {}
    }

    if (!supaAlumnos) {
      const { data, error } = await client
        .from("alumnos")
        .select("*")
        .order("nombres", { ascending: true });
      supaAlumnos = data;
      queryErr = error;
    }

    if (queryErr) {
      console.warn("Could not fetch alumnos from Supabase:", queryErr);
      return getRegisteredStudents();
    }

    if (!supaAlumnos || supaAlumnos.length === 0) {
      // Database has 0 students! Clean out local storage and return empty
      localStorage.removeItem(REGISTERED_STUDENTS_KEY);
      return [];
    }

    const metadataMap = getStudentsMetadataMap();

    // Map each real database student from Supabase
    const list: RegisteredStudent[] = supaAlumnos
      .filter((a: any) => !isMockStudent({ id: a.id, cedula: a.cedula }))
      .map((a: any) => {
        const meta: { gradeYear?: string; sectionLetter?: string; createdAt?: string } = 
          metadataMap[a.cedula] || metadataMap[a.id] || {};
        return {
          id: a.id,
          firstName: a.nombres || "",
          lastName: a.apellidos || "",
          cedula: a.cedula || "",
          gradeYear: a.grado_ano || a.ano || meta.gradeYear || "1er Año",
          sectionLetter: a.seccion || meta.sectionLetter || "A",
          avatarUrl: a.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          createdAt: a.created_at ? a.created_at.slice(0, 10) : (meta.createdAt || new Date().toISOString().slice(0, 10)),
        };
      });

    localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(list));
    return list;
  } catch (err) {
    console.warn("Error fetching students from database:", err);
    return getRegisteredStudents();
  }
}

/**
 * Save (insert or update) a registered student in Supabase database and local metadata
 */
export async function saveRegisteredStudent(
  data: Omit<RegisteredStudent, "id"> & { id?: string }
): Promise<RegisteredStudent> {
  const client: any = getSupabaseClient();
  const cleanFirst = data.firstName.trim();
  const cleanLast = data.lastName.trim();
  const cleanCedula = data.cedula.trim();
  const cleanGrade = data.gradeYear.trim();
  const cleanSection = data.sectionLetter.trim().toUpperCase();
  const avatar = data.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  const createdAt = data.createdAt || new Date().toISOString().slice(0, 10);

  let realId = data.id || "";

  // Save directly to Supabase alumnos table
  try {
    let insData: any = null;
    let insError: any = null;

    try {
      const res = await client
        .from("alumnos")
        .upsert(
          {
            nombres: cleanFirst,
            apellidos: cleanLast,
            cedula: cleanCedula,
            avatar_url: avatar,
            grado_ano: cleanGrade,
            seccion: cleanSection,
          },
          { onConflict: "cedula" }
        )
        .select()
        .maybeSingle();
      insData = res.data;
      insError = res.error;
    } catch (e) {
      insError = e;
    }

    // If schema doesn't have grado_ano or seccion columns, retry with base columns
    if (insError) {
      const retryRes = await client
        .from("alumnos")
        .upsert(
          {
            nombres: cleanFirst,
            apellidos: cleanLast,
            cedula: cleanCedula,
            avatar_url: avatar,
          },
          { onConflict: "cedula" }
        )
        .select()
        .maybeSingle();
      insData = retryRes.data;
    }

    if (insData?.id) {
      realId = insData.id;
    }
  } catch (e) {
    console.warn("Could not sync registered student to Supabase alumnos:", e);
  }

  if (!realId) {
    realId = data.id || `std-${Date.now()}`;
  }

  const studentRecord: RegisteredStudent = {
    id: realId,
    firstName: cleanFirst,
    lastName: cleanLast,
    cedula: cleanCedula,
    gradeYear: cleanGrade,
    sectionLetter: cleanSection,
    avatarUrl: avatar,
    createdAt: createdAt,
  };

  // Save metadata
  setStudentMetadata(cleanCedula, { gradeYear: cleanGrade, sectionLetter: cleanSection, createdAt });
  setStudentMetadata(realId, { gradeYear: cleanGrade, sectionLetter: cleanSection, createdAt });

  // Update local cache
  const currentList = getRegisteredStudents().filter(s => s.id !== realId && s.cedula !== cleanCedula);
  const updatedList = [studentRecord, ...currentList];
  localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(updatedList));

  return studentRecord;
}

/**
 * Delete a registered student from Supabase database and local metadata
 */
export async function deleteRegisteredStudent(studentId: string): Promise<boolean> {
  const currentList = getRegisteredStudents();
  const targetStudent = currentList.find(s => s.id === studentId);
  const updatedList = currentList.filter(s => s.id !== studentId);
  localStorage.setItem(REGISTERED_STUDENTS_KEY, JSON.stringify(updatedList));

  // Remove from Supabase
  try {
    const client: any = getSupabaseClient();
    if (studentId && !studentId.startsWith("std-")) {
      await client.from("alumnos").delete().eq("id", studentId);
    }
    if (targetStudent?.cedula) {
      await client.from("alumnos").delete().eq("cedula", targetStudent.cedula);
    }
  } catch (e) {
    console.warn("Could not delete student from Supabase alumnos:", e);
  }

  return true;
}

/**
 * Normalize year string for comparisons, e.g. "1er año" -> "1"
 */
function normalizeYear(year: string): string {
  const clean = year.toLowerCase().trim();
  if (clean.includes("1")) return "1";
  if (clean.includes("2")) return "2";
  if (clean.includes("3")) return "3";
  if (clean.includes("4")) return "4";
  if (clean.includes("5")) return "5";
  return clean;
}

/**
 * Get all registered students that belong to a specific grade year and section letter
 */
export function getRegisteredStudentsForSection(
  gradeYear: string,
  sectionLetter: string
): RegisteredStudent[] {
  const all = getRegisteredStudents();
  const normYear = normalizeYear(gradeYear);
  const normSec = sectionLetter.trim().toUpperCase();

  return all.filter(s => {
    const matchesYear = normalizeYear(s.gradeYear) === normYear;
    const matchesSection = s.sectionLetter.trim().toUpperCase() === normSec;
    return matchesYear && matchesSection;
  });
}

/**
 * Convert RegisteredStudent records to class Student objects with initial grades
 */
export function convertRegisteredToClassStudents(registered: RegisteredStudent[]): Student[] {
  return registered.map((reg, index) => {
    return {
      id: `std-enr-${reg.id}-${index}`,
      firstName: reg.firstName,
      lastName: reg.lastName,
      avatarUrl: reg.avatarUrl,
      grades: createEmptyGrades(),
      attendanceRate: 100,
      hasSubmittedLastQuiz: true,
    };
  });
}

/**
 * Synchronize all existing classes with any registered students matching their year and section
 */
export function syncRegisteredStudentsWithClasses(classes: ClassSection[]): {
  updatedClasses: ClassSection[];
  addedCount: number;
} {
  let totalAdded = 0;

  const updatedClasses = classes.map(cls => {
    const matching = getRegisteredStudentsForSection(cls.gradeYear, cls.sectionLetter);
    if (matching.length === 0) return cls;

    // Existing student names/IDs
    const existingNames = new Set(
      cls.students.map(s => `${s.firstName.toLowerCase()}_${s.lastName.toLowerCase()}`)
    );

    const newStudentsToAdd: Student[] = [];

    matching.forEach((reg, idx) => {
      const key = `${reg.firstName.toLowerCase()}_${reg.lastName.toLowerCase()}`;
      if (!existingNames.has(key)) {
        newStudentsToAdd.push({
          id: `std-${reg.id}-${Date.now()}-${idx}`,
          firstName: reg.firstName,
          lastName: reg.lastName,
          avatarUrl: reg.avatarUrl,
          grades: createEmptyGrades(),
          attendanceRate: 100,
          hasSubmittedLastQuiz: true,
        });
        existingNames.add(key);
      }
    });

    if (newStudentsToAdd.length > 0) {
      totalAdded += newStudentsToAdd.length;
      return {
        ...cls,
        students: [...cls.students, ...newStudentsToAdd],
      };
    }

    return cls;
  });

  return { updatedClasses, addedCount: totalAdded };
}

/**
 * Fetch all registered teachers from Supabase and localStorage
 */
export async function getAllTeachers(): Promise<TeacherProfile[]> {
  const teachersMap = new Map<string, TeacherProfile>();

  // 1. Current teacher in localStorage
  if (typeof window !== "undefined") {
    try {
      const currentSaved = localStorage.getItem("ilumina_current_teacher");
      if (currentSaved) {
        const cur = JSON.parse(currentSaved);
        if (cur?.email) {
          teachersMap.set(cur.email.toLowerCase(), {
            ...cur,
            isAdmin: isUserAdmin(cur),
          });
        }
      }
    } catch {}

    // 2. From ilumina_user_credentials
    try {
      const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
      Object.entries(creds).forEach(([email, data]: [string, any]) => {
        const cleanEmail = email.toLowerCase();
        if (!teachersMap.has(cleanEmail)) {
          teachersMap.set(cleanEmail, {
            name: data.name || "Docente Registrado",
            email: cleanEmail,
            department: data.department || "Ciencias Exactas",
            schoolYear: data.schoolYear || "2025-2026",
            rank: data.rank || "DOCENTE TITULAR",
            status: data.isAdmin ? "ADMIN" : (data.status || "ACTIVO"),
            avatarUrl: data.avatarUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80",
            totalStudents: 0,
            totalStudentsGrowthPercent: 0,
            averagePerformance: 0.0,
            termProgressPercent: 50,
            isAdmin: Boolean(data.isAdmin || isUserAdmin({ email: cleanEmail } as any)),
          });
        }
      });
    } catch {}
  }

  // 3. From Supabase profesores table
  try {
    const client: any = getSupabaseClient();
    const { data: supaProfs, error } = await client
      .from("profesores")
      .select("*")
      .order("nombre", { ascending: true });

    if (!error && Array.isArray(supaProfs)) {
      supaProfs.forEach((p: any) => {
        const email = (p.email || "").toLowerCase().trim();
        if (!email) return;

        const adminFromDb = 
          p.is_admin === true || 
          p.admin === true || 
          String(p.status || "").toLowerCase().includes("admin") ||
          String(p.rango || "").toLowerCase().includes("admin");

        const existing = teachersMap.get(email);
        teachersMap.set(email, {
          id: p.id,
          name: p.nombre || existing?.name || "Docente",
          email: email,
          department: p.departamento || existing?.department || "Ciencias",
          schoolYear: p.ano_escolar || existing?.schoolYear || "2025-2026",
          rank: p.rango || existing?.rank || "DOCENTE TITULAR",
          status: p.status || existing?.status || "ACTIVO",
          avatarUrl: p.avatar_url || existing?.avatarUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80",
          totalStudents: existing?.totalStudents || 0,
          totalStudentsGrowthPercent: existing?.totalStudentsGrowthPercent || 0,
          averagePerformance: existing?.averagePerformance || 0.0,
          termProgressPercent: existing?.termProgressPercent || 50,
          isAdmin: adminFromDb || isUserAdmin(existing || ({ email } as any)),
        });
      });
    }
  } catch (e) {
    console.warn("Could not query profesores from Supabase:", e);
  }

  return Array.from(teachersMap.values());
}

/**
 * Create a new teacher from Admin panel
 */
export async function createTeacherByAdmin(data: {
  name: string;
  email: string;
  password?: string;
  department: string;
  rank: string;
  schoolYear: string;
  isAdmin: boolean;
  avatarUrl?: string;
}): Promise<{ success: boolean; message: string; teacher?: TeacherProfile }> {
  const cleanEmail = data.email.toLowerCase().trim();
  const passwordHash = data.password ? await hashPassword(data.password) : "";
  const avatar = data.avatarUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80";

  // 1. Save in local credentials
  try {
    const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
    creds[cleanEmail] = {
      name: data.name.trim(),
      passwordHash,
      department: data.department.trim(),
      rank: data.rank.trim().toUpperCase(),
      schoolYear: data.schoolYear.trim(),
      isAdmin: data.isAdmin,
      status: data.isAdmin ? "ADMIN" : "ACTIVO",
      avatarUrl: avatar,
    };
    localStorage.setItem("ilumina_user_credentials", JSON.stringify(creds));
    if (data.isAdmin) {
      localStorage.setItem(`ilumina_admin_${cleanEmail}`, "true");
    }
  } catch {}

  const profile: TeacherProfile = {
    name: data.name.trim(),
    email: cleanEmail,
    department: data.department.trim(),
    rank: data.rank.trim().toUpperCase(),
    schoolYear: data.schoolYear.trim(),
    status: data.isAdmin ? "ADMIN" : "ACTIVO",
    avatarUrl: avatar,
    totalStudents: 0,
    totalStudentsGrowthPercent: 0,
    averagePerformance: 0.0,
    termProgressPercent: 50,
    isAdmin: data.isAdmin,
  };

  // 2. Save in Supabase profesores table
  try {
    const client: any = getSupabaseClient();
    const { data: supaProf, error } = await client
      .from("profesores")
      .upsert(
        {
          nombre: profile.name,
          email: cleanEmail,
          departamento: profile.department,
          rango: profile.rank,
          ano_escolar: profile.schoolYear,
          avatar_url: avatar,
        },
        { onConflict: "email" }
      )
      .select()
      .maybeSingle();

    if (!error && supaProf?.id) {
      profile.id = supaProf.id;
    }
  } catch (e) {
    console.warn("Could not save new teacher to Supabase:", e);
  }

  return {
    success: true,
    message: `¡Docente ${profile.name} creado exitosamente!`,
    teacher: profile,
  };
}

/**
 * Update teacher details from Admin panel
 */
export async function updateTeacherByAdmin(
  teacher: TeacherProfile,
  newPassword?: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = teacher.email.toLowerCase().trim();

  // 1. Update local storage
  try {
    const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
    const existingCred = creds[cleanEmail] || {};
    let passwordHash = existingCred.passwordHash;
    if (newPassword && newPassword.trim().length > 0) {
      passwordHash = await hashPassword(newPassword.trim());
    }

    creds[cleanEmail] = {
      ...existingCred,
      name: teacher.name.trim(),
      passwordHash,
      department: teacher.department.trim(),
      rank: teacher.rank.trim().toUpperCase(),
      schoolYear: teacher.schoolYear.trim(),
      isAdmin: Boolean(teacher.isAdmin),
      status: teacher.isAdmin ? "ADMIN" : (teacher.status || "ACTIVO"),
      avatarUrl: teacher.avatarUrl,
    };
    localStorage.setItem("ilumina_user_credentials", JSON.stringify(creds));

    // Admin override flags
    if (teacher.isAdmin) {
      localStorage.setItem(`ilumina_admin_${cleanEmail}`, "true");
    } else {
      localStorage.removeItem(`ilumina_admin_${cleanEmail}`);
    }

    // If currently logged in teacher is being updated
    const curSaved = localStorage.getItem("ilumina_current_teacher");
    if (curSaved) {
      const cur = JSON.parse(curSaved);
      if ((cur.email || "").toLowerCase() === cleanEmail) {
        localStorage.setItem("ilumina_current_teacher", JSON.stringify({
          ...cur,
          ...teacher,
          isAdmin: Boolean(teacher.isAdmin),
        }));
      }
    }
  } catch {}

  // 2. Update Supabase
  try {
    const client: any = getSupabaseClient();
    const updatePayload: any = {
      nombre: teacher.name.trim(),
      departamento: teacher.department.trim(),
      rango: teacher.rank.trim().toUpperCase(),
      ano_escolar: teacher.schoolYear.trim(),
      avatar_url: teacher.avatarUrl,
    };

    if (teacher.id) {
      await client.from("profesores").update(updatePayload).eq("id", teacher.id);
    } else {
      await client.from("profesores").update(updatePayload).eq("email", cleanEmail);
    }
  } catch (e) {
    console.warn("Could not update teacher in Supabase:", e);
  }

  return {
    success: true,
    message: `¡Datos del docente ${teacher.name} actualizados correctamente!`,
  };
}

/**
 * Delete teacher from Admin panel
 */
export async function deleteTeacherByAdmin(
  teacherIdOrEmail: string
): Promise<{ success: boolean; message: string }> {
  const cleanKey = teacherIdOrEmail.toLowerCase().trim();

  // 1. Remove from local credentials
  try {
    const creds = JSON.parse(localStorage.getItem("ilumina_user_credentials") || "{}");
    delete creds[cleanKey];
    localStorage.setItem("ilumina_user_credentials", JSON.stringify(creds));
    localStorage.removeItem(`ilumina_admin_${cleanKey}`);
    localStorage.removeItem(`ilumina_classes_${cleanKey}`);
  } catch {}

  // 2. Remove from Supabase
  try {
    const client: any = getSupabaseClient();
    if (cleanKey.includes("@")) {
      await client.from("profesores").delete().eq("email", cleanKey);
    } else {
      await client.from("profesores").delete().eq("id", teacherIdOrEmail);
    }
  } catch (e) {
    console.warn("Could not delete teacher from Supabase:", e);
  }

  return {
    success: true,
    message: "Docente eliminado correctamente.",
  };
}
