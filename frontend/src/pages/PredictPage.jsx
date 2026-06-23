import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Predictor from '../components/Predictor';

const PredictPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="page predict-page">
      {/* Ambient background */}
      <div className="bg-wrap">
        <div className="bg-grid"></div>
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>

      <div className="predict-shell">
        <Predictor />

        {/* Footer strip */}
        <div className="predict-footer-strip wrap">
          <span>© 2025 CutoffAI</span>
          <span>·</span>
          <button className="predict-footer-link" onClick={() => navigate('/')}>
            Home
          </button>
          <span>·</span>
          <span style={{ color: 'var(--text3)' }}>
            Data sourced from official MHT CET CAP rounds
          </span>
        </div>
      </div>

      <style>{`
        .predict-page {
          min-height: 100vh;
        }

        .predict-shell {
          position: relative;
          z-index: 1;
          padding-top: 64px;
        }

        /* ── Wider, centered card with stronger glow ── */
        .predict-page .pcard {
          max-width: 880px;
          margin: 0 auto;
          border-color: rgba(245, 158, 11, .22);
          box-shadow:
            0 0 0 1px rgba(245, 158, 11, .1),
            0 24px 80px rgba(0, 0, 0, .5),
            inset 0 0 60px rgba(245, 158, 11, .06);
          background: linear-gradient(
            145deg,
            rgba(20, 24, 41, .88) 0%,
            rgba(15, 18, 32, .96) 100%
          );
        }

        /* Animated shimmer top accent */
        .predict-page .pcard::before {
          background: linear-gradient(
            90deg,
            var(--amber3),
            var(--amber),
            var(--orange),
            var(--amber2),
            var(--amber3)
          );
          background-size: 300%;
          height: 3px;
          border-radius: 3px 3px 0 0;
          animation: shimmerLine 4s linear infinite;
        }

        @keyframes shimmerLine {
          0%   { background-position: 0% center; }
          100% { background-position: 300% center; }
        }

        /* Section heading — keep but re-center it */
        .predict-page .s-head {
          display: block;
          text-align: center;
          margin-bottom: 28px !important;
        }

        .predict-page .s-title {
          font-size: clamp(1.6rem, 3.5vw, 2.4rem);
        }

        /* More breathing room */
        .predict-page #predictor {
          padding-top: 48px;
        }

        /* Subtle radial glow behind the card */
        .predict-page #predictor .wrap::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 500px;
          background: radial-gradient(
            ellipse at center,
            rgba(245, 158, 11, .07) 0%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
        }

        .predict-page #predictor .wrap {
          position: relative;
        }

        /* Predict button — extra punch */
        .predict-page .pbtn {
          background: linear-gradient(135deg, var(--amber), var(--orange) 60%, #ff6b1a);
          box-shadow:
            0 0 28px rgba(245, 158, 11, .38),
            0 4px 16px rgba(0, 0, 0, .4),
            inset 0 1px 0 rgba(255, 255, 255, .25);
          letter-spacing: .02em;
          font-size: 17px;
        }

        .predict-page .pbtn:hover:not(:disabled) {
          box-shadow:
            0 0 44px rgba(245, 158, 11, .6),
            0 8px 24px rgba(0, 0, 0, .4),
            inset 0 1px 0 rgba(255, 255, 255, .3);
          transform: translateY(-3px);
        }

        /* Input / select focus ring — brighter */
        .predict-page .sf input:focus,
        .predict-page select:focus {
          border-color: var(--amber2);
          box-shadow:
            0 0 0 4px rgba(245, 158, 11, .2),
            inset 0 0 16px rgba(245, 158, 11, .1);
        }

        /* Result card accent bar — slightly thicker */
        .predict-page .cc::before { width: 5px; }
        .predict-page .cc:hover::before { width: 10px; }

        /* Footer strip */
        .predict-footer-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 32px 24px 48px;
          font-size: 12px;
          color: var(--text3);
          flex-wrap: wrap;
        }

        .predict-footer-link {
          background: none;
          border: none;
          color: var(--amber2);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font);
          transition: color .2s;
          padding: 0;
        }

        .predict-footer-link:hover { color: var(--amber3); }

        @media (max-width: 600px) {
          .predict-page .pcard { padding: 24px 16px; }
        }
      `}</style>
    </div>
  );
}