"use client";

import Image from "next/image";
import {TypeAnimation} from "react-type-animation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { FiGithub } from "react-icons/fi";
import { SiGmail } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";
import { FiLinkedin } from "react-icons/fi";
type FAQ = { id: number; q: string; a: string };

const faqs: FAQ[] = [
  { id: 1, q: "How does chat with PDFs work?", a: "Upload a PDF and start a natural conversation; answers include citations and page links." },
  { id: 2, q: "Can quizzes use my data?", a: "Yes. Quizzes are generated from uploaded files, notes, and bookmarks with adaptive difficulty." },
  { id: 3, q: "What’s the Library feature?", a: "Create courses and study plans from saved content, with milestones and tracking." },
  {id:4, q: "How does privacy work with uploaded documents?", a: "Files are processed to extract text and generate answers/quizzes, then cleared from temporary processing; data isn’t used to train public models and access controls restrict who can view content." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div layout className="w-full   rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer   bg-white px-4 py-4 shadow-sm" initial={false}>
      <button
        className="flex w-full items-center cursor-pointer justify-between text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`panel-${q}`}
      >
        <span className="font-medium cursor-pointer text-black">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#f5f5f5] text-black">
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
            <div className="pt-3 text-sm leading-6 text-navy">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


     

export default function Hero() {
  return (
    <div className="bg-[#f5f5f5] min-h-screen w-[100vw] flex flex-col pt-34 gap-8 items-center ">
      <div className="bg-white w-11/12 flex cta justify-evenly p-10 gap-12 shadow-sm  rounded-4xl font-mono">
        <div className="flex flex-col justify-center gap-10">
          <h1 className="text-4xl font-bold text-black">Welcome to Wingman</h1>

          <p className="text-black text-2xl">
            your personal AI{" "}
            <TypeAnimation
              sequence={[
                "tutor.", 1000,
                "study buddy.", 1000,
                "coach.", 1000,
                "guide.", 1000,
              ]}
              wrapper="span"
              cursor={true}
              repeat={Infinity}
              className="text-navy"
            />
          </p>

          <p className="text-black">
            Wingman is an AI-powered learning assistant that helps you learn and
            study more effectively.
          </p>
        </div>

        <Image src="/su-7.png" alt="Hero Image" className="text-navy" width={500} height={600} />
      </div>
      <div className="flex w-11/12 cards gap-4 justify-evenly">
              <div className="flex p-8 bg-white shadow-sm hover:shadow-xl transition-all duration-300 rounded-4xl flex-col justify-evenly gap-4">
                <h1 className="text-2xl font-bold text-black">Chat bot</h1>
                <p className="text-xl text-navy">Talk to your PDFs</p>
                <p className="text-base text-black">Chat with documents, websites, and notes in natural language, and get cited answers, summaries, and follow ups instantly.</p>
              </div>
              <div className="flex p-8 bg-white hover:shadow-xl transition-all duration-300 shadow-sm rounded-4xl flex-col justify-evenly gap-4">
                <h1 className="text-2xl font-bold text-black">Library</h1>
                <p className="text-xl text-navy">Build courses from your knowledge</p>
                <p className="text-base text-black">Turn saved content into structured study plans and bite‑sized courses, complete with milestones, reminders, and progress tracking.</p>
              </div>
              <div className="flex p-8 bg-white hover:shadow-xl transition-all duration-300 shadow-sm rounded-4xl flex-col justify-evenly gap-4">
                <h1 className="text-2xl font-bold text-black">Quiz</h1>
                <p className="text-xl text-navy">Quiz me from your data</p>
                <p className="text-base text-black">Auto‑generate personalized quizzes from uploaded files, chats, and bookmarks, with adaptive difficulty and instant feedback.</p>
              </div>
              

      </div>

      <div className="flex  flex-col w-11/12 faqs gap-4 items-center justify-evenly flex-wrap">
      {faqs.map((f) => (
        <FAQItem key={f.id} q={f.q} a={f.a} />
      ))}
    </div>
      
        <div className="flex w-11/12 mt-24 gap-24 justify-between mb-24">
          <div className="flex flex-col w-1/2 gap-4">
          <h1 className="text-lg font-bold text-black">
              N.I.A.T 
            </h1>
            <div className="flex gap-10">
              <Image src="/crest.png" alt="Hero Image" width={80} height={80} />
              <Image src="/niat.png" alt="Hero Image" width={80} height={80} />
            </div>
            
            <p className="text-sm text-neutral-600">Built by the Naval Institute of Aeronautical Technology, Kochi — empowering learners with practical engineering and innovation.</p>
            <p className="text-sm text-neutral-600">Established in 1947 under Southern Naval Command, advancing aeronautical education and applied research.</p>
            <p className="text-xs text-neutral-600">© 2025 NIAT. All rights reserved.</p>

          </div>
          <div className="flex flex-col justify-between w-1/2 gap-4">
            <div className="flex justify-between">
              
              <div className="flex flex-col  w-1/3 gap-4">
                  <h1 className="text-lg font-bold text-black">Contact us</h1>
                  <p className="text-sm text-neutral-600">Email: wingmanai.contact@gmail.com</p>
                  <p className="text-sm text-neutral-600">Phone: +91 9876543210</p>
                  <p className="text-sm text-neutral-600">Address: 123 Main St, Kochi, Kerala</p>
              </div>
              <div className="flex flex-col   gap-4">
                <h1 className="text-lg font-bold text-black">Quick links</h1>
                <p className="text-sm text-neutral-600">Home</p>
                <p className="text-sm text-neutral-600">Chat</p>
                <p className="text-sm text-neutral-600">Library</p>
                <p className="text-sm text-neutral-600">Quiz</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="text-lg font-bold text-black">Socials</h1>
              <div className="flex text-neutral-600  gap-6">
              <SiGmail />
                <FiGithub />
                
                <FaXTwitter />
                <FiLinkedin />
              </div>

            </div>
          </div>
          
            

        </div>
    </div>
  );
}
