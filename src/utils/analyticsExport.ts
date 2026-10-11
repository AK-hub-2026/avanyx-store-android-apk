import { DeveloperRealtimeAnalyticsData } from '../components/developer/developerTypes';

/**
 * Exports real Firestore developer analytics dataset to a downloadable CSV file.
 */
export function exportAnalyticsToCSV(
  data: DeveloperRealtimeAnalyticsData,
  appName: string,
  scope: string
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const fileName = `AVANYX_Analytics_${appName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.csv`;

  const rows: string[][] = [];

  // Header / Metadata
  rows.push(['AVANYX STORE DEVELOPER CONSOLE - REALTIME ANALYTICS REPORT']);
  rows.push(['Generated At', new Date().toLocaleString()]);
  rows.push(['Application Scope', appName]);
  rows.push(['Scope Filter', scope]);
  rows.push([]);

  // Section 1: Executive KPI Metrics
  rows.push(['--- EXECUTIVE KPI SUMMARY ---']);
  rows.push(['Metric', 'Value', 'Context']);
  rows.push(['Total Downloads', String(data.downloads.totalDownloads), 'Live verified installs']);
  rows.push(['Growth Rate (%)', `${data.downloads.growthRate}%`, 'Period-over-period']);
  rows.push(['Total Page Views', String(data.views.totalViews), 'Store listing views']);
  rows.push(['Unique Visitors', String(data.views.uniqueVisitors), 'Unique client sessions']);
  rows.push(['Repeat Visitors', String(data.views.repeatVisitors), 'Returning store visitors']);
  rows.push(['Conversion CTR (%)', `${data.views.ctr}%`, 'View to Download ratio']);
  rows.push(['Average Rating', `${data.ratings.averageRating} / 5.0`, 'User review score']);
  rows.push(['Total Reviews Count', String(data.reviews.totalReviews), 'Feedback submissions']);
  rows.push(['Positive Sentiment (%)', `${data.reviews.positivePercent}%`, '4★ and 5★ ratings']);
  rows.push(['Developer Replied Reviews', String(data.reviews.repliedCount), 'Addressed inquiries']);
  rows.push(['Pending Reply Reviews', String(data.reviews.pendingReplyCount), 'Awaiting response']);
  rows.push([]);

  // Section 2: Daily Acquisition & Views Time Series
  rows.push(['--- DAILY TIME SERIES (PAST 14 DAYS) ---']);
  rows.push(['Date', 'Label', 'Downloads', 'Direct APK Installs', 'Store Discovery Installs', 'Page Views', 'Unique Visitors']);
  data.downloads.daily.forEach((d) => {
    const vMatch = data.views.dailyViews.find((v) => v.date === d.fullDate);
    rows.push([
      d.fullDate,
      d.label,
      String(d.downloads),
      String(d.direct),
      String(d.store),
      String(vMatch?.views ?? 0),
      String(vMatch?.uniqueVisitors ?? 0)
    ]);
  });
  rows.push([]);

  // Section 3: Geographic Distribution
  rows.push(['--- GEOGRAPHIC DISTRIBUTION (REAL DOWNLOADS) ---']);
  rows.push(['Country Code', 'Country Name', 'Download Count', 'Share Percentage (%)']);
  if (data.countries.list.length === 0) {
    rows.push(['N/A', 'No geographic downloads recorded yet', '0', '0%']);
  } else {
    data.countries.list.forEach((c) => {
      rows.push([c.code, c.name, String(c.count), `${c.share}%`]);
    });
  }
  rows.push([]);

  // Section 4: Hardware & OS Telemetry
  rows.push(['--- DEVICE OEM HARDWARE TELEMETRY ---']);
  rows.push(['Manufacturer / Brand', 'Installs', 'Share (%)']);
  if (data.devices.brands.length === 0) {
    rows.push(['No device telemetry recorded', '0', '0%']);
  } else {
    data.devices.brands.forEach((b) => {
      rows.push([b.name, String(b.count), `${b.share}%`]);
    });
  }
  rows.push([]);

  rows.push(['--- ANDROID OS VERSION DISTRIBUTION ---']);
  rows.push(['Android OS Version', 'Installs', 'Share (%)']);
  if (data.devices.androidVersions.length === 0) {
    rows.push(['No OS version telemetry recorded', '0', '0%']);
  } else {
    data.devices.androidVersions.forEach((os) => {
      rows.push([os.name, String(os.count), `${os.share}%`]);
    });
  }
  rows.push([]);

  // Section 5: Rating Distribution
  rows.push(['--- USER RATINGS DISTRIBUTION ---']);
  rows.push(['Star Rating', 'Review Count', 'Distribution (%)']);
  [5, 4, 3, 2, 1].forEach((star) => {
    const s = star as 1 | 2 | 3 | 4 | 5;
    rows.push([
      `${star} Stars`,
      String(data.ratings.distribution[s] || 0),
      `${data.ratings.distributionPercentages[s] || 0}%`
    ]);
  });
  rows.push([]);

  // Section 6: App Leaderboard (if ALL scope)
  if (data.appRankings && data.appRankings.length > 0) {
    rows.push(['--- APPLICATION RANKINGS ---']);
    rows.push(['Rank', 'Application Name', 'Package Name', 'Category', 'Downloads', 'Views', 'Rating', 'Conversion CTR (%)']);
    data.appRankings.forEach((app, idx) => {
      rows.push([
        String(idx + 1),
        app.appName,
        app.packageName,
        app.category,
        String(app.downloads),
        String(app.views),
        String(app.rating),
        `${app.ctr}%`
      ]);
    });
  }

  // Convert to CSV String
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports real Firestore developer analytics report into a formatted, high-contrast printable PDF window.
 */
export function exportAnalyticsToPDF(
  data: DeveloperRealtimeAnalyticsData,
  appName: string,
  scope: string
): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate and download the AVANYX PDF Analytics Report.');
    return;
  }

  const generatedDate = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AVANYX Store Developer Analytics Report - ${appName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #FFFFFF;
      color: #0F172A;
      padding: 40px;
      line-height: 1.5;
      font-size: 13px;
    }

    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none !important;
      }
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 24px;
      margin-bottom: 28px;
    }

    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: #7E22CE;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge-live {
      display: inline-block;
      background: #ECFDF5;
      color: #059669;
      border: 1px solid #A7F3D0;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .report-meta {
      text-align: right;
      font-size: 11px;
      color: #64748B;
    }

    .report-meta strong {
      color: #0F172A;
    }

    .scope-banner {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .scope-banner h2 {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
    }

    .scope-banner p {
      font-size: 12px;
      color: #64748B;
    }

    .grid-kpi {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }

    .kpi-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }

    .kpi-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .kpi-value {
      font-size: 24px;
      font-weight: 900;
      color: #0F172A;
    }

    .kpi-sub {
      font-size: 11px;
      font-weight: 600;
      margin-top: 4px;
      color: #059669;
    }

    .section-heading {
      font-size: 14px;
      font-weight: 800;
      color: #0F172A;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-left: 3px solid #7E22CE;
      padding-left: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }

    th {
      background: #F1F5F9;
      color: #475569;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #CBD5E1;
      font-size: 11px;
      text-transform: uppercase;
    }

    td {
      padding: 9px 12px;
      border-bottom: 1px solid #E2E8F0;
      color: #334155;
    }

    tr:nth-child(even) td {
      background: #F8FAFC;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    .progress-bar-bg {
      background: #E2E8F0;
      height: 8px;
      border-radius: 9999px;
      overflow: hidden;
      margin-top: 4px;
    }

    .progress-bar-fill {
      background: #7E22CE;
      height: 100%;
      border-radius: 9999px;
    }

    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 16px;
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94A3B8;
    }

    .btn-print {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #7E22CE;
      color: white;
      border: none;
      padding: 12px 24px;
      font-weight: 800;
      font-size: 13px;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(126, 34, 206, 0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-print:hover {
      background: #6B21A8;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">
    🖨️ Print / Save as PDF
  </button>

  <div class="header-bar">
    <div>
      <div class="brand-title">
        <span>AVANYX</span>
        <span style="color: #0F172A; font-weight: 800;">Developer Console</span>
        <span class="badge-live">Live Verified</span>
      </div>
      <p style="color: #64748B; font-size: 12px; margin-top: 4px;">
        Production Store Telemetry & Acquisition Intelligence Report
      </p>
    </div>

    <div class="report-meta">
      <div>Report ID: <strong>AVX-RPT-${Math.floor(100000 + Math.random() * 900000)}</strong></div>
      <div>Generated: <strong>${generatedDate}</strong></div>
      <div>Source: <strong>Firestore Live Telemetry</strong></div>
    </div>
  </div>

  <div class="scope-banner">
    <div>
      <h2>Target Scope: ${appName}</h2>
      <p>Filter: ${scope === 'ALL' ? 'All Applications Combined' : 'Specific Application Scope'}</p>
    </div>
    <div style="text-align: right;">
      <span style="font-size: 11px; font-weight: 700; color: #7E22CE; background: #F3E8FF; padding: 4px 10px; border-radius: 8px;">
        AVANYX Store v2.4.1 Production
      </span>
    </div>
  </div>

  <div class="grid-kpi">
    <div class="kpi-card">
      <div class="kpi-title">Total Installs</div>
      <div class="kpi-value">${data.downloads.totalDownloads.toLocaleString()}</div>
      <div class="kpi-sub">${data.downloads.growthRate >= 0 ? '+' : ''}${data.downloads.growthRate}% vs prev period</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-title">Store Views</div>
      <div class="kpi-value">${data.views.totalViews.toLocaleString()}</div>
      <div class="kpi-sub" style="color: #0284C7;">${data.views.uniqueVisitors.toLocaleString()} unique visitors</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-title">Average Rating</div>
      <div class="kpi-value">${data.ratings.averageRating.toFixed(1)} ★</div>
      <div class="kpi-sub" style="color: #D97706;">${data.reviews.totalReviews} user reviews</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-title">Conversion Rate</div>
      <div class="kpi-value">${data.views.ctr}%</div>
      <div class="kpi-sub" style="color: #7E22CE;">View to Install CTR</div>
    </div>
  </div>

  <div class="section-heading">Daily Telemetry Progression (Past 14 Days)</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Period</th>
        <th>Total Downloads</th>
        <th>Direct APK</th>
        <th>Store Discovery</th>
        <th>Page Views</th>
      </tr>
    </thead>
    <tbody>
      ${data.downloads.daily
        .map((d) => {
          const v = data.views.dailyViews.find((vMatch) => vMatch.date === d.fullDate);
          return `
            <tr>
              <td style="font-family: monospace; font-weight: 600;">${d.fullDate}</td>
              <td>${d.label}</td>
              <td><strong>${d.downloads}</strong></td>
              <td>${d.direct}</td>
              <td>${d.store}</td>
              <td>${v?.views ?? 0}</td>
            </tr>
          `;
        })
        .join('')}
    </tbody>
  </table>

  <div class="two-col">
    <div>
      <div class="section-heading">Geographic Download Distribution</div>
      <table>
        <thead>
          <tr>
            <th>Region</th>
            <th>Downloads</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.countries.list.length === 0
              ? `<tr><td colspan="3" style="text-align: center; color: #94A3B8;">No geographic downloads recorded yet</td></tr>`
              : data.countries.list
                  .slice(0, 6)
                  .map(
                    (c) => `
                    <tr>
                      <td>${c.flag} <strong>${c.name}</strong> (${c.code})</td>
                      <td>${c.count}</td>
                      <td>
                        <strong>${c.share}%</strong>
                        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${c.share}%;"></div></div>
                      </td>
                    </tr>
                  `
                  )
                  .join('')
          }
        </tbody>
      </table>
    </div>

    <div>
      <div class="section-heading">Device OEM & Hardware Distribution</div>
      <table>
        <thead>
          <tr>
            <th>Brand / Manufacturer</th>
            <th>Installs</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.devices.brands.length === 0
              ? `<tr><td colspan="3" style="text-align: center; color: #94A3B8;">No device hardware telemetry recorded yet</td></tr>`
              : data.devices.brands
                  .slice(0, 6)
                  .map(
                    (b) => `
                    <tr>
                      <td><strong>${b.name}</strong></td>
                      <td>${b.count}</td>
                      <td>
                        <strong>${b.share}%</strong>
                        <div class="progress-bar-bg"><div class="progress-bar-fill" style="background: #0284C7; width: ${b.share}%;"></div></div>
                      </td>
                    </tr>
                  `
                  )
                  .join('')
          }
        </tbody>
      </table>
    </div>
  </div>

  <div class="two-col">
    <div>
      <div class="section-heading">Android OS Version Adoption</div>
      <table>
        <thead>
          <tr>
            <th>Android Version</th>
            <th>Installs</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.devices.androidVersions.length === 0
              ? `<tr><td colspan="3" style="text-align: center; color: #94A3B8;">No Android version telemetry recorded yet</td></tr>`
              : data.devices.androidVersions
                  .slice(0, 5)
                  .map(
                    (v) => `
                    <tr>
                      <td><strong>${v.name}</strong></td>
                      <td>${v.count}</td>
                      <td>
                        <strong>${v.share}%</strong>
                        <div class="progress-bar-bg"><div class="progress-bar-fill" style="background: #059669; width: ${v.share}%;"></div></div>
                      </td>
                    </tr>
                  `
                  )
                  .join('')
          }
        </tbody>
      </table>
    </div>

    <div>
      <div class="section-heading">User Rating Breakdown (5★ to 1★)</div>
      <table>
        <thead>
          <tr>
            <th>Rating</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          ${[5, 4, 3, 2, 1]
            .map((star) => {
              const s = star as 1 | 2 | 3 | 4 | 5;
              const count = data.ratings.distribution[s] || 0;
              const pct = data.ratings.distributionPercentages[s] || 0;
              return `
                <tr>
                  <td><strong>${star} Stars ★</strong></td>
                  <td>${count}</td>
                  <td>
                    <strong>${pct}%</strong>
                    <div class="progress-bar-bg"><div class="progress-bar-fill" style="background: #F59E0B; width: ${pct}%;"></div></div>
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    <div>
      <strong>AVANYX Store Developer Console</strong> &bull; Confidential Developer Analytics &bull; Verified Production Telemetry
    </div>
    <div>
      Page 1 of 1 &bull; https://avanyx.store
    </div>
  </div>

  <script>
    // Auto trigger print dialog on load if desired
    window.addEventListener('load', () => {
      // document.title = 'AVANYX_Report_${appName}';
    });
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
