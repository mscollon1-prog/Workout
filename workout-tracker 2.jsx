import { useState, useEffect } from "react";

const WORKOUTS = {
  upper: {
    label: "Upper Body",
    tag: "Shoulder Focus",
    tagColor: "#6484C9",
    icon: "💪",
    exercises: [
      { id: "ohp", name: "Overhead Press (Barbell)", muscle: "Shoulders" },
      { id: "lateral_raise", name: "Lateral Raises", muscle: "Shoulders" },
      { id: "face_pull", name: "Face Pulls", muscle: "Rear Delts" },
      { id: "bent_row", name: "Bent-Over Row", muscle: "Back" },
      { id: "tricep_pushdown", name: "Tricep Pushdown", muscle: "Triceps" },
    ],
  },
  lower: {
    label: "Lower Body",
    tag: "Legs & Glutes",
    tagColor: "#2CA58A",
    icon: "🦵",
    exercises: [
      { id: "squat", name: "Barbell Back Squat", muscle: "Quads" },
      { id: "rdl", name: "Romanian Deadlift", muscle: "Hamstrings" },
      { id: "hip_thrust", name: "Hip Thrust", muscle: "Glutes" },
      { id: "leg_curl", name: "Lying Leg Curl", muscle: "Hamstrings" },
      { id: "calf_raise", name: "Standing Calf Raise", muscle: "Calves" },
    ],
  },
  full: {
    label: "Full Body",
    tag: "Total Body",
    tagColor: "#D2785A",
    icon: "🏋️",
    exercises: [
      { id: "deadlift", name: "Conventional Deadlift", muscle: "Full Body" },
      { id: "db_ohp", name: "Dumbbell Shoulder Press", muscle: "Shoulders" },
      { id: "goblet_squat", name: "Goblet Squat", muscle: "Quads / Core" },
      { id: "cable_row", name: "Cable Row", muscle: "Back" },
    ],
  },
};

const SETS = [1, 2, 3, 4];
const REPS_OPTIONS = Array.from({ length: 7 }, (_, i) => 6 + i);

const storageKey = (workoutType, weekKey) => `workout_${workoutType}_${weekKey}`;

