import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  const goToPredict = () => navigate('/predict');

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="top">
      <div className="h-eye">🎯 MHT CET · AI-Powered · Free Forever</div>

      <h1>
        <span className="h1-line">Find Your College</span>
        <span className="h1-grad">Before Results Day</span>
      </h1>

      <p className="h-desc">
        Enter your MHT CET percentile and instantly get every college you can get
        into — ranked by chance, powered by 3 years of real cutoff data.
      </p>

      <div className="h-stats">
        <div className="hs">
          <div className="hs-n">315+</div>
          <div className="hs-l">Colleges</div>
        </div>
        <div className="hs">
          <div className="hs-n">107</div>
          <div className="hs-l">Branches</div>
        </div>
        <div className="hs">
          <div className="hs-n">87K</div>
          <div className="hs-l">Data Points</div>
        </div>
        <div className="hs">
          <div className="hs-n">99.8%</div>
          <div className="hs-l">Accuracy</div>
        </div>
      </div>

      <div className="h-btns">
        {/* Both CTA buttons go to the dedicated predict page */}
        <button className="btn-p" onClick={goToPredict}>
          Predict My Colleges <span>→</span>
        </button>
        <button className="btn-g" onClick={() => scrollTo('how')}>
          See How It Works
        </button>
      </div>
    </section>
  );
}