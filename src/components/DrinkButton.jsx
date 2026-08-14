export default function DrinkButton({ name, units, onAdd }) {
  return (
    <button className="drink-button" onClick={() => onAdd(name, units)}>
      <span className="drink-name">{name}</span>
      <span className="drink-units">{units} u</span>
    </button>
  );
}
