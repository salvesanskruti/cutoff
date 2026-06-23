export default () => {
  const features = [
    {
      icon: '🎯',
      title: 'AI-Powered Predictions',
      description: 'XGBoost machine learning model trained on 3 years of real MHT CET cutoff data for 99.8% accuracy.'
    },
    {
      icon: '⚡',
      title: 'Instant Results',
      description: 'Get ranked college matches in under a second. No waiting, no signup required.'
    },
    {
      icon: '📊',
      title: 'Cutoff Trends',
      description: 'View 3-year historical cutoff trends for every college-branch combo. See the pattern.'
    },
    {
      icon: '🔒',
      title: '100% Private',
      description: 'Your data is never stored. All predictions are done in-session. Complete privacy guaranteed.'
    },
    {
      icon: '🌐',
      title: '315+ Colleges',
      description: 'Coverage of all major engineering colleges in Maharashtra recognized by DTE.'
    },
  ];
    },
    {
      icon: '💰',
      title: 'Always Free',
      description: 'No premium tiers, no ads, no hidden charges. Free forever for every student.'
    }
  ];

  return (
    <section className="sec" id="features">
      <div className="wrap">
        <div className="s-head ru">
          <div className="s-tag">Why Use CutoffAI</div>
          <div className="s-title" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>Features built for you</div>
          <p className="s-sub">Everything you need to make an informed college choice.</p>
        </div>

        <div className="fgrid ru">
          {features.map((feature, idx) => (
            <div key={idx} className="fc">
              <div className="fico">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}