function getWeekKey(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function formatWeekLabel(weekKey) {
  const start = new Date(weekKey);
  const end = new Date(weekKey);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function WorkoutTracker() {
  const [activeWorkout, setActiveWorkout] = useState("upper");
  const [view, setView] = useState("log"); // 'log' | 'history'
  const [weekKey, setWeekKey] = useState(getWeekKey(new Date()));
  const [logData, setLogData] = useState({});
  const [saved, setSaved] = useState(false);
  const [historyKeys, setHistoryKeys] = useState([]);

  const workout = WORKOUTS[activeWorkout];

  // Load from storage on mount & when workout/week changes
  useEffect(() => {
    const load = async () => {
      try {
        const key = storageKey(activeWorkout, weekKey);
        const result = await window.storage.get(key);
        if (result) {
          setLogData(JSON.parse(result.value));
        } else {
          setLogData({});
        }
      } catch {
        setLogData({});
      }
    };
    load();
  }, [activeWorkout, weekKey]);

  // Load history keys
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await window.storage.list("workout_");
        if (result) {
          const weeks = [...new Set(result.keys.map(k => k.split("_").slice(-1)[0]))].sort().reverse();
          setHistoryKeys(weeks);
        }
      } catch {
        setHistoryKeys([]);
      }
    };
    loadHistory();
  }, [saved]);

  const updateSet = (exerciseId, setNum, field, value) => {
    setLogData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setNum]: {
          ...(prev[exerciseId]?.[setNum] || {}),
          [field]: value,
        },
      },
    }));
  };

  const saveLog = async () => {
    const key = storageKey(activeWorkout, weekKey);
    await window.storage.set(key, JSON.stringify({ ...logData, _savedAt: new Date().toISOString() }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const completedExercises = workout.exercises.filter(ex =>
    SETS.some(s => logData[ex.id]?.[s]?.weight && logData[ex.id]?.[s]?.reps)
  ).length;

  return (
    <div style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif", background: "#F5F7F6", minHeight: "100vh", color: "#1A1A1A" }}>
      {/* Header */}
      <div style={{ background: "#003F2D", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>Weekly Workout Tracker</div>
          <div style={{ color: "#80BBAD", fontSize: 12, marginTop: 2 }}>3×/week · 3–4 sets · 10–12 reps</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["log", "history"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              background: view === v ? "#fff" : "transparent",
              color: view === v ? "#003F2D" : "#80BBAD",
              border: view === v ? "none" : "1px solid #80BBAD",
              borderRadius: 4, padding: "6px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              {v === "log" ? "📋 Log" : "📅 History"}
            </button>
          ))}
        </div>
      </div>

      {view === "log" ? (
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
          {/* Week selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, background: "#fff", border: "1px solid #CCD9D5", borderRadius: 4, padding: "10px 16px" }}>
            <button onClick={() => { const d = new Date(weekKey); d.setDate(d.getDate() - 7); setWeekKey(getWeekKey(d)); }} style={{ background: "none", border: "1px solid #CCD9D5", borderRadius: 4, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>‹</button>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Week of {formatWeekLabel(weekKey)}</div>
            </div>
            <button onClick={() => { const d = new Date(weekKey); d.setDate(d.getDate() + 7); setWeekKey(getWeekKey(d)); }} style={{ background: "none", border: "1px solid #CCD9D5", borderRadius: 4, width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>›</button>
          </div>

          {/* Workout tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {Object.entries(WORKOUTS).map(([key, w]) => (
              <button key={key} onClick={() => setActiveWorkout(key)} style={{
                flex: 1, minWidth: 140,
                background: activeWorkout === key ? "#003F2D" : "#fff",
                color: activeWorkout === key ? "#fff" : "#1A1A1A",
                border: `1px solid ${activeWorkout === key ? "#003F2D" : "#CCD9D5"}`,
                borderRadius: 4, padding: "12px 16px", cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{w.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{w.label}</div>
                <div style={{ fontSize: 11, color: activeWorkout === key ? "#80BBAD" : "#767676", marginTop: 2 }}>{w.tag}</div>
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div style={{ background: "#fff", border: "1px solid #CCD9D5", borderRadius: 4, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#767676", marginBottom: 6 }}>Exercises logged: {completedExercises} / {workout.exercises.length}</div>
              <div style={{ background: "#CCD9D5", borderRadius: 4, height: 8, overflow: "hidden" }}>
                <div style={{ width: `${(completedExercises / workout.exercises.length) * 100}%`, height: "100%", background: "#2CA58A", borderRadius: 4, transition: "width 0.3s" }} />
              </div>
            </div>
            <button onClick={saveLog} style={{
              background: saved ? "#2CA58A" : "#003F2D", color: "#fff", border: "none",
              borderRadius: 4, padding: "8px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer",
              transition: "background 0.2s"
            }}>
              {saved ? "✓ Saved!" : "Save Log"}
            </button>
          </div>

          {/* Exercise log table */}
          {workout.exercises.map(ex => {
            const exData = logData[ex.id] || {};
            return (
              <div key={ex.id} style={{ background: "#fff", border: "1px solid #CCD9D5", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #CCD9D5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</span>
                    <span style={{ fontSize: 12, color: "#767676", marginLeft: 8, background: "#F5F7F6", padding: "2px 8px", borderRadius: 20, border: "1px solid #CCD9D5" }}>{ex.muscle}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#767676" }}>3–4 sets · 10–12 reps</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #CCD9D5" }}>
                      <th style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#1A1A1A", textAlign: "left", width: 60 }}>Set</th>
                      <th style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#1A1A1A", textAlign: "left" }}>Weight (lbs/kg)</th>
                      <th style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#1A1A1A", textAlign: "left" }}>Reps</th>
                      <th style={{ padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#1A1A1A", textAlign: "left" }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SETS.map(setNum => {
                      const row = exData[setNum] || {};
                      const isDone = row.weight && row.reps;
                      return (
                        <tr key={setNum} style={{ borderBottom: setNum < 4 ? "1px solid #CCD9D5" : "none", background: isDone ? "#F0FAF7" : "#fff" }}>
                          <td style={{ padding: "8px 16px", fontSize: 14, fontWeight: 600, color: isDone ? "#2CA58A" : "#767676" }}>
                            {isDone ? "✓" : ""} {setNum}
                          </td>
                          <td style={{ padding: "6px 16px" }}>
                            <input
                              type="number"
                              placeholder="0"
                              value={row.weight || ""}
                              onChange={e => updateSet(ex.id, setNum, "weight", e.target.value)}
                              style={{ width: 80, height: 32, border: "1px solid #CCD9D5", borderRadius: 4, padding: "0 8px", fontSize: 14, outline: "none", color: "#1A1A1A" }}
                            />
                          </td>
                          <td style={{ padding: "6px 16px" }}>
                            <select
                              value={row.reps || ""}
                              onChange={e => updateSet(ex.id, setNum, "reps", e.target.value)}
                              style={{ width: 70, height: 32, border: "1px solid #CCD9D5", borderRadius: 4, padding: "0 6px", fontSize: 14, color: "#1A1A1A", background: "#fff" }}
                            >
                              <option value="">–</option>
                              {REPS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: "6px 16px" }}>
                            <input
                              type="text"
                              placeholder="optional note"
                              value={row.note || ""}
                              onChange={e => updateSet(ex.id, setNum, "note", e.target.value)}
                              style={{ width: "100%", minWidth: 100, maxWidth: 180, height: 32, border: "1px solid #CCD9D5", borderRadius: 4, padding: "0 8px", fontSize: 13, color: "#1A1A1A" }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}

          <div style={{ textAlign: "right", marginTop: 8 }}>
            <button onClick={saveLog} style={{
              background: saved ? "#2CA58A" : "#003F2D", color: "#fff", border: "none",
              borderRadius: 4, padding: "10px 28px", fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>
              {saved ? "✓ Saved!" : "Save Workout Log"}
            </button>
          </div>
        </div>
      ) : (
        /* History view */
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Workout History</div>
          {historyKeys.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #CCD9D5", borderRadius: 4, padding: 32, textAlign: "center", color: "#767676" }}>No saved workouts yet. Log and save a workout to see history here.</div>
          ) : (
            historyKeys.map(wk => (
              <HistoryWeek key={wk} weekKey={wk} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function HistoryWeek({ weekKey }) {
  const [entries, setEntries] = useState({});

  useEffect(() => {
    const load = async () => {
      const found = {};
      for (const type of Object.keys(WORKOUTS)) {
        try {
          const result = await window.storage.get(storageKey(type, weekKey));
          if (result) found[type] = JSON.parse(result.value);
        } catch { /* */ }
      }
      setEntries(found);
    };
    load();
  }, [weekKey]);

  const types = Object.keys(entries).filter(k => k !== "_savedAt");
  if (types.length === 0) return null;

  return (
    <div style={{ background: "#fff", border: "1px solid #CCD9D5", borderRadius: 4, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ background: "#F5F7F6", padding: "10px 16px", borderBottom: "1px solid #CCD9D5", fontWeight: 600, fontSize: 14 }}>
        📅 {formatWeekLabel(weekKey)}
      </div>
      <div style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
        {types.map(type => {
          const w = WORKOUTS[type];
          const data = entries[type];
          const done = w.exercises.filter(ex => SETS.some(s => data[ex.id]?.[s]?.weight)).length;
          return (
            <div key={type} style={{ flex: 1, minWidth: 180, border: "1px solid #CCD9D5", borderRadius: 4, padding: "10px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{w.icon} {w.label}</div>
              <div style={{ fontSize: 12, color: "#767676" }}>{done}/{w.exercises.length} exercises logged</div>
              <div style={{ background: "#CCD9D5", borderRadius: 4, height: 6, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: `${(done / w.exercises.length) * 100}%`, height: "100%", background: "#2CA58A", borderRadius: 4 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
