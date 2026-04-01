import type { CandidateWithScore } from "@/lib/api";

export function exportCandidatesCSV(candidates: CandidateWithScore[], jobTitle: string) {
  const headers = [
    "Rank",
    "Name",
    "Email",
    "Overall Score",
    "Skills Score",
    "Experience Score",
    "Education Score",
    "Projects Score",
    "Certifications Score",
    "Experience (Years)",
    "Education",
    "Matched Skills",
    "Missing Skills",
    "Status",
  ];

  const rows = candidates.map((c, i) => [
    i + 1,
    c.name || "Unknown",
    c.email || "",
    Math.round(c.score?.overall_score || 0),
    Math.round(c.score?.skills_score || 0),
    Math.round(c.score?.experience_score || 0),
    Math.round(c.score?.education_score || 0),
    Math.round(c.score?.projects_score || 0),
    Math.round(c.score?.certifications_score || 0),
    c.experience_years || 0,
    c.education || "",
    (c.score?.matched_skills || []).join("; "),
    (c.score?.missing_skills || []).join("; "),
    c.status || "pending",
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  downloadFile(csvContent, `${sanitize(jobTitle)}_candidates.csv`, "text/csv");
}

export function exportCandidatesPDF(candidates: CandidateWithScore[], jobTitle: string) {
  // Build a printable HTML document and trigger print-to-PDF
  const rows = candidates
    .map(
      (c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${esc(c.name || "Unknown")}</strong><br/><small>${esc(c.email || "")}</small></td>
      <td style="text-align:center;font-weight:bold;color:${scoreColor(c.score?.overall_score || 0)}">${Math.round(c.score?.overall_score || 0)}%</td>
      <td style="text-align:center">${Math.round(c.score?.skills_score || 0)}</td>
      <td style="text-align:center">${Math.round(c.score?.experience_score || 0)}</td>
      <td style="text-align:center">${Math.round(c.score?.education_score || 0)}</td>
      <td>${c.experience_years || 0} yrs</td>
      <td>${esc(c.education || "—")}</td>
      <td><small>${(c.score?.matched_skills || []).slice(0, 5).join(", ")}${(c.score?.matched_skills?.length || 0) > 5 ? "..." : ""}</small></td>
      <td style="text-transform:capitalize">${c.status || "pending"}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>${esc(jobTitle)} — Candidate Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1a1a1a; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; font-size: 10px; text-transform: uppercase; }
  tr:nth-child(even) { background: #fafafa; }
  @media print { body { padding: 0; } }
</style>
</head><body>
<h1>${esc(jobTitle)} — Candidate Ranking Report</h1>
<p class="meta">Generated on ${new Date().toLocaleDateString()} · ${candidates.length} candidates</p>
<table>
  <thead><tr>
    <th>#</th><th>Candidate</th><th>Score</th><th>Skills</th><th>Exp.</th><th>Edu.</th><th>Years</th><th>Education</th><th>Matched Skills</th><th>Status</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.setTimeout(() => win.print(), 400);
}

function scoreColor(s: number) {
  if (s >= 80) return "#16a34a";
  if (s >= 60) return "#2563eb";
  if (s >= 40) return "#ca8a04";
  return "#dc2626";
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitize(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
