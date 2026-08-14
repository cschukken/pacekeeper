import { useState, useEffect, useRef, useCallback } from 'react';
import TabBar from './components/TabBar';
import GaugeArc from './components/GaugeArc';
import StatCard from './components/StatCard';
import DrinkButton from './components/DrinkButton';
import DrinkLog from './components/DrinkLog';
import { calculateBAC, getZone, formatBAC, hoursUntilNextDrink, hoursUntilSober } from './utils/bac';
import { formatDuration, formatSessionDuration, formatHHMM } from './utils/time';
import { loadSettings, saveSettings, loadSession, saveSession, clearSession } from './utils/storage';
import { DRINK_PRESETS } from './constants/drinks';

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [settings, setSettings] = useState(loadSettings);
  const [session, setSession] = useState(loadSession);
  const [bac, setBac] = useState(0);
  const [now, setNow] = useState(Date.now());
  const prevZoneLevelRef = useRef(0);
  const wakeLockRef = useRef(null);

  // Persist settings
  useEffect(() => { saveSettings(settings); }, [settings]);

  // Persist session
  useEffect(() => { saveSession(session); }, [session]);

  // Refresh BAC every 15 seconds
  useEffect(() => {
    const tick = () => {
      const newBac = calculateBAC(session.drinks, session.mealTime);
      setBac(newBac);
      setNow(Date.now());

      // Vibrate on zone worsening
      const zone = getZone(newBac, settings.bacLimit);
      if (zone.level > prevZoneLevelRef.current) {
        navigator.vibrate?.([150, 50, 150]);
      }
      prevZoneLevelRef.current = zone.level;
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [session.drinks, session.mealTime, settings.bacLimit]);

  // Wake Lock
  useEffect(() => {
    const acquire = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock?.request('screen');
      } catch { /* not supported or denied */ }
    };
    acquire();
    const onVisChange = () => {
      if (document.visibilityState === 'visible') acquire();
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisChange);
      wakeLockRef.current?.release();
    };
  }, []);

  const addDrink = useCallback((name, units) => {
    setSession(prev => ({
      ...prev,
      drinks: [...prev.drinks, { id: crypto.randomUUID(), name, units, timestamp: Date.now() }],
    }));
  }, []);

  const deleteDrink = useCallback((id) => {
    setSession(prev => ({
      ...prev,
      drinks: prev.drinks.filter(d => d.id !== id),
    }));
  }, []);

  const addWater = useCallback(() => {
    setSession(prev => ({ ...prev, waterCount: prev.waterCount + 1 }));
  }, []);

  const logMeal = useCallback(() => {
    setSession(prev => ({ ...prev, mealTime: Date.now() }));
  }, []);

  const clearMeal = useCallback(() => {
    setSession(prev => ({ ...prev, mealTime: null }));
  }, []);

  const resetSession = useCallback(() => {
    clearSession();
    setSession({ drinks: [], waterCount: 0, mealTime: null });
    prevZoneLevelRef.current = 0;
  }, []);

  const setLimit = useCallback((limit) => {
    setSettings(prev => ({ ...prev, bacLimit: limit }));
  }, []);

  const zone = getZone(bac, settings.bacLimit);
  const totalUnits = session.drinks.reduce((s, d) => s + d.units, 0);
  const nextDrinkHours = hoursUntilNextDrink(bac, settings.bacLimit);
  const soberHours = hoursUntilSober(bac);
  const firstDrink = session.drinks.length
    ? Math.min(...session.drinks.map(d => d.timestamp))
    : null;

  const nextDrinkDisplay = nextDrinkHours <= 0
    ? 'Now'
    : formatHHMM(now + nextDrinkHours * 3_600_000);

  const exportLog = () => {
    if (!session.drinks.length) return;
    const sorted = [...session.drinks].sort((a, b) => a.timestamp - b.timestamp);
    const lines = sorted.map(d => `${formatHHMM(d.timestamp)}  ${d.name}  ${d.units}u`);
    const text = `Pacekeeper Log\n${new Date().toLocaleDateString()}\n\n${lines.join('\n')}\n\nTotal: ${Math.round(totalUnits * 10) / 10} units | BAC: ${formatBAC(bac)}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="app">
      <div className="container">
        {tab === 'dashboard' && (
          <div className="dashboard">
            <GaugeArc bac={bac} color={zone.color} />
            <div className="bac-display" style={{ color: zone.color }}>
              {formatBAC(bac)}
            </div>
            <div className="zone-label" style={{ color: zone.color }}>
              {zone.label}
            </div>

            <div className="stat-row">
              <StatCard label="Total units" value={Math.round(totalUnits * 10) / 10} />
              <StatCard label="Next drink" value={nextDrinkDisplay} />
              <StatCard label="Sober in" value={soberHours > 0 ? formatDuration(soberHours) : '—'} />
            </div>

            <div className="card-row">
              <div className="water-card">
                <div className="water-info">
                  <span className="water-icon">💧</span>
                  <span className="water-count">{session.waterCount}</span>
                </div>
                <button className="water-btn" onClick={addWater}>+ Water</button>
              </div>
              <div className={`meal-card${session.mealTime ? ' logged' : ''}`}>
                {session.mealTime ? (
                  <>
                    <div className="meal-info">
                      <span className="meal-label">Meal at {formatHHMM(session.mealTime)}</span>
                      <span className="meal-subtitle">−35% nearby drinks</span>
                    </div>
                    <button className="meal-undo" onClick={clearMeal}>×</button>
                  </>
                ) : (
                  <button className="meal-btn" onClick={logMeal}>Had a big meal</button>
                )}
              </div>
            </div>

            {firstDrink && (
              <div className="session-timer">
                Session: {formatSessionDuration(firstDrink)}
              </div>
            )}
          </div>
        )}

        {tab === 'log' && (
          <LogTab
            drinks={session.drinks}
            onAdd={addDrink}
            onDelete={deleteDrink}
            onClear={resetSession}
          />
        )}

        {tab === 'settings' && (
          <SettingsTab
            limit={settings.bacLimit}
            onSetLimit={setLimit}
            onReset={resetSession}
            onExport={exportLog}
            hasDrinks={session.drinks.length > 0}
          />
        )}
      </div>

      <TabBar active={tab} onChange={setTab} />
    </div>
  );
}

function LogTab({ drinks, onAdd, onDelete, onClear }) {
  const [customName, setCustomName] = useState('');
  const [customUnits, setCustomUnits] = useState('');

  const handleCustomAdd = () => {
    const units = parseFloat(customUnits);
    if (!customName.trim() || isNaN(units) || units < 0.1 || units > 5.0) return;
    onAdd(customName.trim(), Math.round(units * 10) / 10);
    setCustomName('');
    setCustomUnits('');
  };

  return (
    <div className="log-tab">
      <div className="preset-grid">
        {DRINK_PRESETS.map(p => (
          <DrinkButton key={p.name} name={p.name} units={p.units} onAdd={onAdd} />
        ))}
      </div>

      <div className="custom-drink">
        <input
          type="text"
          placeholder="Custom drink"
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          className="custom-input"
        />
        <input
          type="number"
          placeholder="Units"
          min="0.1"
          max="5.0"
          step="0.1"
          value={customUnits}
          onChange={e => setCustomUnits(e.target.value)}
          className="custom-input units-input"
        />
        <button className="add-btn" onClick={handleCustomAdd}>Add</button>
      </div>

      <DrinkLog drinks={drinks} onDelete={onDelete} />

      {drinks.length > 0 && (
        <button className="clear-session-btn" onClick={onClear}>Clear session</button>
      )}
    </div>
  );
}

function SettingsTab({ limit, onSetLimit, onReset, onExport, hasDrinks }) {
  const [copied, setCopied] = useState(false);
  const limits = [
    { value: 0.06, label: '0.06%', desc: 'Cautious' },
    { value: 0.08, label: '0.08%', desc: 'Standard' },
    { value: 0.10, label: '0.10%', desc: 'Relaxed' },
  ];

  const handleExport = () => {
    onExport();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="settings-tab">
      <div className="setting-section">
        <h3>BAC limit</h3>
        <div className="limit-buttons">
          {limits.map(l => (
            <button
              key={l.value}
              className={`limit-btn${limit === l.value ? ' selected' : ''}`}
              onClick={() => onSetLimit(l.value)}
            >
              <span>{l.label}</span>
              <span className="limit-desc">{l.desc}</span>
            </button>
          ))}
        </div>
        <p className="setting-hint">Affects "next drink" timing and zone warnings</p>
      </div>

      <div className="setting-section">
        <h3>Profile</h3>
        <p className="profile-info">75 kg · Male · r = 0.68 · −0.015%/hr</p>
      </div>

      <div className="setting-section">
        <button className="export-btn" onClick={handleExport} disabled={!hasDrinks}>
          {copied ? 'Copied to clipboard!' : 'Export drink log'}
        </button>
      </div>

      <div className="setting-section">
        <button className="reset-btn" onClick={onReset}>Reset session</button>
      </div>
    </div>
  );
}
