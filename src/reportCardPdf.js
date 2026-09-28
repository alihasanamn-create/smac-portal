import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "./assets/smac-logo.png";

const NAVY = [11, 61, 145];
const BLUE = [30, 136, 229];
const SLATE = [71, 85, 105];
const LIGHT_SLATE = [148, 163, 184];

/**
 * Generates a polished PDF report card.
 * @param {object} student - { name, admissionNo, class, year, photo }
 * @param {array} subjectMarks - [{ subject, marks, max }]
 * @param {object} graceObtained - { category: value }
 * @param {object} graceMax - { category: value }
 * @param {object} classTeacher - { name } | null
 * @param {object} options - { attendance, overallPct, grade, classRank, remarks }
 */
export function generateReportCardPDF({
  student,
  subjectMarks,
  graceObtained,
  graceMax,
  classTeacher,
  options = {},
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  let cursorY = 0;

  /* ---------------- HEADER ---------------- */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 96, "F");

  // logo
  try {
    doc.addImage(logo, "PNG", marginX, 18, 60, 60);
  } catch (e) {
    // logo failed to load — continue without it
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("SIDDEEQ MOULA ARABIC COLLEGE", marginX + 74, 38);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("(SMAC)", marginX + 74, 53);

  doc.setFontSize(10.5);
  doc.setTextColor(200, 220, 255);
  doc.text("Student Performance Report Card", marginX + 74, 70);

  doc.setFontSize(9);
  doc.setTextColor(190, 210, 250);
  doc.text(`Academic Year ${student.year || ""}`, pageWidth - marginX, 38, { align: "right" });
  doc.text(new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), pageWidth - marginX, 53, { align: "right" });

  cursorY = 126;

  /* ---------------- STUDENT DETAILS ---------------- */
  doc.setDrawColor(...LIGHT_SLATE);
  doc.setFillColor(247, 249, 252);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 74, 8, 8, "F");

  // photo box / initials
  const photoSize = 54;
  const photoX = marginX + 14;
  const photoY = cursorY + 10;
  doc.setFillColor(...NAVY);
  doc.roundedRect(photoX, photoY, photoSize, photoSize, 8, 8, "F");
  if (student.photo) {
    try {
      doc.addImage(student.photo, photoX, photoY, photoSize, photoSize);
    } catch (e) {
      drawInitials();
    }
  } else {
    drawInitials();
  }
  function drawInitials() {
    const ini = (student.name || "")
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(ini, photoX + photoSize / 2, photoY + photoSize / 2 + 6, { align: "center" });
  }

  const detailsX = photoX + photoSize + 18;
  const col2X = marginX + (pageWidth - marginX * 2) * 0.62;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text(student.name || "", detailsX, cursorY + 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...SLATE);
  doc.text(`Admission No: ${student.admissionNo || ""}`, detailsX, cursorY + 42);
  doc.text(`Class: ${student.class || ""}`, detailsX, cursorY + 56);

  doc.text(`Class Teacher: ${classTeacher?.name || "—"}`, col2X, cursorY + 42);
  if (options.attendance) doc.text(`Attendance: ${options.attendance}`, col2X, cursorY + 56);

  cursorY += 94;

  /* ---------------- SUMMARY STAT STRIP ---------------- */
  const totalInternal = subjectMarks.reduce((a, s) => a + s.marks, 0);
  const maxInternal = subjectMarks.reduce((a, s) => a + s.max, 0);
  const totalGrace = Object.values(graceObtained).reduce((a, b) => a + b, 0);
  const maxGrace = Object.values(graceMax).reduce((a, b) => a + b, 0);

  const stats = [
    ["Internal Marks", `${totalInternal} / ${maxInternal}`],
    ["Grace Marks", `${totalGrace} / ${maxGrace}`],
    ["Overall %", options.overallPct ? `${options.overallPct}%` : "—"],
    ["Grade", options.grade || "—"],
    ["Class Rank", options.classRank || "—"],
  ];
  const stripW = (pageWidth - marginX * 2) / stats.length;
  stats.forEach(([label, value], i) => {
    const x = marginX + i * stripW;
    doc.setDrawColor(...LIGHT_SLATE);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x + 3, cursorY, stripW - 6, 46, 6, 6, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...SLATE);
    doc.text(label, x + stripW / 2, cursorY + 17, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(String(value), x + stripW / 2, cursorY + 34, { align: "center" });
  });

  cursorY += 64;

  /* ---------------- INTERNAL MARKS TABLE ---------------- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Internal Marks", marginX, cursorY);
  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [["Subject", "Marks Obtained", "Maximum", "Percentage"]],
    body: subjectMarks.map((s) => [
      s.subject,
      String(s.marks),
      String(s.max),
      `${((s.marks / s.max) * 100).toFixed(1)}%`,
    ]),
    foot: [["Total", String(totalInternal), String(maxInternal), `${((totalInternal / maxInternal) * 100).toFixed(1)}%`]],
    theme: "grid",
    headStyles: { fillColor: NAVY, textColor: 255, fontSize: 9, fontStyle: "bold" },
    footStyles: { fillColor: [230, 236, 247], textColor: NAVY, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "right", cellWidth: 90 },
      2: { halign: "right", cellWidth: 80 },
      3: { halign: "right", cellWidth: 90 },
    },
  });

  cursorY = doc.lastAutoTable.finalY + 24;

  /* ---------------- GRACE MARKS TABLE ---------------- */
  if (cursorY > pageHeight - 220) {
    doc.addPage();
    cursorY = 50;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Weekly Grace Marks", marginX, cursorY);
  cursorY += 8;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [["Category", "Obtained", "Maximum"]],
    body: Object.keys(graceMax).map((cat) => [cat, String(graceObtained[cat] ?? 0), String(graceMax[cat])]),
    foot: [["Total", String(totalGrace), String(maxGrace)]],
    theme: "grid",
    headStyles: { fillColor: BLUE, textColor: 255, fontSize: 9, fontStyle: "bold" },
    footStyles: { fillColor: [223, 237, 252], textColor: NAVY, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      1: { halign: "right", cellWidth: 90 },
      2: { halign: "right", cellWidth: 90 },
    },
  });

  cursorY = doc.lastAutoTable.finalY + 24;

  /* ---------------- TEACHER REMARKS ---------------- */
  if (options.remarks) {
    if (cursorY > pageHeight - 180) {
      doc.addPage();
      cursorY = 50;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("Teacher Remarks", marginX, cursorY);
    cursorY += 16;

    const blocks = [
      ["Strengths", options.remarks.strengths],
      ["Areas for Improvement", options.remarks.improvement],
      ["Suggestions", options.remarks.suggestions],
    ];
    blocks.forEach(([title, text]) => {
      if (!text) return;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...NAVY);
      doc.text(title + ":", marginX, cursorY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...SLATE);
      const wrapped = doc.splitTextToSize(text, pageWidth - marginX * 2 - 130);
      doc.text(wrapped, marginX + 130, cursorY);
      cursorY += Math.max(16, wrapped.length * 12 + 4);
    });
    cursorY += 10;
  }

  /* ---------------- FOOTER / ATTESTATION ---------------- */
  const footerY = pageHeight - 90;
  if (cursorY > footerY - 10) {
    doc.addPage();
  }
  const fy = pageHeight - 90;

  doc.setDrawColor(...LIGHT_SLATE);
  doc.line(marginX, fy, marginX + 160, fy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  doc.text("Class Teacher's Signature", marginX, fy + 13);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(classTeacher?.name || "", marginX, fy - 6);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  doc.text("Attested and verified by the class teacher", pageWidth - marginX, fy + 13, { align: "right" });
  doc.text(`Generated on ${new Date().toLocaleDateString("en-GB")}`, pageWidth - marginX, fy + 26, { align: "right" });

  doc.setDrawColor(...LIGHT_SLATE);
  doc.line(marginX, pageHeight - 36, pageWidth - marginX, pageHeight - 36);
  doc.setFontSize(7.5);
  doc.setTextColor(...LIGHT_SLATE);
  doc.text("© 2026 Siddeeq Moula Arabic College (SMAC) — Student Performance & Parent Portal", pageWidth / 2, pageHeight - 22, { align: "center" });

  doc.save(`${student.admissionNo || "report"}-report-card.pdf`);
}
