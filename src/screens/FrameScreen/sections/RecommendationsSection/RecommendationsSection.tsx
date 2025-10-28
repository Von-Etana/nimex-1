import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Separator } from "../../../../components/ui/separator";

const socialIcons = [
  { src: "/container-3.svg", alt: "Facebook" },
  { src: "/container-2.svg", alt: "Instagram" },
  { src: "/container-1.svg", alt: "YouTube" },
  { src: "/container.svg", alt: "LinkedIn" },
  { src: "/container-4.svg", alt: "TikTok" },
];

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Electronics", path: "/categories" },
      { label: "Fashion", path: "/categories" },
      { label: "Home & Office", path: "/categories" },
      { label: "Groceries", path: "/categories" },
      { label: "Books", path: "/categories" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", path: "/blog" },
      { label: "FAQ", path: "/faq" },
      { label: "Support", path: "/contact" },
      { label: "Developers", path: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", path: "/about" },
      { label: "Terms & Conditions", path: "/terms" },
      { label: "Contact Us", path: "/contact" },
      { label: "Privacy Policy", path: "/privacy" },
    ],
  },
];

export const RecommendationsSection = (): JSX.Element => {
  return (
    <section className="flex flex-col items-center gap-10 w-full">
      <Card className="w-full max-w-[752px] bg-[#fff9e6] rounded-2xl border-none shadow-none">
        <CardContent className="flex flex-col items-center gap-6 p-10">
          <h2 className="[font-family:'Poppins',Helvetica] font-bold text-[#19191f] text-4xl text-center tracking-[0] leading-10">
            Unlock Your Business Potential
          </h2>

          <p className="[font-family:'Inter',Helvetica] font-normal text-[#19191f] text-lg text-center tracking-[0] leading-7 opacity-90 max-w-[672px]">
            Join NIMEX's thriving community of vendors. Sell your products,
            reach a wider audience, and grow your business with ease.
          </p>

          <Link to="/signup">
            <Button
              className="h-11 px-8 bg-gray-100 hover:bg-gray-200 text-[#323742] rounded-[10px] [font-family:'Inter',Helvetica] font-medium text-sm"
              variant="secondary"
            >
              Start Selling Today
            </Button>
          </Link>
        </CardContent>
      </Card>

      <footer className="w-full bg-[#fafafb] py-8 md:py-11">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-12">
            <div className="flex gap-4 justify-center md:justify-start">
              {socialIcons.map((icon, index) => (
                <button
                  key={index}
                  className="w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity"
                  aria-label={icon.alt}
                >
                  <img className="w-5 h-5" alt={icon.alt} src={icon.src} />
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 lg:gap-20">
              {footerLinks.map((section, sectionIndex) => (
                <nav key={sectionIndex} className="flex flex-col gap-4">
                  <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#171a1f] text-base tracking-[0] leading-6">
                    {section.title}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {section.links.map((link, linkIndex) => (
                      <li key={linkIndex}>
                        <Link
                          to={link.path}
                          className="[font-family:'Inter',Helvetica] font-normal text-[#171a1f] text-sm tracking-[0] leading-5 opacity-80 hover:opacity-100 transition-opacity"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
          </div>

          <Separator className="mt-8 md:mt-12 bg-[#e5e5e5]" />

          <div className="mt-6 text-center md:text-left">
            <p className="[font-family:'Inter',Helvetica] font-normal text-[#171a1f] text-sm opacity-60">
              © 2025 NIMEX. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </section>
  );
};
