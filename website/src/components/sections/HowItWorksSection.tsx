const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Sign Up",
      description:
        "Create your account in seconds. No credit card required to get started.",
    },
    {
      number: "02",
      title: "Add Your Website",
      description:
        "Enter your website URL and configure monitoring intervals. It takes less than a minute.",
    },
    {
      number: "03",
      title: "Monitor & Track",
      description:
        "Watch real-time status updates, uptime percentages, and response times for all your sites.",
    },
    {
      number: "04",
      title: "Get Instant Alerts",
      description:
        "Receive notifications via email or SMS the moment your website goes down or experiences issues.",
    },
  ];

  return (
    <section id="how-it-works" className="parent py-24">
      <div className="container">
        <div className="text-center mb-20">
          <h2 className="h2 text-3xl md:text-4xl lg:text-5xl mb-6">
            How It Works
          </h2>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            Get started with uptime monitoring in four simple steps
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="card-highlight p-8 hover:scale-105 transition-transform shadow1"
            >
              <div className="text-accent text-5xl font-bold mb-6 opacity-60">
                {step.number}
              </div>
              <h3 className="h2 text-xl mb-4">{step.title}</h3>
              <p className="text-text/80 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

