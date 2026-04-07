import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PDFEntry {
  date: string;
  pain: number;
  energy: number;
  mood: number;
  sleepHrs: number;
  sleepQuality: number;
  notes: string;
  medications: string[];
  foodTags: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function wellnessScore(entry: PDFEntry): number {
  return Math.round(((10 - entry.pain) + entry.energy + entry.mood) / 3);
}

function avg(nums: number[]): string {
  if (!nums.length) return 'N/A';
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
}

function scoreBar(value: number, max: number = 10): string {
  const filled = Math.round((value / max) * 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildHTML(entries: PDFEntry[], days: number): string {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const avgPain    = avg(sorted.map((e) => e.pain));
  const avgEnergy  = avg(sorted.map((e) => e.energy));
  const avgMood    = avg(sorted.map((e) => e.mood));
  const avgSleep   = avg(sorted.map((e) => e.sleepHrs));
  const avgWellness = avg(sorted.map((e) => wellnessScore(e)));

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Find most common medications
  const medCounts: Record<string, number> = {};
  sorted.forEach((e) => e.medications.forEach((m) => {
    medCounts[m] = (medCounts[m] ?? 0) + 1;
  }));
  const topMeds = Object.entries(medCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Find most common food tags
  const foodCounts: Record<string, number> = {};
  sorted.forEach((e) => e.foodTags.forEach((f) => {
    foodCounts[f] = (foodCounts[f] ?? 0) + 1;
  }));
  const topFoods = Object.entries(foodCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const entryRows = sorted.map((entry) => {
    const score = wellnessScore(entry);
    const scoreColor =
      score >= 8 ? '#27ae60' :
      score >= 6 ? '#2ecc71' :
      score >= 4 ? '#f39c12' :
      score >= 2 ? '#e67e22' : '#e74c3c';

    return `
      <tr>
        <td style="padding:10px 8px; border-bottom:1px solid #eee; font-size:12px; color:#444;">
          ${formatDate(entry.date)}
        </td>
        <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center;">
          <span style="
            display:inline-block;
            background:${scoreColor};
            color:white;
            border-radius:6px;
            padding:2px 8px;
            font-size:12px;
            font-weight:bold;
          ">${score}/10</span>
        </td>
        <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center; font-size:12px; color:#e74c3c; font-weight:600;">${entry.pain}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center; font-size:12px; color:#f39c12; font-weight:600;">${entry.energy}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center; font-size:12px; color:#27ae60; font-weight:600;">${entry.mood}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #eee; text-align:center; font-size:12px; color:#2980b9; font-weight:600;">${entry.sleepHrs}h</td>
        <td style="padding:10px 8px; border-bottom:1px solid #eee; font-size:11px; color:#666; max-width:200px;">
          ${entry.medications.length ? entry.medications.join(', ') : '—'}
        </td>
        <td style="padding:10px 8px; border-bottom:1px solid #eee; font-size:11px; color:#888; max-width:180px;">
          ${entry.notes ? `"${entry.notes.slice(0, 80)}${entry.notes.length > 80 ? '...' : ''}"` : '—'}
        </td>
      </tr>
    `;
  }).join('');

  const medRows = topMeds.length
    ? topMeds.map(([med, count]) => `
        <tr>
          <td style="padding:8px; font-size:12px; color:#444; border-bottom:1px solid #f0f0f0;">${med}</td>
          <td style="padding:8px; font-size:12px; color:#666; border-bottom:1px solid #f0f0f0; text-align:center;">${count} day${count !== 1 ? 's' : ''}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="2" style="padding:8px; color:#999; font-size:12px;">None logged</td></tr>';

  const foodRows = topFoods.length
    ? topFoods.map(([food, count]) => `
        <tr>
          <td style="padding:8px; font-size:12px; color:#444; border-bottom:1px solid #f0f0f0;">${food}</td>
          <td style="padding:8px; font-size:12px; color:#666; border-bottom:1px solid #f0f0f0; text-align:center;">${count} day${count !== 1 ? 's' : ''}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="2" style="padding:8px; color:#999; font-size:12px;">None logged</td></tr>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Symptom Journal Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, serif; color: #222; background: #fff; }
    .page { padding: 48px; max-width: 900px; margin: 0 auto; }

    .header { border-bottom: 3px solid #1a3050; padding-bottom: 24px; margin-bottom: 32px; }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .app-name { font-size: 11px; font-weight: bold; letter-spacing: 4px; color: #4ECDC4; text-transform: uppercase; margin-bottom: 6px; }
    .report-title { font-size: 32px; font-weight: bold; color: #1a3050; letter-spacing: -1px; }
    .report-subtitle { font-size: 14px; color: #888; margin-top: 4px; }
    .header-meta { text-align: right; }
    .meta-label { font-size: 10px; color: #aaa; letter-spacing: 1px; text-transform: uppercase; }
    .meta-value { font-size: 13px; color: #444; font-weight: bold; margin-top: 2px; }

    .disclaimer {
      background: #fff8e1;
      border-left: 4px solid #f39c12;
      padding: 14px 18px;
      margin-bottom: 32px;
      border-radius: 0 6px 6px 0;
    }
    .disclaimer p {
      font-size: 12px;
      color: #666;
      line-height: 1.6;
    }
    .disclaimer strong { color: #444; }

    .section { margin-bottom: 36px; }
    .section-title {
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 3px;
      color: #4ECDC4;
      text-transform: uppercase;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e8f4f8;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      margin-bottom: 8px;
    }
    .summary-card {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 16px 12px;
      text-align: center;
      border: 1px solid #eee;
    }
    .summary-card .emoji { font-size: 20px; margin-bottom: 6px; }
    .summary-card .value { font-size: 22px; font-weight: bold; color: #1a3050; }
    .summary-card .label { font-size: 10px; color: #999; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 36px; }
    .col-card {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 18px;
      border: 1px solid #eee;
    }
    .col-card-title {
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 2px;
      color: #888;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    table { width: 100%; border-collapse: collapse; }
    th {
      background: #1a3050;
      color: white;
      padding: 10px 8px;
      font-size: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
      text-align: center;
      font-weight: bold;
    }
    th:first-child { text-align: left; border-radius: 6px 0 0 0; }
    th:last-child { border-radius: 0 6px 0 0; }
    tr:nth-child(even) td { background: #fafafa; }

    .footer {
      margin-top: 48px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-left { font-size: 11px; color: #aaa; }
    .footer-right { font-size: 11px; color: #aaa; text-align: right; }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div>
          <div class="app-name">◆ Symptom Journal</div>
          <div class="report-title">Health Report</div>
          <div class="report-subtitle">Last ${days} days of symptom tracking data</div>
        </div>
        <div class="header-meta">
          <div class="meta-label">Generated</div>
          <div class="meta-value">${generatedDate}</div>
          <div class="meta-label" style="margin-top:8px;">Total entries</div>
          <div class="meta-value">${sorted.length} days logged</div>
        </div>
      </div>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
      <p>
        <strong>For your healthcare provider.</strong> This report was generated from self-reported symptom data logged daily using the Symptom Journal app. All scores are on a 0–10 scale unless otherwise noted. This document is intended to supplement — not replace — professional medical evaluation.
      </p>
    </div>

    <!-- Summary -->
    <div class="section">
      <div class="section-title">Summary Averages</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="emoji">🤕</div>
          <div class="value" style="color:#e74c3c;">${avgPain}</div>
          <div class="label">Avg Pain</div>
        </div>
        <div class="summary-card">
          <div class="emoji">⚡</div>
          <div class="value" style="color:#f39c12;">${avgEnergy}</div>
          <div class="label">Avg Energy</div>
        </div>
        <div class="summary-card">
          <div class="emoji">😊</div>
          <div class="value" style="color:#27ae60;">${avgMood}</div>
          <div class="label">Avg Mood</div>
        </div>
        <div class="summary-card">
          <div class="emoji">😴</div>
          <div class="value" style="color:#2980b9;">${avgSleep}h</div>
          <div class="label">Avg Sleep</div>
        </div>
        <div class="summary-card">
          <div class="emoji">💚</div>
          <div class="value" style="color:#1a3050;">${avgWellness}</div>
          <div class="label">Avg Wellness</div>
        </div>
      </div>
    </div>

    <!-- Medications & Food -->
    <div class="two-col">
      <div class="col-card">
        <div class="col-card-title">💊 Most Frequent Medications</div>
        <table>
          <tr>
            <th style="text-align:left; border-radius:4px 0 0 0;">Medication</th>
            <th style="border-radius:0 4px 0 0;">Days taken</th>
          </tr>
          ${medRows}
        </table>
      </div>
      <div class="col-card">
        <div class="col-card-title">🍽️ Most Frequent Food & Drink</div>
        <table>
          <tr>
            <th style="text-align:left; border-radius:4px 0 0 0;">Item</th>
            <th style="border-radius:0 4px 0 0;">Days logged</th>
          </tr>
          ${foodRows}
        </table>
      </div>
    </div>

    <!-- Daily Log -->
    <div class="section">
      <div class="section-title">Daily Log</div>
      <table>
        <tr>
          <th style="text-align:left;">Date</th>
          <th>Wellness</th>
          <th>Pain</th>
          <th>Energy</th>
          <th>Mood</th>
          <th>Sleep</th>
          <th>Medications</th>
          <th style="text-align:left;">Notes</th>
        </tr>
        ${entryRows}
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-left">
        Generated by Symptom Journal App<br/>
        All data is self-reported by the patient
      </div>
      <div class="footer-right">
        ${sorted.length} entries · ${days} day window<br/>
        Scores are 0–10 scale
      </div>
    </div>

  </div>
</body>
</html>
  `;
}

// ─── Generate and share PDF ───────────────────────────────────────────────────

export async function generateAndSharePDF(
  entries: PDFEntry[],
  days: number = 30
): Promise<void> {
  const html = buildHTML(entries, days);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share your health report',
    UTI: 'com.adobe.pdf',
  });
}