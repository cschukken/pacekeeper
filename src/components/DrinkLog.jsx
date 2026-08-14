import { formatHHMM } from '../utils/time';

export default function DrinkLog({ drinks, onDelete }) {
  if (!drinks.length) {
    return <p className="empty-log">No drinks logged yet</p>;
  }

  // Newest first
  const sorted = [...drinks].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="drink-log">
      {sorted.map(drink => (
        <div key={drink.id} className="log-entry">
          <span className="log-name">{drink.name}</span>
          <span className="log-units">{drink.units}u</span>
          <span className="log-time">{formatHHMM(drink.timestamp)}</span>
          <button className="log-delete" onClick={() => onDelete(drink.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
