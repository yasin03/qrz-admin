// Özel günler kartı için renkli illüstrasyon ikonları (inline SVG, harici varlık yok).
// Renkler sabit; açık ve koyu temada aynı okunur.

type Props = { className?: string };

/** İki katlı, mumlu doğum günü pastası */
export function PastaIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Alevler */}
      <ellipse cx="22" cy="9" rx="2.6" ry="4" fill="#f59e0b" />
      <ellipse cx="22" cy="10" rx="1.2" ry="2" fill="#fde047" />
      <ellipse cx="32" cy="7" rx="2.6" ry="4" fill="#f59e0b" />
      <ellipse cx="32" cy="8" rx="1.2" ry="2" fill="#fde047" />
      <ellipse cx="42" cy="9" rx="2.6" ry="4" fill="#f59e0b" />
      <ellipse cx="42" cy="10" rx="1.2" ry="2" fill="#fde047" />

      {/* Mumlar */}
      <rect x="20.5" y="13" width="3" height="10" rx="1" fill="#3b82f6" />
      <rect x="20.5" y="15" width="3" height="1.6" fill="#bfdbfe" />
      <rect x="20.5" y="19" width="3" height="1.6" fill="#bfdbfe" />
      <rect x="30.5" y="11" width="3" height="12" rx="1" fill="#10b981" />
      <rect x="30.5" y="13.5" width="3" height="1.6" fill="#a7f3d0" />
      <rect x="30.5" y="18" width="3" height="1.6" fill="#a7f3d0" />
      <rect x="40.5" y="13" width="3" height="10" rx="1" fill="#ef4444" />
      <rect x="40.5" y="15" width="3" height="1.6" fill="#fecaca" />
      <rect x="40.5" y="19" width="3" height="1.6" fill="#fecaca" />

      {/* Tabak */}
      <ellipse cx="32" cy="57" rx="28" ry="4.5" fill="#cbd5e1" />
      <ellipse cx="32" cy="56" rx="24" ry="3" fill="#e2e8f0" />

      {/* Alt kat (çikolata) */}
      <rect x="8" y="37" width="48" height="19" rx="4" fill="#7c4a2d" />
      <path
        d="M8 41c0-2.2 1.8-4 4-4h40c2.2 0 4 1.8 4 4v2c-2 0-3 3-5 3s-3-3-5-3-3 4-5 4-3-4-5-4-3 3-5 3-3-3-5-3-3 4-5 4-3-4-5-4-3 3-5 3-3-3-4-3z"
        fill="#fef3c7"
      />
      <circle cx="16" cy="50" r="1.3" fill="#fbbf24" />
      <circle cx="26" cy="52" r="1.3" fill="#60a5fa" />
      <circle cx="36" cy="49" r="1.3" fill="#34d399" />
      <circle cx="47" cy="52" r="1.3" fill="#f87171" />

      {/* Üst kat (vanilya) */}
      <rect x="15" y="23" width="34" height="15" rx="4" fill="#f59e0b" />
      <path
        d="M15 27c0-2.2 1.8-4 4-4h26c2.2 0 4 1.8 4 4v1.5c-1.6 0-2.4 2.5-4 2.5s-2.4-2.5-4-2.5-2.4 3-4 3-2.4-3-4-3-2.4 2.5-4 2.5-2.4-2.5-4-2.5-2.4 3-4 3-2.4-3-4-3z"
        fill="#fffbeb"
      />
      <circle cx="22" cy="34" r="1.2" fill="#3b82f6" />
      <circle cx="31" cy="35" r="1.2" fill="#ef4444" />
      <circle cx="40" cy="33.5" r="1.2" fill="#10b981" />
    </svg>
  );
}

/** Kurdeleli madalya (iş yıldönümü) */
export function MadalyaIkon({ className }: Props) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Kurdeleler */}
      <path d="M20 4h10l6 20h-10z" fill="#3b82f6" />
      <path d="M44 4H34l-6 20h10z" fill="#ef4444" />
      <path d="M24 4h3l6 20h-3z" fill="#bfdbfe" />
      <path d="M40 4h-3l-6 20h3z" fill="#fecaca" />

      {/* Madalya */}
      <circle cx="32" cy="40" r="19" fill="#d97706" />
      <circle cx="32" cy="40" r="15.5" fill="#fbbf24" />
      <circle cx="32" cy="40" r="12" fill="#fde68a" />
      <path
        d="M32 31.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
        fill="#d97706"
      />
    </svg>
  );
}
