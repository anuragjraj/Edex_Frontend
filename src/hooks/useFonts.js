import { useEffect } from 'react'

// ══════════════════════════════════════════════════════════════
//  FONT + STYLE INJECTION
// ══════════════════════════════════════════════════════════════
export function useFonts() {
  useEffect(() => {
    if (!document.getElementById('brainspark-fonts')) {
      const link = document.createElement('link')
      link.id = 'brainspark-fonts'
      link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Sora:wght@600;700;800;900&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    if (!document.getElementById('brainspark-styles')) {
      const style = document.createElement('style')
      style.id = 'brainspark-styles'
      style.textContent = `
        :root {
          --bg: #05050e; --bg2: #0b0b1e; --text: #64748b; --text-h: #e2e8f0;
          --border: rgba(255,255,255,.08); --accent: #6366F1;
          --accent-bg: rgba(99,102,241,.12); --accent-border: rgba(99,102,241,.22);
          --code-bg: rgba(255,255,255,.04); --social-bg: rgba(255,255,255,.04);
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--text-h); }
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes dotBounce { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
        .brainspark-font { font-family: 'Nunito', system-ui, sans-serif; }
        @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }
        @media (min-width: 769px) { .mobile-top-nav  { display: none !important; } }
      `
      document.head.appendChild(style)
    }
  }, [])
}
