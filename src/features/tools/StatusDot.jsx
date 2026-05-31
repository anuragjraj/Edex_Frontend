import { Spinner } from '../../components/ui/Feedback'

// ══════════════════════════════════════════════════════════════
//  STATUS DOT (module status indicator)
// ══════════════════════════════════════════════════════════════
export function StatusDot({ status }) {
  const MAP = {
    done:     { color: '#22c55e', label: '✓' },
    building: { color: '#F59E0B', label: '…' },
    error:    { color: '#EF4444', label: '!' },
    pending:  { color: '#64748b', label: '' },
  };
  const { color, label } = MAP[status] || MAP.pending;
  return (
    <div style={{ width: 18, height: 18, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 900, flexShrink: 0 }}>
      {status === 'building' ? <Spinner size={10} /> : label}
    </div>
  );
}
