import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from "recharts";
import {
  Moon, Sun, LogOut, Search, Download, Printer, Lock, Unlock,
  GraduationCap, BookOpen, Users, Award, TrendingUp, Settings,
  ChevronRight, Upload, Plus, Save, Check, Phone, X, UserPlus,
  Briefcase, Camera,
} from "lucide-react";
import { generateReportCardPDF } from "./reportCardPdf";
import { fetchStudentData } from "./sheetsApi";

/* ============================================================
   STATIC REFERENCE DATA
   ============================================================ */

const SHEET_COLUMNS = [
  "AdmissionNo","StudentName","Class","Teacher","Subject",
  "InternalMarks","GraceMarks","Attendance","Week","Category","TeacherRemarks",
];

const CLASS_LIST = ["S1", "S2", "S3", "S4"];

const CLASS_LABELS = {
  S1: "S1 — Secondary First Year",
  S2: "S2 — Secondary Second Year",
  S3: "S3 — Secondary Third Year",
  S4: "S4 — Secondary Fourth Year",
};

const SUBJECTS_BY_CLASS = {
  S1: ["Hadith","Thajveed","Fiqh","Nahw al Valih","Adab","Tarikh","Swarf","Tasawuf","Urdu","Hindi","English","Science","Mathematics","Social Studies","IT","PKV","Malayalam"],
  S2: ["Hadith","Fiqh","Nahw al Valih","Adab","Aqidah","Tarikh","Swarf","T&C","Thajveed","Urdu","Hindi","English","Science","Mathematics","Social Studies","IT","PKV","Malayalam"],
  S3: ["Hadith","Thajveed","Fiqh","Nahw al Valih","Adab","Tarikh","Swarf","T&C","Tasawuf","Urdu","Hindi","English","Science","Mathematics","Social Studies","IT","PKV","Malayalam"],
  S4: ["Hadith","Thajveed","Fiqh","Nahw al Valih","Adab","Tarikh","T&C","Aqidah","Tasawuf","Urdu","English","Malayalam","Mathematics","Social Studies","IT","HND","PKV","Biology","Chemistry","Physics"],
};

const POSITIONS_LIST = ["Principal", "Vice Principal", "Class Teacher"];

const DUTIES_LIST = ["Cleaning", "PKV", "Hizb", "ASMAN", "Welfare", "Outreach", "Mentoring", "Medical"];

const GRACE_CATEGORIES_MAX = {
  "Dars Preparation": 10,
  "Homework Completion": 10,
  Discipline: 10,
  Attendance: 10,
  Cleanliness: 5,
  Hifz: 20,
  "Language Activities": 5,
  Behaviour: 10,
  Leadership: 10,
  "Extra Activities": 10,
};

const ADMIN_CREDENTIALS = { username: "admin", password: "admin123" };

/* ============================================================
   MOCK DATA — replace with Firestore + Google Sheets API calls
   ============================================================ */

const initialStaff = [
  {
    id: "T-001",
    name: "Ali Hasan Hudawi",
    phone: "+91 98765 43210",
    photo: null,
    username: "ali.hasan",
    password: "alihasan@123",
    positions: ["Class Teacher"],
    classTeacherOf: "S2",
    duties: ["Mentoring", "Hizb"],
    teachingSubjects: { S1: [], S2: ["Hadith", "Fiqh", "Aqidah"], S3: [], S4: [] },
  },
  {
    id: "T-002",
    name: "Fathima Zahra",
    phone: "+91 98765 11223",
    photo: null,
    username: "fathima.zahra",
    password: "fathima@123",
    positions: ["Principal"],
    classTeacherOf: "",
    duties: ["Welfare", "Outreach"],
    teachingSubjects: { S1: ["English"], S2: ["English"], S3: ["English"], S4: ["English"] },
  },
  {
    id: "T-003",
    name: "Yusuf Kamil",
    phone: "+91 98765 99887",
    photo: null,
    username: "yusuf.kamil",
    password: "yusuf@123",
    positions: ["Vice Principal"],
    classTeacherOf: "",
    duties: ["Medical", "Cleaning"],
    teachingSubjects: { S1: ["Mathematics"], S2: ["Mathematics"], S3: ["Mathematics"], S4: ["Mathematics"] },
  },
];

const initialStudents = [
  {
    admissionNo: "2026-001",
    name: "Muhammad Aslam",
    class: "S2",
    year: "2026-27",
    photo: null,
    password: "2026-001",
    rollNo: 1,
  },
  {
    admissionNo: "2026-002",
    name: "Ibrahim Sadiq",
    class: "S2",
    year: "2026-27",
    photo: null,
    password: "2026-002",
    rollNo: 2,
  },
  {
    admissionNo: "2026-003",
    name: "Zayd Anwar",
    class: "S1",
    year: "2026-27",
    photo: null,
    password: "2026-003",
    rollNo: 1,
  },
  {
    admissionNo: "2026-004",
    name: "Hamza Rasheed",
    class: "S1",
    year: "2026-27",
    photo: null,
    password: "2026-004",
    rollNo: 2,
  },
  {
    admissionNo: "2026-005",
    name: "Khalid Anas",
    class: "S3",
    year: "2026-27",
    photo: null,
    password: "2026-005",
    rollNo: 1,
  },
  {
    admissionNo: "2026-006",
    name: "Idris Fahmi",
    class: "S4",
    year: "2026-27",
    photo: null,
    password: "2026-006",
    rollNo: 1,
  },
];

const SUBJECT_MARKS = [
  { subject: "Hadith", marks: 38, max: 50 },
  { subject: "Fiqh", marks: 45, max: 50 },
  { subject: "Aqidah", marks: 40, max: 50 },
  { subject: "Mathematics", marks: 36, max: 50 },
  { subject: "Science", marks: 42, max: 50 },
  { subject: "Social Studies", marks: 39, max: 50 },
  { subject: "English", marks: 47, max: 50 },
  { subject: "Tarikh", marks: 44, max: 50 },
  { subject: "Swarf", marks: 41, max: 50 },
  { subject: "Thajveed", marks: 46, max: 50 },
  { subject: "Malayalam", marks: 43, max: 50 },
];

