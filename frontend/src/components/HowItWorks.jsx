const HowItWorks = () => {
  return (
    <section className="sec" id="how">
      <div className="wrap">
        <div className="s-head ru">
          <div className="s-tag">How It Works</div>
          <div className="s-title" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Three steps to your list</div>
          <p className="s-sub">
            Our AI model trained on 3 years of real MHT CET cutoff data predicts 2025 with machine precision.
          </p>
        </div>

        <div className="steps ru">
          <div className="step">
            <div className="step-n" style={{ color: '#111111' }}>01</div>
            <div className="step-ico">📊</div>
            <h3>Enter Your Score</h3>
            <p>Input your MHT CET percentile, reservation category, and seat type. Takes under 10 seconds.</p>
          </div>

          <div className="step">
            <div className="step-n" style={{ color: '#111111' }}>02</div>
            <div className="step-ico">🤖</div>
            <h3>AI Predicts Cutoffs</h3>
            <p>XGBoost model analyzes 2022–2024 trends across 6,621 college-branch combos to forecast 2025 cutoffs.</p>
          </div>

          <div className="step">
            <div className="step-n" style={{ color: '#111111' }}>03</div>
            <div className="step-ico">🎓</div>
            <h3>Get Your Matches</h3>
            <p>Ranked list with Safe / Moderate / Reach labels. Click any college to view the full 3-year cutoff trend chart.</p>
          </div>
        </div>
      </div>
    </section>
  );
}