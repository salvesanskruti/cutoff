import { useEffect, useState } from 'react';
import { healthService } from '../services/api';

/**
 * Fixed bottom-right pill that shows live backend connectivity.
 * Polls /api/health every 30 seconds.
 */
const StatusIndicator = () => {
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok' | 'err'
  const [label, setLabel] = useState('Connecting…');

  const check = async () => {
    try {
      const res = await healthService.check();
      const mlOk = res.data?.mlService === 'connected' || res.data?.ml === 'ok';
      setStatus('ok');
      setLabel(mlOk ? 'API + ML Live' : 'API Live');
    } catch {
      setStatus('err');
      setLabel('Backend Offline');
    }
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`spill ${status === 'ok' ? 'ok' : status === 'err' ? 'err' : ''}`}>
      <span className="pd" />
      {label}
    </div>
  );
}