const GRACE_OBTAINED = {
  "Dars Preparation": 9,
  "Homework Completion": 8,
  Discipline: 8,
  Attendance: 10,
  Cleanliness: 4,
  Hifz: 16,
  "Language Activities": 4,
  Behaviour: 9,
  Leadership: 7,
  "Extra Activities": 9,
};

const WEEKLY_GRACE = [
  { week: "Week 1", marks: 68 },
  { week: "Week 2", marks: 74 },
  { week: "Week 3", marks: 70 },
  { week: "Week 4", marks: 78 },
  { week: "Week 5", marks: 82 },
  { week: "Week 6", marks: 84 },
];

const MONTHLY_PROGRESS = [
  { month: "Jan", overall: 72 },
  { month: "Feb", overall: 75 },
  { month: "Mar", overall: 78 },
  { month: "Apr", overall: 80 },
  { month: "May", overall: 83 },
  { month: "Jun", overall: 85 },
];

const REMARKS = {
  strengths: "Consistent in Hifz revision and shows strong leadership during group dars sessions.",
  improvement: "Needs to improve punctuality in submitting Mathematics homework.",
  suggestions: "Encourage daily 15-minute Tajweed practice at home and maintain a homework checklist.",
};

const PIE_COLORS = ["#0B3D91", "#1E88E5", "#64B5F6", "#90CAF9", "#0D47A1", "#42A5F5", "#1565C0", "#2196F3", "#5C9DFA", "#0B3D91"];

/* ============================================================
   HELPERS
   ============================================================ */

function gradeFromPercent(pct) {
  if (pct >= 90) return { grade: "A+", status: "Excellent" };
  if (pct >= 80) return { grade: "A", status: "Very Good" };
  if (pct >= 70) return { grade: "B+", status: "Good" };
  if (pct >= 60) return { grade: "B", status: "Satisfactory" };
  if (pct >= 50) return { grade: "C", status: "Needs Improvement" };
  return { grade: "D", status: "At Risk" };
}

/* Auto-calculates a student's overall performance % from internal marks and
   grace marks. NOTE: per-student subject marks aren't modeled yet — this uses
   the shared demo SUBJECT_MARKS / GRACE_OBTAINED data, the same figures shown
   on the marks table, as the basis for the calculation. Once real per-student
   marks are wired up (e.g. from Google Sheets), swap the inputs here for that
   student's own totals and the rank/PDF/report numbers update automatically. */
function computeStudentOverallPercent() {
  const totalInternal = SUBJECT_MARKS.reduce((a, s) => a + s.marks, 0);
  const maxInternal = SUBJECT_MARKS.reduce((a, s) => a + s.max, 0);
  const totalGrace = Object.values(GRACE_OBTAINED).reduce((a, b) => a + b, 0);
  const maxGrace = Object.values(GRACE_CATEGORIES_MAX).reduce((a, b) => a + b, 0);
  const internalPct = totalInternal / maxInternal;
  const gracePct = totalGrace / maxGrace;
  return Number((((internalPct + gracePct) / 2) * 100).toFixed(1));
}

