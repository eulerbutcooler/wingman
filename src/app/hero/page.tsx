"use client";

import React from "react";
import Image from "next/image";
import { TypeAnimation } from "react-type-animation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientText } from "@/components/ui/shadcn-io/gradient-text";

<GradientText
  text="Smooth flowing gradients"
  gradient="linear-gradient(90deg, #3b82f6 0%, #a855f7 50%, #ec4899 100%)"
/>;
import { FiGithub } from "react-icons/fi";
import { SiGmail } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import { FiLinkedin } from "react-icons/fi";
type FAQ = { id: number; q: string; a: string };

const faqs: FAQ[] = [
  {
    id: 1,
    q: "How does chat with PDFs work?",
    a: "Upload a PDF and start a natural conversation; answers include citations and page links.",
  },
  {
    id: 2,
    q: "Can quizzes use my data?",
    a: "Yes. Quizzes are generated from uploaded files, notes, and bookmarks with adaptive difficulty.",
  },
  {
    id: 3,
    q: "What’s the Library feature?",
    a: "Create courses and study plans from saved content, with milestones and tracking.",
  },
  {
    id: 4,
    q: "How does privacy work with uploaded documents?",
    a: "Files are processed to extract text and generate answers/quizzes, then cleared from temporary processing; data isn’t used to train public models and access controls restrict who can view content.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      className="w-full modern-card hover:modern-card-hover rounded-2xl transition-all duration-300 cursor-pointer animate-fade-in-scale"
      initial={false}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        className="flex w-full items-center cursor-pointer justify-between text-left p-4 md:p-6"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`panel-${q}`}
      >
        <span className="font-medium cursor-pointer text-black text-sm md:text-base">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-gradient-to-r from-navy to-blue-600 text-white font-bold text-lg md:text-xl shadow-lg"
        >
          +
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`panel-${q}`}
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {/* Put padding inside inner wrapper to avoid height measurement glitches */}
            <div className="pt-3 text-sm leading-6 text-navy font-medium">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Hero() {
  // Override body background for hero page
  React.useEffect(() => {
    // Clear body background so sketch image doesn't show through
    const originalBackgroundImage = document.body.style.backgroundImage;
    const originalBackgroundColor = document.body.style.backgroundColor;
    const originalBackgroundSize = document.body.style.backgroundSize;
    const originalBackgroundPosition = document.body.style.backgroundPosition;
    const originalBackgroundAttachment =
      document.body.style.backgroundAttachment;
    const originalBackgroundRepeat = document.body.style.backgroundRepeat;

    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "transparent";

    // Cleanup: restore original background when component unmounts
    return () => {
      document.body.style.backgroundImage = originalBackgroundImage || "";
      document.body.style.backgroundColor =
        originalBackgroundColor || "#f5f5f5";
      document.body.style.backgroundSize = originalBackgroundSize || "cover";
      document.body.style.backgroundPosition =
        originalBackgroundPosition || "center";
      document.body.style.backgroundAttachment =
        originalBackgroundAttachment || "fixed";
      document.body.style.backgroundRepeat =
        originalBackgroundRepeat || "no-repeat";
    };
  }, []);

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Blurred background image layer - scale up to hide blur edges */}
      <div
        className="absolute z-0"
        style={{
          backgroundImage: "url('/su9.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          filter: "blur(3px)",
          opacity: 0.8,
          top: "-10px",
          left: "-10px",
          right: "-10px",
          bottom: "-10px",
          width: "calc(100% + 20px)",
          height: "calc(100% + 20px)",
        }}
      ></div>

      {/* Content container with higher z-index and isolation */}
      <div
        className="relative z-10 flex flex-col pt-24 md:pt-34 gap-8 items-center px-4 md:px-0"
        style={{ isolation: "isolate" }}
      >
        <div className="w-full text-left md:w-11/12 flex flex-col lg:flex-row cta pb-28  gap-8 lg:gap-12  font-sans">
          <div className="flex flex-col justify-center gap-6 lg:gap-10  text-left">
            <motion.h1
              className="text-7xl text-left font-bold text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Welcome to{" "}
              <span>
                <GradientText
                  text="AeroMentor"
                  gradient="linear-gradient(90deg, #1e3a8a 0%, #2563eb 30%, #3b82f6 50%, #60a5fa 70%, #1e3a8a 100%)

