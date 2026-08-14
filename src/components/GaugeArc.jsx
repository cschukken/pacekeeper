const ARC_LENGTH = 231; // total arc path length
const MAX_BAC = 0.15;  // gauge max

export default function GaugeArc({ bac, color }) {
  // Map BAC 0–0.15 to dashoffset 231–0
  const clamped = Math.min(bac, MAX_BAC);
  const offset = ARC_LENGTH - (clamped / MAX_BAC) * ARC_LENGTH;

  return (
    <svg viewBox="0 0 280 175" style={{ width: '100%', maxWidth: 280 }}>
      {/* Background arc */}
      <path
        d="M 45 105 A 110 110 0 0 1 235 105"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* Fill arc */}
      <path
        d="M 45 105 A 110 110 0 0 1 235 105"
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={`${ARC_LENGTH} 1000`}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
      />
      {/* Labels */}
      <text x="40" y="135" fill="#777" fontSize="11" textAnchor="middle">0%</text>
      <text x="240" y="135" fill="#777" fontSize="11" textAnchor="middle">0.15%</text>
    </svg>
  );
}