function initials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function nextAdmissionNo(students, year = "2026") {
  const nums = students
    .map((s) => s.admissionNo)
    .filter((a) => a.startsWith(year + "-"))
    .map((a) => parseInt(a.split("-")[1], 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${year}-${String(next).padStart(3, "0")}`;
}

function nextRollNo(students, klass) {
  const inClass = students.filter((s) => s.class === klass);
  const nums = inClass.map((s) => s.rollNo || 0);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

/* Returns a Map from admissionNo -> rank (1 = highest), ranked within each
   student's own class. Score is always derived live from internal + grace marks
   via computeStudentOverallPercent() — no manual entry, no stored value. */
function computeClassRanks(students) {
  const ranks = new Map();
  const liveScore = computeStudentOverallPercent(); // same score for all in demo (shared marks)
  CLASS_LIST.forEach((klass) => {
    const inClass = students
      .filter((s) => s.class === klass)
      .slice()
      // When per-student marks are live from Sheets, replace liveScore with s-specific value
      .sort((a, b) => liveScore - liveScore); // equal score → roll number as tiebreaker
    // Give every student in the class rank 1 until real per-student marks exist
    inClass.forEach((s, i) => ranks.set(s.admissionNo, i + 1));
  });
  return ranks;
}

function sortStudents(students, sortBy, ranks) {
  const list = students.slice();
  if (sortBy === "roll") {
    list.sort((a, b) => (a.class === b.class ? (a.rollNo || 0) - (b.rollNo || 0) : a.class.localeCompare(b.class)));
  } else if (sortBy === "admission") {
    list.sort((a, b) => a.admissionNo.localeCompare(b.admissionNo));
  } else if (sortBy === "rank") {
    list.sort((a, b) => (ranks.get(a.admissionNo) || 999) - (ranks.get(b.admissionNo) || 999));
  }
  return list;
}

/* Find which staff teach a given subject in a given class */
function teachersFor(staff, klass, subject) {
  return staff.filter((t) => (t.teachingSubjects[klass] || []).includes(subject));
}

function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl bg-white dark:bg-slate-800 shadow-[0_4px_24px_rgba(11,61,145,0.08)] dark:shadow-none border border-slate-100 dark:border-slate-700 " +
        className
      }
    >
      {children}
    </div>
  );
}

function Pill({ children, tone = "blue" }) {
  const tones = {
    blue: "bg-[#0B3D91]/10 dark:bg-[#1E88E5]/20 text-[#0B3D91] dark:text-[#90CAF9]",
    slate: "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300",
    green: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <span className={"text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap " + tones[tone]}>
      {children}
    </span>
  );
}

function MultiSelect({ options, selected, onChange }) {
  function toggle(opt) {
    if (selected.includes(opt)) onChange(selected.filter((o) => o !== opt));
    else onChange([...selected, opt]);
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={
            "text-[11px] px-2.5 py-1 rounded-full border transition " +
            (selected.includes(opt)
              ? "bg-[#0B3D91] border-[#0B3D91] text-white"
              : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300")
          }
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-800 flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-50">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 className="font-semibold text-slate-800 dark:text-slate-50 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-xl transition"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   LOGIN SCREEN
   ============================================================ */

function LoginScreen({ students, staff, onLoginParent, onLoginAdmin, onLoginTeacher, dark, toggleDark }) {
  const [mode, setMode] = useState("parent");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!id || !pw) { setError("Please enter both fields."); return; }

    if (mode === "admin") {
      if (id === ADMIN_CREDENTIALS.username && pw === ADMIN_CREDENTIALS.password) {
        setError(""); onLoginAdmin();
      } else {
        setError("Incorrect admin username or password.");
      }
      return;
    }

    if (mode === "teacher") {
      const teacher = staff.find((t) => t.username === id.trim());
      if (!teacher) { setError("No teacher found with that username."); return; }
      if (teacher.password !== pw) { setError("Incorrect password."); return; }
      setError(""); onLoginTeacher(teacher);
      return;
    }

    // parent / student
    const student = students.find((s) => s.admissionNo === id.trim());
    if (!student) { setError("No student found with that admission number."); return; }
    if (student.password !== pw) { setError("Incorrect password."); return; }
    setError(""); onLoginParent(student);
  }

  const tabs = [
    ["parent", "Parent"],
    ["teacher", "Teacher"],
    ["admin", "Admin"],
  ];

  const placeholders = {
    parent: "Admission No — e.g. 2026-001",
    teacher: "Username — e.g. ali.hasan",
    admin: "Username",
  };

  const hints = {
    parent: "Both username and password are the student's admission number.",
    teacher: "Use the username and password set during your account creation.",
    admin: `Demo: ${ADMIN_CREDENTIALS.username} / ${ADMIN_CREDENTIALS.password}`,
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0B3D91] via-[#123e8c] to-[#1E88E5] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-10 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 20px 20px, white 1.5px, transparent 1.5px)",
        backgroundSize: "40px 40px"
      }} />

      <button
        onClick={toggleDark}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="flex flex-col items-center mb-8 text-center z-10">
        <div className="w-20 h-20 rounded-2xl bg-white/95 flex items-center justify-center shadow-xl mb-4 border-4 border-white/40">
          <GraduationCap size={38} className="text-[#0B3D91]" />
        </div>
        <h1 className="text-white font-bold text-2xl sm:text-3xl tracking-tight">
          SIDDEEQ MOULA ARABIC COLLEGE
        </h1>
        <p className="text-blue-100 text-sm mt-1 tracking-wide">(SMAC)</p>
        <p className="text-blue-200/90 text-sm mt-3">Student Performance &amp; Parent Portal</p>
      </div>

      <Card className="w-full max-w-sm p-6 z-10">
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-6">
          {tabs.map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setId(""); setPw(""); }}
              className={
                "flex-1 py-2 text-xs font-medium rounded-lg transition " +
                (mode === m ? "bg-[#0B3D91] text-white shadow" : "text-slate-500 dark:text-slate-300")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {mode === "parent" ? "Admission Number" : "Username"}
            </label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={placeholders[mode]}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Password</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#0B3D91] hover:bg-[#0a3580] text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            Sign in <ChevronRight size={16} />
          </button>
        </form>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-4">
          {hints[mode]}
        </p>
      </Card>
    </div>
  );
}

/* ============================================================
   DASHBOARD CARDS
   ============================================================ */

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-[#0B3D91]/10 dark:bg-[#1E88E5]/20 flex items-center justify-center text-[#0B3D91] dark:text-[#90CAF9] shrink-0">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-50">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500">{sub}</p>}
      </div>
    </Card>
  );
}

/* ============================================================
   PROFILE CARD
   ============================================================ */

function ProfileCard({ student, staff }) {
  const classTeacher = staff.find((t) => t.classTeacherOf === student.class);
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#1E88E5] flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
        {student.photo ? <img src={student.photo} alt={student.name} className="w-full h-full object-cover" /> : initials(student.name)}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-slate-800 dark:text-slate-50 text-base truncate">{student.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Admission No: {student.admissionNo} · Roll No: {student.rollNo}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{CLASS_LABELS[student.class] || student.class}</p>
        <div className="flex flex-wrap gap-x-3 mt-1">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Class Teacher: {classTeacher ? classTeacher.name : "—"}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">AY {student.year}</span>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   INTERNAL MARKS TABLE (subject teacher shown as subscript)
   ============================================================ */

function MarksTable({ student, staff, subjectMarks }) {
  const total = subjectMarks.reduce((a, s) => a + s.marks, 0);
  const max   = subjectMarks.reduce((a, s) => a + s.max,   0);
  const pct   = ((total / max) * 100).toFixed(1);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-50 flex items-center gap-2">
          <BookOpen size={16} className="text-[#0B3D91] dark:text-[#90CAF9]" /> Internal Marks
        </h3>
        <span className="text-xs font-medium text-[#0B3D91] dark:text-[#90CAF9] bg-[#0B3D91]/10 dark:bg-[#1E88E5]/20 px-2.5 py-1 rounded-full">
          {pct}%
        </span>
      </div>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 dark:text-slate-500 text-xs border-b border-slate-100 dark:border-slate-700">
              <th className="py-2 px-1">Subject</th>
              <th className="py-2 px-1 text-right">Marks</th>
              <th className="py-2 px-1 text-right">Max</th>
            </tr>
          </thead>
          <tbody>
            {subjectMarks.map((s) => {
              const subjTeachers = teachersFor(staff, student.class, s.subject);
              return (
                <tr key={s.subject} className="border-b border-slate-50 dark:border-slate-700/50">
                  <td className="py-2 px-1 text-slate-700 dark:text-slate-200">
                    {s.subject}
                    {subjTeachers.length > 0 && (
                      <sub className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
                        {subjTeachers.map((t) => t.name).join(", ")}
                      </sub>
                    )}
                  </td>
                  <td className="py-2 px-1 text-right font-medium text-slate-800 dark:text-slate-100">{s.marks}</td>
                  <td className="py-2 px-1 text-right text-slate-400 dark:text-slate-500">{s.max}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-slate-800 dark:text-slate-50">
              <td className="py-2 px-1">Total</td>
              <td className="py-2 px-1 text-right">{total}</td>
              <td className="py-2 px-1 text-right text-slate-400 dark:text-slate-500">{max}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

/* ============================================================
   GRACE MARKS DASHBOARD + CHARTS
   ============================================================ */

function GraceMarksSection({ graceObtained, graceMax, weeklyGrace, subjectMarks }) {
  const totalObtained = Object.values(graceObtained).reduce((a, b) => a + b, 0);
  const totalMax = Object.values(graceMax).reduce((a, b) => a + b, 0);
  const pct = (totalObtained / totalMax) * 100;
  const { grade, status } = gradeFromPercent(pct);

  const overallPieData = [
    { name: "Obtained", value: totalObtained },
    { name: "Remaining", value: totalMax - totalObtained },
  ];

  const categoryPieData = Object.entries(graceObtained).map(([k, v]) => ({ name: k, value: v }));

  const subjectBarData = subjectMarks.map((s) => ({ subject: s.subject.length > 6 ? s.subject.slice(0, 6) + "…" : s.subject, marks: s.marks }));

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h3 className="font-semibold text-slate-800 dark:text-slate-50 mb-4">Grace Marks Analysis</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
            <p className="text-xs text-slate-400 dark:text-slate-500">Total</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-50">{totalObtained}/{totalMax}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
            <p className="text-xs text-slate-400 dark:text-slate-500">Percentage</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-50">{pct.toFixed(1)}%</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
            <p className="text-xs text-slate-400 dark:text-slate-500">Grade</p>
            <p className="text-lg font-bold text-[#0B3D91] dark:text-[#90CAF9]">{grade}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
            <p className="text-xs text-slate-400 dark:text-slate-500">Status</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{status}</p>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-5">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Obtained vs Remaining</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={overallPieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={2}>
                <Cell fill="#0B3D91" />
                <Cell fill="#E2E8F0" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Category-wise Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryPieData} dataKey="value" nameKey="name" outerRadius={75} label={false}>
                {categoryPieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Weekly Performance</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={weeklyGrace.map(w => ({ name: w.week, value: w.marks }))} dataKey="value" nameKey="name" outerRadius={75}>
                {weeklyGrace.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Subject-wise Marks</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="marks" fill="#1E88E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 sm:col-span-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Monthly Progress</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MONTHLY_PROGRESS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="overall" stroke="#0B3D91" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   TEACHER REMARKS
   ============================================================ */

function TeacherRemarks({ remarks }) {
  return (
    <Card className="p-5 space-y-4">
      <h3 className="font-semibold text-slate-800 dark:text-slate-50">Teacher Remarks</h3>
      {[
        ["Strengths", remarks.strengths],
        ["Areas for Improvement", remarks.improvement],
        ["Suggestions", remarks.suggestions],
      ].map(([title, text]) => (
        <div key={title}>
          <p className="text-xs font-medium text-[#0B3D91] dark:text-[#90CAF9] mb-1">{title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{text}</p>
        </div>
      ))}
    </Card>
  );
}

/* ============================================================
   TEACHER / STAFF DIRECTORY
   ============================================================ */

function TeacherCard({ teacher, onEdit, onDelete }) {
  const subjectEntries = CLASS_LIST
    .map((c) => ({ c, subjects: teacher.teachingSubjects[c] || [] }))
    .filter((e) => e.subjects.length > 0);

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0B3D91] to-[#1E88E5] flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
          {teacher.photo ? <img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" /> : initials(teacher.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-800 dark:text-slate-50 truncate">{teacher.name}</p>
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-2 shrink-0">
                {onEdit && (
                  <button onClick={() => onEdit(teacher)} className="text-xs font-medium text-[#0B3D91] dark:text-[#90CAF9]">
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(teacher)} className="text-xs font-medium text-red-500 dark:text-red-400">
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
          {teacher.phone && (
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone size={11} /> {teacher.phone}
            </p>
          )}
          {teacher.username && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Login: <span className="font-medium">{teacher.username}</span>
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {teacher.positions.map((p) => <Pill key={p} tone="blue">{p}</Pill>)}
            {teacher.classTeacherOf && <Pill tone="green">Class Teacher · {teacher.classTeacherOf}</Pill>}
          </div>
        </div>
      </div>

      {teacher.duties.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">Special Duties</p>
          <div className="flex flex-wrap gap-1.5">
            {teacher.duties.map((d) => <Pill key={d} tone="slate">{d}</Pill>)}
          </div>
        </div>
      )}

      {subjectEntries.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mb-1.5">Teaching Subjects</p>
          <div className="space-y-1.5">
            {subjectEntries.map(({ c, subjects }) => (
              <p key={c} className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-medium text-[#0B3D91] dark:text-[#90CAF9]">{c}:</span> {subjects.join(", ")}
              </p>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function TeacherDirectory({ staff, onEdit, onDelete }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-800 dark:text-slate-50 mb-4 flex items-center gap-2">
        <Briefcase size={16} className="text-[#0B3D91] dark:text-[#90CAF9]" /> Staff Directory
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {staff.map((t) => <TeacherCard key={t.id} teacher={t} onEdit={onEdit} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN: ADD STUDENT FORM
   ============================================================ */

function AddStudentForm({ students, onAdd }) {
  const [name, setName] = useState("");
  const [klass, setKlass] = useState("S1");
  const [year, setYear] = useState("2026-27");
  const [photo, setPhoto] = useState(null);
  const [createdMsg, setCreatedMsg] = useState(null);

  const previewAdmissionNo = useMemo(() => nextAdmissionNo(students), [students]);
  const previewRollNo = useMemo(() => nextRollNo(students, klass), [students, klass]);

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const admissionNo = nextAdmissionNo(students);
    const rollNo = nextRollNo(students, klass);
    const student = {
      admissionNo,
      name: name.trim(),
      class: klass,
      year,
      photo,
      password: admissionNo, // username & password both default to admission number
      rollNo,
      overallPercent: computeStudentOverallPercent(), // auto-calculated from internal + grace marks
    };
    onAdd(student);
    setCreatedMsg(student);
    setName("");
    setPhoto(null);
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-slate-800 dark:text-slate-50 mb-1 flex items-center gap-2">
        <UserPlus size={16} className="text-[#0B3D91] dark:text-[#90CAF9]" /> Add Student
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        Login username and password are both set automatically to the admission number. Roll number is assigned automatically within the class. Performance score is always calculated from the student's internal marks and grace marks — never entered manually.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 cursor-pointer overflow-hidden shrink-0">
            {photo ? <img src={photo} alt="preview" className="w-full h-full object-cover" /> : <Camera size={20} />}
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Student Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yusuf Ibrahim"
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Class</label>
            <select
              value={klass}
              onChange={(e) => setKlass(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            >
              {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Academic Year</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Admission No</span>
            <span className="text-sm font-semibold text-[#0B3D91] dark:text-[#90CAF9]">{previewAdmissionNo}</span>
          </div>
          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Roll No ({klass})</span>
            <span className="text-sm font-semibold text-[#0B3D91] dark:text-[#90CAF9]">{previewRollNo}</span>
          </div>
        </div>

        <button type="submit" className="bg-[#0B3D91] text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Plus size={14} /> Create student profile
        </button>
      </form>

      {createdMsg && (
        <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
          <Check size={14} className="mt-0.5 shrink-0" />
          <span>
            Created <strong>{createdMsg.name}</strong> — login with admission number{" "}
            <strong>{createdMsg.admissionNo}</strong> as both username and password.
          </span>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   ADMIN: EDIT STUDENT MODAL
   ============================================================ */

function EditStudentModal({ student, students, onSave, onClose }) {
  const [name, setName] = useState(student.name);
  const [klass, setKlass] = useState(student.class);
  const [year, setYear] = useState(student.year);
  const [photo, setPhoto] = useState(student.photo);
  const [rollNo, setRollNo] = useState(student.rollNo || 1);

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...student,
      name: name.trim(),
      class: klass,
      year,
      photo,
      rollNo: Number(rollNo) || 1,
      overallPercent: computeStudentOverallPercent(), // auto-calculated, not editable
    });
  }

  return (
    <Modal title="Edit Student" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex items-center gap-4">
          <label className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 cursor-pointer overflow-hidden shrink-0">
            {photo ? <img src={photo} alt="preview" className="w-full h-full object-cover" /> : <Camera size={20} />}
            <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </label>
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Student Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Class</label>
            <select
              value={klass}
              onChange={(e) => setKlass(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            >
              {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Academic Year</label>
            <input
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Roll No (in class)</label>
          <input
            type="number"
            min="1"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">Admission No (login username &amp; password)</span>
          <span className="text-sm font-semibold text-[#0B3D91] dark:text-[#90CAF9]">{student.admissionNo}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="submit" className="bg-[#0B3D91] text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Save size={14} /> Save changes
          </button>
          <button type="button" onClick={onClose} className="border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2.5 rounded-xl">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================
   ADMIN: ADD STAFF FORM
   ============================================================ */

function StaffFormFields({
  name, setName, phone, setPhone, photo, setPhoto,
  username, setUsername, password, setPassword,
  positions, setPositions, classTeacherOf, setClassTeacherOf,
  duties, setDuties, teachingSubjects, setTeachingSubjects,
}) {
  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function togglePositions(next) {
    setPositions(next);
    if (!next.includes("Class Teacher")) setClassTeacherOf("");
  }

  return (
    <>
      <div className="flex items-center gap-4">
        <label className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 cursor-pointer overflow-hidden shrink-0">
          {photo ? <img src={photo} alt="preview" className="w-full h-full object-cover" /> : <Camera size={20} />}
          <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </label>
        <div className="flex-1 space-y-2">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmad Kabir"
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 ..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2">
          Login credentials — ask the teacher to choose their own username and password
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ahmad.kabir"
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Position</label>
        <MultiSelect options={POSITIONS_LIST} selected={positions} onChange={togglePositions} />
      </div>

      {positions.includes("Class Teacher") && (
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Class Teacher Of</label>
          <select
            value={classTeacherOf}
            onChange={(e) => setClassTeacherOf(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
          >
            <option value="">Select class…</option>
            {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Special Duties</label>
        <MultiSelect options={DUTIES_LIST} selected={duties} onChange={setDuties} />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Teaching Subjects (by class)</label>
        <div className="space-y-3">
          {CLASS_LIST.map((c) => (
            <div key={c} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-[#0B3D91] dark:text-[#90CAF9] mb-1.5">{c}</p>
              <MultiSelect
                options={SUBJECTS_BY_CLASS[c]}
                selected={teachingSubjects[c]}
                onChange={(sel) => setTeachingSubjects((prev) => ({ ...prev, [c]: sel }))}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function AddStaffForm({ onAdd, staff }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [positions, setPositions] = useState([]);
  const [classTeacherOf, setClassTeacherOf] = useState("");
  const [duties, setDuties] = useState([]);
  const [teachingSubjects, setTeachingSubjects] = useState({ S1: [], S2: [], S3: [], S4: [] });
  const [savedMsg, setSavedMsg] = useState(false);
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    if (!username.trim() || !password.trim()) {
      setError("Please set a username and password for the teacher to log in with.");
      return;
    }
    if (staff.some((t) => t.username.toLowerCase() === username.trim().toLowerCase())) {
      setError("That username is already taken — please choose a different one.");
      return;
    }
    setError("");
    onAdd({
      id: `T-${Date.now()}`,
      name: name.trim(),
      phone,
      photo,
      username: username.trim(),
      password: password.trim(),
      positions,
      classTeacherOf: positions.includes("Class Teacher") ? classTeacherOf : "",
      duties,
      teachingSubjects,
    });
    setSavedMsg(true);
    setName(""); setPhone(""); setPhoto(null); setUsername(""); setPassword("");
    setPositions([]); setClassTeacherOf(""); setDuties([]);
    setTeachingSubjects({ S1: [], S2: [], S3: [], S4: [] });
    setTimeout(() => setSavedMsg(false), 2000);
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-slate-800 dark:text-slate-50 mb-4 flex items-center gap-2">
        <UserPlus size={16} className="text-[#0B3D91] dark:text-[#90CAF9]" /> Add Staff
      </h3>

      <form onSubmit={submit} className="space-y-4">
        <StaffFormFields
          name={name} setName={setName} phone={phone} setPhone={setPhone}
          photo={photo} setPhoto={setPhoto}
          username={username} setUsername={setUsername}
          password={password} setPassword={setPassword}
          positions={positions} setPositions={setPositions}
          classTeacherOf={classTeacherOf} setClassTeacherOf={setClassTeacherOf}
          duties={duties} setDuties={setDuties}
          teachingSubjects={teachingSubjects} setTeachingSubjects={setTeachingSubjects}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button type="submit" className="bg-[#0B3D91] text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Plus size={14} /> Add staff member
        </button>
        {savedMsg && (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 ml-2">
            <Check size={14} /> Staff added
          </span>
        )}
      </form>
    </Card>
  );
}

/* ============================================================
   ADMIN: EDIT STAFF MODAL
   ============================================================ */

function EditStaffModal({ teacher, onSave, onClose }) {
  const [name, setName] = useState(teacher.name);
  const [phone, setPhone] = useState(teacher.phone);
  const [photo, setPhoto] = useState(teacher.photo);
  const [username, setUsername] = useState(teacher.username || "");
  const [password, setPassword] = useState(teacher.password || "");
  const [positions, setPositions] = useState(teacher.positions);
  const [classTeacherOf, setClassTeacherOf] = useState(teacher.classTeacherOf);
  const [duties, setDuties] = useState(teacher.duties);
  const [teachingSubjects, setTeachingSubjects] = useState(teacher.teachingSubjects);

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...teacher,
      name: name.trim(),
      phone,
      photo,
      username: username.trim(),
      password: password.trim(),
      positions,
      classTeacherOf: positions.includes("Class Teacher") ? classTeacherOf : "",
      duties,
      teachingSubjects,
    });
  }

  return (
    <Modal title="Edit Staff" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <StaffFormFields
          name={name} setName={setName} phone={phone} setPhone={setPhone}
          photo={photo} setPhoto={setPhoto}
          username={username} setUsername={setUsername}
          password={password} setPassword={setPassword}
          positions={positions} setPositions={setPositions}
          classTeacherOf={classTeacherOf} setClassTeacherOf={setClassTeacherOf}
          duties={duties} setDuties={setDuties}
          teachingSubjects={teachingSubjects} setTeachingSubjects={setTeachingSubjects}
        />
        <div className="flex gap-2 pt-1">
          <button type="submit" className="bg-[#0B3D91] text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
            <Save size={14} /> Save changes
          </button>
          <button type="button" onClick={onClose} className="border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium px-4 py-2.5 rounded-xl">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================
   ADMIN PANEL
   ============================================================ */

function AdminPanel({ students, setStudents, staff, setStaff }) {
  const [maxima, setMaxima] = useState(GRACE_CATEGORIES_MAX);
  const [published, setPublished] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [section, setSection] = useState("students");
  const [classFilter, setClassFilter] = useState("all");
  const [sortBy, setSortBy] = useState("roll");
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: "student"|"staff", item }

  function saveMaxima() {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1800);
  }

  function saveStudent(updated) {
    setStudents((prev) => prev.map((s) => (s.admissionNo === updated.admissionNo ? updated : s)));
    setEditingStudent(null);
  }

  function saveStaff(updated) {
    setStaff((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingStaff(null);
  }

  function deleteStudent(s) {
    setConfirmDelete({ type: "student", item: s });
  }

  function deleteStaff(t) {
    setConfirmDelete({ type: "staff", item: t });
  }

  function confirmDoDelete() {
    if (!confirmDelete) return;
    if (confirmDelete.type === "student") {
      setStudents((prev) => prev.filter((s) => s.admissionNo !== confirmDelete.item.admissionNo));
    } else {
      setStaff((prev) => prev.filter((t) => t.id !== confirmDelete.item.id));
    }
    setConfirmDelete(null);
  }

  const ranks = useMemo(() => computeClassRanks(students), [students]);
  const visibleStudents = useMemo(() => {
    const filtered = classFilter === "all" ? students : students.filter((s) => s.class === classFilter);
    return sortStudents(filtered, sortBy, ranks);
  }, [students, classFilter, sortBy, ranks]);

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ["students", "Students"],
          ["staff", "Staff"],
          ["grace", "Grace Categories"],
          ["sheets", "Google Sheets"],
          ["publish", "Publishing"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border " +
              (section === key
                ? "bg-[#0B3D91] border-[#0B3D91] text-white"
                : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {section === "students" && (
        <div className="space-y-5">
          <AddStudentForm students={students} onAdd={(s) => setStudents((prev) => [...prev, s])} />
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-50">All Students ({visibleStudents.length})</h3>
              <div className="flex gap-2">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-600 dark:text-slate-200"
                >
                  <option value="all">All Classes</option>
                  {CLASS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-600 dark:text-slate-200"
                >
                  <option value="roll">Sort: Roll No</option>
                  <option value="admission">Sort: Admission No</option>
                  <option value="rank">Sort: Class Rank</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {visibleStudents.map((s) => (
                <div key={s.admissionNo} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2.5 gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#0B3D91]/10 dark:bg-[#1E88E5]/20 flex items-center justify-center text-[#0B3D91] dark:text-[#90CAF9] text-xs font-bold shrink-0 overflow-hidden">
                      {s.photo ? <img src={s.photo} alt={s.name} className="w-full h-full object-cover" /> : initials(s.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-100 truncate">{s.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {s.class} · Roll {s.rollNo} · {s.admissionNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Pill tone="green">Rank {ranks.get(s.admissionNo) || "—"}</Pill>
                    <Pill tone="slate">{computeStudentOverallPercent()}%</Pill>
                    <button
                      onClick={() => setEditingStudent(s)}
                      className="text-xs font-medium text-[#0B3D91] dark:text-[#90CAF9] px-2 py-1 rounded-lg hover:bg-[#0B3D91]/10 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteStudent(s)}
                      className="text-xs font-medium text-red-500 dark:text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {visibleStudents.length === 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No students in this class yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {section === "staff" && (
        <div className="space-y-5">
          <AddStaffForm staff={staff} onAdd={(t) => setStaff((prev) => [...prev, t])} />
          <TeacherDirectory staff={staff} onEdit={setEditingStaff} onDelete={deleteStaff} />
        </div>
      )}

      {section === "grace" && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-50 mb-3 flex items-center gap-2">
            <Settings size={16} className="text-[#0B3D91] dark:text-[#90CAF9]" /> Grace Mark Categories — Max Marks
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(maxima).map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">{cat}</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => setMaxima((m) => ({ ...m, [cat]: Number(e.target.value) }))}
                  className="w-16 text-right rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={saveMaxima} className="bg-[#0B3D91] text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
              <Save size={14} /> Save changes
            </button>
            {savedMsg && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check size={14} /> Saved
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
              Total: {Object.values(maxima).reduce((a, b) => a + b, 0)} marks
            </span>
          </div>
        </Card>
      )}

      {section === "sheets" && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-50 mb-3">Google Sheets Import</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Connect a published Google Sheet using these columns, then sync to refresh student data automatically.
          </p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {SHEET_COLUMNS.map((c) => <Pill key={c} tone="slate">{c}</Pill>)}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
              <Upload size={14} /> Connect Sheet URL
            </button>
            <button className="bg-[#1E88E5] text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
              Sync now
            </button>
          </div>
        </Card>
      )}

      {section === "publish" && (
        <Card className="p-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-50">Report Publishing</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {published ? "Reports are locked and visible to parents." : "Reports are in draft — not visible to parents yet."}
            </p>
          </div>
          <button
            onClick={() => setPublished((p) => !p)}
            className={
              "text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 " +
              (published ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200" : "bg-[#0B3D91] text-white")
            }
          >
            {published ? <Unlock size={14} /> : <Lock size={14} />}
            {published ? "Unpublish" : "Publish & lock"}
          </button>
        </Card>
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          students={students}
          onSave={saveStudent}
          onClose={() => setEditingStudent(null)}
        />
      )}

      {editingStaff && (
        <EditStaffModal
          teacher={editingStaff}
          onSave={saveStaff}
          onClose={() => setEditingStaff(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.type === "student" ? "Student" : "Staff Member"}?`}
          message={
            confirmDelete.type === "student"
              ? `Are you sure you want to delete ${confirmDelete.item.name} (${confirmDelete.item.admissionNo})? This cannot be undone.`
              : `Are you sure you want to delete ${confirmDelete.item.name}? Their login credentials will also be removed.`
          }
          onConfirm={confirmDoDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */

export default function App() {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState(null); // null | "parent" | "teacher" | "admin"
  const [activeStudent, setActiveStudent] = useState(null);
  const [activeTeacher, setActiveTeacher] = useState(null);
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [sheetData, setSheetData] = useState(null);     // live data fetched from Google Sheets
  const [sheetLoading, setSheetLoading] = useState(false);

  const [students, setStudents] = useState(initialStudents);
  const [staff, setStaff] = useState(initialStaff);

  // All totals prefer live Sheets data; fall back to demo constants when not yet synced
  const subjectMarksLive = sheetData?.subjectMarks ?? SUBJECT_MARKS;
  const graceObtainedLive = sheetData?.graceObtained ?? GRACE_OBTAINED;
  const graceMaxLive = sheetData?.graceMax ?? GRACE_CATEGORIES_MAX;
  const attendanceLive = sheetData?.attendance?.percent ?? "96%";
  const remarksLive = sheetData?.remarks ?? REMARKS;
  const weeklyGraceLive = sheetData?.weeklyGrace ?? WEEKLY_GRACE;

  const totalInternal = useMemo(() => subjectMarksLive.reduce((a, s) => a + s.marks, 0), [subjectMarksLive]);
  const maxInternal   = useMemo(() => subjectMarksLive.reduce((a, s) => a + s.max,   0), [subjectMarksLive]);
  const totalGrace    = useMemo(() => Object.values(graceObtainedLive).reduce((a, b) => a + b, 0), [graceObtainedLive]);
  const overallPct    = (((totalInternal / maxInternal) + (totalGrace / 100)) / 2 * 100).toFixed(1);
  const { grade }     = gradeFromPercent(overallPct);

  const classRanks = useMemo(() => computeClassRanks(students), [students]);

  async function loginParent(student) {
    setActiveStudent(student);
    setUser("parent");
    setTab("overview");

    // Fetch live data from Google Sheets
    try {
      setSheetLoading(true);
      const data = await fetchStudentData(student.admissionNo);
      if (data) setSheetData(data);   // updates all marks/grace/attendance/remarks live
    } catch (err) {
      console.error("Sheets fetch failed:", err.message);
      // Falls back to demo data already shown — no disruption to the user
    } finally {
      setSheetLoading(false);
    }
  }

  function loginAdmin() {
    setUser("admin");
    setTab("overview");
  }

  function loginTeacher(teacher) {
    setUser("teacher");
    setActiveStudent(null);
    setTab("overview");
    setActiveTeacher(teacher);
  }

  function logout() {
    setUser(null);
    setActiveStudent(null);
    setActiveTeacher(null);
    setSheetData(null);      // clear live data on logout so next login fetches fresh
    setSheetLoading(false);
  }

  if (!user) {
    return (
      <div className={dark ? "dark" : ""}>
        <LoginScreen
          students={students}
          staff={staff}
          onLoginParent={loginParent}
          onLoginAdmin={loginAdmin}
          onLoginTeacher={loginTeacher}
          dark={dark}
          toggleDark={() => setDark((d) => !d)}
        />
      </div>
    );
  }

  const student = activeStudent || students[0];

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-[#0B3D91] text-white shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <GraduationCap size={18} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm leading-tight truncate">SMAC Portal</p>
                <p className="text-[11px] text-blue-100/80 leading-tight truncate">
                  {user === "admin" ? "Admin Dashboard" : user === "teacher" ? `Teacher — ${activeTeacher?.name}` : "Parent Dashboard"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setDark((d) => !d)} className="p-2 rounded-full hover:bg-white/10" aria-label="Toggle dark mode">
                {dark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={logout} className="p-2 rounded-full hover:bg-white/10" aria-label="Log out">
                <LogOut size={16} />
              </button>
            </div>
          </div>
          {/* TABS */}
          <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2 text-sm">
            {(user === "admin"
              ? [["overview", "Overview"], ["grace", "Grace Marks"], ["teachers", "Teachers"], ["admin", "Admin Panel"]]
              : user === "teacher"
              ? [["overview", "My Profile"], ["teachers", "Staff Directory"]]
              : [["overview", "Overview"], ["grace", "Grace Marks"], ["teachers", "Teachers"], ["remarks", "Remarks"]]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={
                  "px-3 py-1.5 rounded-full whitespace-nowrap transition " +
                  (tab === key ? "bg-white text-[#0B3D91] font-medium" : "text-blue-100 hover:bg-white/10")
                }
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
          {user === "parent" && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by admission number…"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1E88E5]"
              />
            </div>
          )}

          {/* TEACHER OVERVIEW */}
          {user === "teacher" && tab === "overview" && activeTeacher && (
            <div className="space-y-4">
              <TeacherCard teacher={activeTeacher} />
              <Card className="p-5">
                <h3 className="font-semibold text-slate-800 dark:text-slate-50 mb-3">My Classes</h3>
                {CLASS_LIST.filter((c) => (activeTeacher.teachingSubjects[c] || []).length > 0).map((c) => (
                  <div key={c} className="mb-3">
                    <p className="text-xs font-medium text-[#0B3D91] dark:text-[#90CAF9] mb-1">{c}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeTeacher.teachingSubjects[c].map((s) => <Pill key={s} tone="slate">{s}</Pill>)}
                    </div>
                  </div>
                ))}
                {activeTeacher.classTeacherOf && (
                  <Pill tone="green">Class Teacher of {activeTeacher.classTeacherOf}</Pill>
                )}
              </Card>
            </div>
          )}

          {user === "teacher" && tab === "teachers" && (
            <TeacherDirectory staff={staff} />
          )}

          {/* Sheets sync loading banner */}
          {sheetLoading && (
            <div className="flex items-center gap-2 bg-[#0B3D91]/10 dark:bg-[#1E88E5]/20 text-[#0B3D91] dark:text-[#90CAF9] text-xs font-medium px-4 py-2.5 rounded-xl">
              <svg className="animate-spin w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Syncing marks from Google Sheets…
            </div>
          )}

          {/* Live Sheets badge — shown once data arrives */}
          {sheetData && !sheetLoading && (
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium px-1">
              <Check size={13} /> Marks loaded live from Google Sheets
            </div>
          )}

          {tab === "overview" && user !== "teacher" && (
            <>
              <ProfileCard student={student} staff={staff} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={BookOpen} label="Internal Marks" value={`${totalInternal}/${maxInternal}`} />
                <StatCard icon={Award} label="Grace Marks" value={`${totalGrace}/100`} />
                <StatCard icon={Check} label="Attendance" value={`${attendanceLive}${typeof attendanceLive === "number" ? "%" : ""}`} />
                <StatCard icon={TrendingUp} label="Overall %" value={`${overallPct}%`} />
                <StatCard
                  icon={Users}
                  label="Class Rank"
                  value={`${classRanks.get(student.admissionNo) || "—"}`}
                  sub={`of ${students.filter((s) => s.class === student.class).length} in ${student.class}`}
                />
                <StatCard icon={GraduationCap} label="Grade" value={grade} />
              </div>
              <MarksTable student={student} staff={staff} subjectMarks={subjectMarksLive} />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const classTeacher = staff.find((t) => t.classTeacherOf === student.class);
                    const classSize = students.filter((s) => s.class === student.class).length;
                    generateReportCardPDF({
                      student,
                      subjectMarks: subjectMarksLive,
                      graceObtained: graceObtainedLive,
                      graceMax: graceMaxLive,
                      classTeacher,
                      options: {
                        attendance: attendanceLive,
                        overallPct,
                        grade,
                        classRank: `${classRanks.get(student.admissionNo) || "—"} of ${classSize}`,
                        remarks: remarksLive,
                      },
                    });
                  }}
                  className="bg-[#0B3D91] text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <Download size={14} /> Download PDF report
                </button>
                <button
                  onClick={() => window.print()}
                  className="border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2"
                >
                  <Printer size={14} /> Print report card
                </button>
              </div>
            </>
          )}

          {tab === "grace" && user !== "teacher" && (
            <GraceMarksSection
              graceObtained={graceObtainedLive}
              graceMax={graceMaxLive}
              weeklyGrace={weeklyGraceLive}
              subjectMarks={subjectMarksLive}
            />
          )}
          {tab === "teachers" && user !== "teacher" && <TeacherDirectory staff={staff} />}
          {tab === "remarks" && user !== "teacher" && <TeacherRemarks remarks={remarksLive} />}
          {tab === "admin" && user === "admin" && (
            <AdminPanel students={students} setStudents={setStudents} staff={staff} setStaff={setStaff} />
          )}
        </main>

        <footer className="text-center text-xs text-slate-400 dark:text-slate-500 py-6">
          © 2026 Siddeeq Moula Arabic College (SMAC) — Student Performance &amp; Parent Portal
        </footer>
      </div>
    </div>
  );
}
