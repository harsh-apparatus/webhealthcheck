"use client";

import { useState } from "react";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does uptime monitoring work?",
      answer:
        "Our service continuously checks your websites and APIs at regular intervals (configurable from 15 seconds to 1 hour). When a check fails or detects downtime, we immediately send you alerts via your preferred notification channels.",
    },
    {
      question: "What happens if my website goes down?",
      answer:
        "The moment downtime is detected, you'll receive instant notifications via email, SMS, or webhook. You'll also get detailed information about when the downtime started, how long it lasted, and when it was resolved. All incidents are logged in your dashboard for review.",
    },
    {
      question: "Can I monitor multiple websites?",
      answer:
        "Yes! Depending on your plan, you can monitor anywhere from 5 to unlimited websites. Each website can have its own monitoring settings, alert preferences, and status page.",
    },
    {
      question: "Do you offer a free trial?",
      answer:
        "Yes, all plans include a 14-day free trial. No credit card required to start. You'll have full access to all features during the trial period so you can evaluate if our service meets your needs.",
    },
    {
      question: "What notification methods are available?",
      answer:
        "We support email notifications on all plans. Professional and Enterprise plans also include SMS alerts and webhook integrations. You can configure multiple notification channels and customize alert preferences for each website.",
    },
    {
      question: "How accurate is the uptime percentage?",
      answer:
        "Our monitoring system checks your websites from multiple locations worldwide, ensuring accurate detection of downtime. Uptime percentages are calculated based on successful checks versus total checks, giving you a precise measure of your website's availability.",
    },
    {
      question: "Can I integrate with other tools?",
      answer:
        "Yes! We provide a comprehensive REST API that allows you to integrate with your existing tools and workflows. Professional and Enterprise plans also include webhook support for real-time event notifications to your systems.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="parent py-24 bg-gray/20">
      <div className="container">
        <div className="text-center mb-20">
          <h2 className="h2 text-3xl md:text-4xl lg:text-5xl mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            Everything you need to know about our uptime monitoring service
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="card shadow1">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left flex items-center justify-between p-6 hover:bg-gray/30 rounded transition"
                aria-expanded={openIndex === index}
              >
                <h3 className="h2 text-lg md:text-xl font-semibold pr-4">
                  {faq.question}
                </h3>
                <span className="text-accent text-3xl flex-shrink-0 font-light">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-6 pt-2">
                  <p className="text-text/80 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

