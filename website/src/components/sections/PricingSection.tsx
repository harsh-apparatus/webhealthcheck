const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      description: "Perfect for small projects and personal websites",
      features: [
        "Up to 5 websites",
        "1-minute check intervals",
        "Email alerts",
        "30-day history",
        "Basic status page",
      ],
      popular: false,
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      description: "Ideal for growing businesses and agencies",
      features: [
        "Up to 25 websites",
        "30-second check intervals",
        "Email & SMS alerts",
        "90-day history",
        "Custom status pages",
        "API access",
        "Webhook integrations",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      description: "For large organizations with advanced needs",
      features: [
        "Unlimited websites",
        "15-second check intervals",
        "All alert types",
        "Unlimited history",
        "Advanced status pages",
        "Priority API access",
        "Custom integrations",
        "Dedicated support",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="parent py-24">
      <div className="container">
        <div className="text-center mb-20">
          <h2 className="h2 text-3xl md:text-4xl lg:text-5xl mb-6">
            Simple Pricing
          </h2>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include a 14-day
            free trial.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`card p-8 relative shadow1 hover:scale-105 transition-transform ${
                plan.popular ? "border-accent border-2" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-black px-5 py-2 rounded-full text-sm font-semibold shadow1">
                  Most Popular
                </div>
              )}
              <div className="mb-8">
                <h3 className="h2 text-2xl mb-3">{plan.name}</h3>
                <p className="text-text/70 mb-6">{plan.description}</p>
                <div className="flex items-baseline mb-2">
                  <span className="h1 text-5xl">{plan.price}</span>
                  <span className="text-text/70 ml-2 text-lg">
                    {plan.period}
                  </span>
                </div>
              </div>
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <span className="text-accent mr-3 text-xl font-bold">
                      ✓
                    </span>
                    <span className="text-text/80 leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className={`btn-primary w-full text-center block py-4 shadow1 font-semibold ${
                  plan.popular
                    ? "bg-accent text-black hover:bg-accent/90"
                    : ""
                }`}
              >
                Get Started
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;

