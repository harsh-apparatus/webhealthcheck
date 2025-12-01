const FeaturesSection = () => {
  const features = [
    {
      title: "Real-Time Monitoring",
      description:
        "Continuous monitoring with checks every minute to ensure your website is always up.",
    },
    {
      title: "Instant Alerts",
      description:
        "Get notified immediately via email, SMS, or webhook when downtime is detected.",
    },
    {
      title: "Uptime Statistics",
      description:
        "Track your uptime percentage, response times, and historical data with detailed analytics.",
    },
    {
      title: "Multi-Location Checks",
      description:
        "Monitor from multiple locations worldwide to ensure accurate uptime detection.",
    },
    {
      title: "Status Pages",
      description:
        "Create public status pages to keep your users informed about your service status.",
    },
    {
      title: "API Integration",
      description:
        "Integrate with your existing tools using our RESTful API for seamless automation.",
    },
    {
      title: "Custom Intervals",
      description:
        "Configure monitoring intervals that match your needs, from every minute to hourly checks.",
    },
    {
      title: "Detailed Logs",
      description:
        "Access comprehensive logs of all checks, responses, and incidents for troubleshooting.",
    },
  ];

  return (
    <section id="features" className="parent py-24 bg-gray/20">
      <div className="container">
        <div className="text-center mb-20">
          <h2 className="h2 text-3xl md:text-4xl lg:text-5xl mb-6">
            Powerful Features
          </h2>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            Everything you need to monitor and maintain your online presence
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card p-8 hover:border-accent/50 hover:scale-105 transition-all shadow1"
            >
              <h3 className="h2 text-xl mb-4">{feature.title}</h3>
              <p className="text-text/80 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

