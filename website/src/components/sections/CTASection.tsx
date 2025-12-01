const CTASection = () => {
  return (
    <section className="parent py-24">
      <div className="container">
        <div className="card-highlight p-12 md:p-16 lg:p-20 text-center max-w-4xl mx-auto shadow1">
          <h2 className="h1 text-3xl md:text-4xl lg:text-5xl mb-8">
            Ready to Monitor Your Websites?
          </h2>
          <p className="text-lg md:text-xl text-text/80 mb-10 max-w-2xl mx-auto leading-relaxed">
            Start your 14-day free trial today. No credit card required. Get
            instant alerts and track your uptime with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="btn-primary text-lg px-10 py-4 shadow1 font-semibold"
            >
              Start Free Trial
            </a>
            <a
              href="#pricing"
              className="px-10 py-4 border border-border rounded text-white hover:bg-gray/50 transition text-lg shadow1"
            >
              View Pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

