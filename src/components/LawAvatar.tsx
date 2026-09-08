import { useJurisdiction } from '../hooks/useJurisdiction';
import './LawAvatar.css';

/**
 * Scales-of-justice mascot: a cheerful little golden pillar with big blinky
 * eyes, white gloves (one holding a scroll of the law), balancing beam and
 * hanging pans — plus stompy shoes.
 *  - speaking → mouth chomps + excited bounce
 *  - thinking → beam tips side to side, weighing it up + pupils dart
 */
export default function LawAvatar({ speaking = false, thinking = false, size = 40 }: { speaking?: boolean; thinking?: boolean; size?: number }) {
  const { active } = useJurisdiction();
  return (
    <div
      className={`law-avatar ${speaking ? 'law-avatar--speaking' : ''} ${thinking ? 'law-avatar--thinking' : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="LegalCore mascot"
    >
      <svg viewBox="0 0 120 130" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id="law-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8A5A00" />
            <stop offset="35%" stopColor="#F3C94E" />
            <stop offset="65%" stopColor="#E8B93C" />
            <stop offset="100%" stopColor="#8A5A00" />
          </linearGradient>
          <linearGradient id="law-pan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7DC8B" />
            <stop offset="100%" stopColor="#D9A62E" />
          </linearGradient>
        </defs>

        {/* legs + shoes */}
        <g stroke="#2A2A2A" strokeWidth="3.5" strokeLinecap="round">
          <line x1="52" y1="114" x2="50" y2="122" />
          <line x1="68" y1="114" x2="70" y2="122" />
        </g>
        <ellipse cx="47" cy="124" rx="7.5" ry="4" fill="#2A2A2A" />
        <ellipse cx="73" cy="124" rx="7.5" ry="4" fill="#2A2A2A" />

        {/* plinth + base */}
        <rect x="38" y="108" width="44" height="7" rx="3" fill="url(#law-gold)" stroke="#5B3D00" strokeWidth="2" />
        <rect x="43" y="99" width="34" height="10" rx="3" fill="url(#law-gold)" stroke="#5B3D00" strokeWidth="2" />

        {/* pillar body */}
        <rect x="48" y="44" width="24" height="57" rx="9" fill="url(#law-gold)" stroke="#5B3D00" strokeWidth="2.5" />
        <line x1="55" y1="50" x2="55" y2="95" stroke="#8A5A00" strokeWidth="1.6" opacity="0.7" />
        <line x1="65" y1="50" x2="65" y2="95" stroke="#8A5A00" strokeWidth="1.6" opacity="0.7" />
        {/* capital */}
        <rect x="43" y="37" width="34" height="8" rx="3.5" fill="url(#law-gold)" stroke="#5B3D00" strokeWidth="2" />

        {/* balancing beam + pans (tips while thinking) */}
        <g className="law-beam">
          <circle cx="60" cy="28" r="3.4" fill="#D4AF17" stroke="#5B3D00" strokeWidth="1.6" />
          <line x1="60" y1="31" x2="60" y2="35" stroke="#5B3D00" strokeWidth="2.4" />
          <rect x="18" y="32" width="84" height="5.5" rx="2.75" fill="url(#law-gold)" stroke="#5B3D00" strokeWidth="1.8" />
          {/* left pan */}
          <line x1="28" y1="37" x2="22" y2="58" stroke="#5B3D00" strokeWidth="1.8" />
          <line x1="28" y1="37" x2="34" y2="58" stroke="#5B3D00" strokeWidth="1.8" />
          <path d="M14,58 A16,11 0 0 0 42,58 Z" fill="url(#law-pan)" stroke="#5B3D00" strokeWidth="1.8" />
          {/* right pan */}
          <line x1="92" y1="37" x2="86" y2="58" stroke="#5B3D00" strokeWidth="1.8" />
          <line x1="92" y1="37" x2="98" y2="58" stroke="#5B3D00" strokeWidth="1.8" />
          <path d="M78,58 A16,11 0 0 0 106,58 Z" fill="url(#law-pan)" stroke="#5B3D00" strokeWidth="1.8" />
        </g>

        {/* left arm + glove */}
        <path d="M48,68 Q40,72 38,82" fill="none" stroke="#2A2A2A" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="38" cy="85" r="6.4" fill="#FFFDF6" stroke="#2A2A2A" strokeWidth="1.8" />
        <line x1="35" y1="83" x2="41" y2="83" stroke="#2A2A2A" strokeWidth="1.3" strokeLinecap="round" />

        {/* right arm holding a scroll of the law */}
        <path d="M72,68 Q80,72 82,80" fill="none" stroke="#2A2A2A" strokeWidth="3.2" strokeLinecap="round" />
        <g transform="rotate(18 86 72)">
          <rect x="79" y="66" width="15" height="11" rx="5.5" fill="#FFFDF6" stroke="#2A2A2A" strokeWidth="1.8" />
          <line x1="83" y1="70" x2="90" y2="70" stroke="#BF0A30" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="83" y1="73.5" x2="90" y2="73.5" stroke="#002868" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <circle cx="82" cy="83" r="6.4" fill="#FFFDF6" stroke="#2A2A2A" strokeWidth="1.8" />

        {/* eyes (blink) */}
        <g className="law-eyes">
          <ellipse cx="54" cy="62" rx="5.6" ry="7" fill="#fff" stroke="#3A2A00" strokeWidth="1.4" />
          <ellipse cx="66" cy="62" rx="5.6" ry="7" fill="#fff" stroke="#3A2A00" strokeWidth="1.4" />
          <g className="law-pupils">
            <circle cx="54.8" cy="63.5" r="2.5" fill="#1E1E1E" />
            <circle cx="66.8" cy="63.5" r="2.5" fill="#1E1E1E" />
            <circle cx="55.7" cy="62.6" r="0.9" fill="#fff" />
            <circle cx="67.7" cy="62.6" r="0.9" fill="#fff" />
          </g>
        </g>

        {/* blush */}
        <ellipse cx="49" cy="73" rx="3.2" ry="2.2" fill="#B25E09" opacity="0.4" />
        <ellipse cx="71" cy="73" rx="3.2" ry="2.2" fill="#B25E09" opacity="0.4" />

        {/* smile → swaps for chomping mouth when speaking */}
        <path className="law-smile" d="M53,78 Q60,84.5 67,78" fill="none" stroke="#3A2A00" strokeWidth="2.4" strokeLinecap="round" />
        <g className="law-mouth-open">
          <ellipse cx="60" cy="80.5" rx="4.6" ry="5.4" fill="#3A2A00" />
          <ellipse cx="60" cy="82.8" rx="2.4" ry="2" fill="#E87A7A" />
        </g>
      </svg>
      <img src={`https://flagcdn.com/w20/${active.flag}.png`} alt={active.name} className="law-avatar__flag" />
      <span className="law-avatar__dot" />
    </div>
  );
}
