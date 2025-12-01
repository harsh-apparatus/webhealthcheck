const HeroSection = () => {
  return (
    <section className="parent py-24 md:py-32 bg-gray/20">
      <div className="container">
        <div className="flex flex-col items-center text-center gap-8">
          <h1 className="h1 text-4xl md:text-5xl lg:text-6xl font-bold max-w-5xl leading-tight">
            Real-Time Uptime Monitoring
            <br />
            <span className="text-accent">Real-World Confidence</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl text-text/80 leading-relaxed">
            Monitor your websites and APIs with confidence. Get instant alerts
            when something goes wrong, and track your uptime with detailed
            analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <a
              href="#"
              className="btn-primary text-lg px-10 py-4 shadow1 font-semibold"
            >
              Get Started
            </a>
            <a
              href="#how-it-works"
              className="px-10 py-4 border border-border rounded text-white hover:bg-gray/50 transition shadow1"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