"
                />
              </span>
            </motion.h1>

            <motion.p
              className="text-white text-5xl "
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Your personal AI{" "}
              <TypeAnimation
                sequence={[
                  "tutor.",
                  1000,
                  "study buddy.",
                  1000,
                  "coach.",
                  1000,
                  "guide.",
                  1000,
                ]}
                wrapper="span"
                cursor={true}
                repeat={Infinity}
                className=" text-white"
              />
            </motion.p>

            <motion.p
              className="text-white text-4xl  opacity-80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              AeroMentor is an AI-powered learning assistant that helps you
              learn and study more effectively.
            </motion.p>
          </div>

          {/* <motion.div 
          className="flex justify-center lg:justify-end animate-float"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Image
            src="/su-7.png"
            alt="Hero Image"
            className="text-navy max-w-full h-auto drop-shadow-2xl"
            width={400}
            height={480}
            priority
          />
        </motion.div> */}
        </div>

        <div className="flex w-full md:w-11/12 flex-col md:flex-row cards gap-4 justify-center md:justify-evenly px-4 md:px-0">
          <motion.div
            className="flex p-2 py-4 px-4 modern-card transition-all duration-300 rounded-2xl md:rounded-4xl flex-col justify-evenly gap-4 group animate-slide-in-up"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-navy to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">💬</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-black">
                Chat bot
              </h1>
            </div>
            <p className="text-lg md:text-xl text-navy font-semibold">
              Talk to your PDFs
            </p>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Chat with documents, websites, and notes in natural language, and
              get cited answers, summaries, and follow ups instantly.
            </p>
            <div className="w-full h-1 bg-gradient-to-r from-navy to-blue-600 rounded-full mt-2 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </motion.div>

          <motion.div
            className="flex p-2 py-4 px-4 modern-card transition-all duration-300 rounded-2xl md:rounded-4xl flex-col justify-evenly gap-4 group animate-slide-in-up"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-navy to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">📚</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-black">
                Library
              </h1>
            </div>
            <p className="text-lg md:text-xl text-navy font-semibold">
              Build courses from your knowledge
            </p>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Turn saved content into structured study plans and bite‑sized
              courses, complete with milestones, reminders, and progress
              tracking.
            </p>
            <div className="w-full h-1 bg-gradient-to-r from-navy to-blue-600 rounded-full mt-2 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </motion.div>

          <motion.div
            className="flex p-2 py-4 px-4 modern-card transition-all duration-300 rounded-2xl md:rounded-4xl flex-col justify-evenly gap-4 group animate-slide-in-left"
            whileHover={{ scale: 1.05 }}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-r from-navy to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🧠</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-black">Quiz</h1>
            </div>
            <p className="text-lg md:text-xl text-navy font-semibold">
              Quiz me from your data
            </p>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed">
              Auto‑generate personalized quizzes from uploaded files, chats, and
              bookmarks, with adaptive difficulty and instant feedback.
            </p>
            <div className="w-full h-1 bg-gradient-to-r from-navy to-blue-600 rounded-full mt-2 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </motion.div>
        </div>

        <div className="flex flex-col w-full md:w-11/12 faqs gap-4 items-center justify-center px-4 md:px-0">
          {faqs.map((f) => (
            <FAQItem key={f.id} q={f.q} a={f.a} />
          ))}
        </div>

        <div className="flex flex-col lg:flex-row w-full md:w-11/12 mt-12 md:mt-24 gap-8 md:gap-24 justify-between mb-12 md:mb-24 px-4 md:px-0">
          <div className="flex flex-col w-full lg:w-1/2 gap-4">
            <h1 className="text-lg font-bold text-white">N.I.A.T</h1>
            <div className="flex gap-6 md:gap-10">
              <Image
                src="/crest.png"
                alt="Hero Image"
                width={60}
                height={60}
                className="md:w-20 md:h-20"
              />
              <Image
                src="/niat.png"
                alt="Hero Image"
                width={60}
                height={60}
                className="md:w-20 md:h-20"
              />
            </div>

            <p className="text-sm text-white">
              Built by the Naval Institute of Aeronautical Technology, Kochi.
            </p>
            <p className="text-sm text-white">
              Established in 1956 under Southern Naval Command, advancing
              aeronautical education and applied research.
            </p>
            <p className="text-xs text-white">
              © 2025 NIAT. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col justify-between w-full lg:w-1/2 gap-6 md:gap-4">
            <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-4">
              <div className="flex flex-col w-full md:w-1/3 gap-4">
                <h1 className="text-lg font-bold text-white">Contact us</h1>
                <p className="text-sm text-white">
                  Email: aeromentor.contact@gmail.com
                </p>
                <p className="text-sm text-white">Phone: +91 9876543210</p>
                <p className="text-sm text-white">
                  Address: INS Garuda, Naval Base, Kochi - 682004, Kerala
                </p>
              </div>
              <div className="flex flex-col gap-4">
                <h1 className="text-lg font-bold text-white">Quick links</h1>
                <p className="text-sm text-white cursor-pointer hover:text-navy">
                  HOME
                </p>
                <p className="text-sm text-white cursor-pointer hover:text-navy">
                  CHAT
                </p>
                <p className="text-sm text-white cursor-pointer hover:text-navy">
                  LIBRARY
                </p>
                <p className="text-sm text-white cursor-pointer hover:text-navy">
                  QUIZ
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="text-lg font-bold text-white">Socials</h1>
              <div className="flex text-white gap-6 text-xl">
                <SiGmail className="cursor-pointer hover:text-navy transition-colors" />
                {/* <FiGithub className="cursor-pointer hover:text-navy transition-colors" />
                <FaXTwitter className="cursor-pointer hover:text-navy transition-colors" />
                <FiLinkedin className="cursor-pointer hover:text-navy transition-colors" /> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
