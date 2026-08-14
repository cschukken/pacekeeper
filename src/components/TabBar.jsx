const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'log', label: 'Log' },
  { id: 'settings', label: 'Settings' },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav className="tab-bar">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
