import React, { useMemo, useState } from "react";

function parsePace(p) {
  if (typeof p === "number") return p;
  const s = (p || "").trim();
  if (!s) return NaN;
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  const m = s.match(/^(\d{1,2})\s*[:m]\s*(\d{1,2})$/i);
  if (m) {
    const min = parseInt(m[1], 10);
    const sec = parseInt(m[2], 10);
    return min * 60 + sec;
  }
  const parts = s.split(/[^\d]+/).filter(Boolean);
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const sec = parseInt(parts[1], 10);
    return min * 60 + sec;
  }
  return NaN;
}
function formatPace(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return "—";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")} /km`;
}

export default function App() {
  const [kph, setKph] = useState(10.0);
  const [paceStr, setPaceStr] = useState("6:00");
  const paceFromKph = useMemo(() => (kph > 0 ? (60 / kph) * 60 : NaN), [kph]);
  const kphFromPace = useMemo(() => {
    const s = parsePace(paceStr);
    return isFinite(s) && s > 0 ? 3600 / s : NaN;
  }, [paceStr]);

  const [basePace, setBasePace] = useState("6:00");
  const [percentages, setPercentages] = useState("80, 90, 100, 105, 110");

  function computeTargets() {
    const baseSec = parsePace(basePace);
    if (!isFinite(baseSec) || baseSec <= 0) return [];
    const baseSpeed = 1000 / baseSec;
    return percentages
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((p) => parseFloat(p))
      .filter((x) => isFinite(x) && x > 0)
      .map((pct) => {
        const spd = baseSpeed * (pct / 100);
        const paceSec = 1000 / spd;
        const kph = spd * 3.6;
        return { pct, paceSec, kph };
      });
  }

  const targets = useMemo(() => computeTargets(), [basePace, percentages]);

  return (
    <div className="w-full min-h-screen bg-white text-gray-900 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold brand-heading">Running Pace Tools</h1>
          <span className="hidden md:inline-flex px-3 py-1 rounded-full text-xs chip border border-[color:var(--brand-soft)]">Lioness Performance</span>
        </header>

        <div className="border rounded-2xl p-4 border-[color:var(--brand-soft)]">
          <h2 className="text-lg font-semibold mb-2">Treadmill speed ↔ pace</h2>
          <p className="text-sm text-gray-600 mb-3">Convert between <strong>km/h</strong> and <strong>min/km</strong>. Example: 12.0 km/h ≈ 5:00 /km.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Speed on treadmill (km/h)</label>
              <input type="number" step="0.1" min="0" value={kph} onChange={(e)=>setKph(parseFloat(e.target.value)||0)} className="w-full border rounded-2xl p-2 font-mono" />
              <div className="mt-2 text-sm">Pace = <span className="font-semibold">{formatPace(paceFromKph)}</span></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Desired pace (min:sec per km)</label>
              <input type="text" placeholder="e.g. 5:30" value={paceStr} onChange={(e)=>setPaceStr(e.target.value)} className="w-full border rounded-2xl p-2 font-mono" />
              <div className="mt-2 text-sm">Set treadmill to ≈ <span className="font-semibold">{isFinite(kphFromPace)? (Math.round(kphFromPace*10)/10).toFixed(1): "—"} km/h</span></div>
            </div>
          </div>
        </div>

        <div className="border rounded-2xl p-4 border-[color:var(--brand-soft)]">
          <h2 className="text-lg font-semibold mb-2">Intervals & tempo from your base pace</h2>
          <p className="text-sm text-gray-600 mb-3">
            Enter your usual <strong>long-run / easy pace</strong>. We’ll give targets at chosen % of <strong>speed</strong>.<br/>
            Note: 100% = base pace. <strong>&gt;100% = faster</strong>. <strong>&lt;100% = easier</strong>.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Base pace (min:sec per km)</label>
              <input type="text" placeholder="e.g. 6:00" value={basePace} onChange={(e)=>setBasePace(e.target.value)} className="w-full border rounded-2xl p-2 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">% of speed (comma separated)</label>
              <input type="text" value={percentages} onChange={(e)=>setPercentages(e.target.value)} className="w-full border rounded-2xl p-2 font-mono" />
              <p className="text-xs text-gray-600 mt-1">Example: 80, 90, 100, 105, 110</p>
            </div>
          </div>

          <div className="mt-4">
            {targets.length === 0 ? (
              <div className="text-sm text-gray-500">Enter a base pace to see targets.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded-2xl overflow-hidden">
                  <thead className="bg-[color:var(--brand-soft)] text-left">
                    <tr>
                      <th className="p-2">% of speed</th>
                      <th className="p-2">Pace (min/km)</th>
                      <th className="p-2">Treadmill (km/h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map(({ pct, paceSec, kph }) => (
                      <tr key={pct} className="border-t">
                        <td className="p-2 font-medium">{pct}%</td>
                        <td className="p-2">{formatPace(paceSec)}</td>
                        <td className="p-2">{isFinite(kph)? (Math.round(kph*10)/10).toFixed(1): "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
