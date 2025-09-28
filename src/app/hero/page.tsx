"use client";

import Image from "next/image";
import { TypeAnimation } from "react-type-animation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TextRotate from "../../components/fancy/text/text-rotate";
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

// Image carousel component
function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Define available images with their extensions
  const images = [
    { src: "/1.jpg", alt: "Image 1" },
    { src: "/2.jpg", alt: "Image 2" },
    { src: "/3.jpg", alt: "Image 3" },
    { src: "/4.jpg", alt: "Image 4" },
    { src: "/5.png", alt: "Image 5" },
    { src: "/6.jpg", alt: "Image 6" },
    { src: "/7.jpg", alt: "Image 7" },
    { src: "/10.png", alt: "Image 10" },
    { src: "/11.jpg", alt: "Image 11" },
    { src: "/12.jpg", alt: "Image 12" },
    { src: "/13.jpg", alt: "Image 13" },
    { src: "/14.jpg", alt: "Image 14" },
    { src: "/15.jpg", alt: "Image 15" },
  ];

  // Preload all images
  useEffect(() => {
    const preloadImages = () => {
      const imagePromises = images.map((image) => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = image.src;
        });
      });

      Promise.all(imagePromises)
        .then(() => setIsLoaded(true))
        .catch((error) => {
          console.error("Error preloading images:", error);
          setIsLoaded(true); // Continue even if some images fail
        });
    };

    preloadImages();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [images.length, isLoaded]);

  if (!isLoaded) {
    return (
      <div className="relative w-full h-[700px] rounded-2xl overflow-hidden bg-gray-200 flex items-center justify-center">
        <div className="text-gray-500">Loading images...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[700px] rounded-2xl overflow-hidden bg-black">
      <AnimatePresence>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            width={800}
            height={700}
            className="w-full h-full object-cover object-center"
            priority={currentIndex < 3}
          />
        </motion.div>
      </AnimatePresence>

      {/* Optional: Dots indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-white shadow-lg"
                : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout
      className="w-full   rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer   bg-white px-4 py-4 shadow-sm"
      initial={false}
    >
      <button
        className="flex w-full items-center cursor-pointer justify-between text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`panel-${q}`}
      >
        <span className="font-medium cursor-pointer text-black">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[#f5f5f5] text-black"
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
            <div className="pt-3 text-sm leading-6 text-navy">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <div className="bg-[#f5f5f5] min-h-screen w-full flex flex-col pt-24 md:pt-34  items-center px-4 md:px-0">
      <div className=" w-full md:w-11/12 flex flex-col lg:flex-row cta text-left justify-between   md:p-10 gap-8 lg:gap-12  rounded-4xl font-mono">
        <div className="flex flex-col justify-between gap-6 lg:gap-10 text-left">
          <h1 className="text-8xl font-bold text-black">AeroMentorAI</h1>

          {/* <p className="text-black text-lg md:text-2xl">
            your personal AI{" "}
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
              className="text-navy"
            />
          </p>

          <p className="text-black text-sm md:text-base">
            Wingman is an AI-powered learning assistant that helps you learn and
            study more effectively.
          </p> */}
        </div>

        <div className="flex justify-center lg:justify-end">
          {/* <Image
            src="/su-7.png"
            alt="Hero Image"
            className="text-navy max-w-full h-auto"
            width={400}
            height={480}
            priority
          /> */}
          <TextRotate
            texts={["Chat", "Library", "Quiz", "Dashboard"]}
            mainClassName=" text-black overflow-hidden text-8xl font-bold"
            staggerFrom={"last"}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </div>
      </div>

      {/* <div className="flex w-full md:w-11/12 flex-col md:flex-row cards gap-4 justify-center md:justify-evenly px-4 md:px-0">
        <div className="flex p-6 md:p-8 bg-white shadow-sm hover:shadow-xl transition-all duration-300 rounded-4xl flex-col justify-evenly gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-black">Chat bot</h1>
          <p className="text-lg md:text-xl text-navy">Talk to your PDFs</p>
          <p className="text-sm md:text-base text-black">
            Chat with documents, websites, and notes in natural language, and
            get cited answers, summaries, and follow ups instantly.
          </p>
        </div>
        <div className="flex p-6 md:p-8 bg-white hover:shadow-xl transition-all duration-300 shadow-sm rounded-4xl flex-col justify-evenly gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-black">Library</h1>
          <p className="text-lg md:text-xl text-navy">
            Build courses from your knowledge
          </p>
          <p className="text-sm md:text-base text-black">
            Turn saved content into structured study plans and bite‑sized
            courses, complete with milestones, reminders, and progress tracking.
          </p>
        </div>
        <div className="flex p-6 md:p-8 bg-white hover:shadow-xl transition-all duration-300 shadow-sm rounded-4xl flex-col justify-evenly gap-4">
          <h1 className="text-xl md:text-2xl font-bold text-black">Quiz</h1>
          <p className="text-lg md:text-xl text-navy">Quiz me from your data</p>
          <p className="text-sm md:text-base text-black">
            Auto‑generate personalized quizzes from uploaded files, chats, and
            bookmarks, with adaptive difficulty and instant feedback.
          </p>
        </div>
      </div> */}
      <div className="flex w-full md:w-11/12 flex-col md:flex-row cards gap-4 justify-center md:justify-evenly px-4 md:px-0">
        <ImageCarousel />
      </div>

      {/* <div className="flex flex-col w-full md:w-11/12 faqs gap-4 items-center justify-center px-4 md:px-0">
        {faqs.map((f) => (
          <FAQItem key={f.id} q={f.q} a={f.a} />
        ))}
      </div> */}

      <div className="flex flex-col lg:flex-row w-full md:w-11/12 mt-12 md:mt-24 gap-8 md:gap-24 justify-between mb-12 md:mb-24 px-4 md:px-0">
        <div className="flex flex-col w-full lg:w-1/2 gap-4">
          <h1 className="text-lg font-bold text-black">N.I.A.T</h1>
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

          <p className="text-sm text-neutral-600">
            Built by the Naval Institute of Aeronautical Technology, Kochi —
            empowering learners with practical engineering and innovation.
          </p>
          <p className="text-sm text-neutral-600">
            Established in 1947 under Southern Naval Command, advancing
            aeronautical education and applied research.
          </p>
          <p className="text-xs text-neutral-600">
            © 2025 NIAT. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col justify-between w-full lg:w-1/2 gap-6 md:gap-4">
          <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-4">
            <div className="flex flex-col w-full md:w-1/3 gap-4">
              <h1 className="text-lg font-bold text-black">Contact us</h1>
              <p className="text-sm text-neutral-600">
                Email: wingmanai.contact@gmail.com
              </p>
              <p className="text-sm text-neutral-600">Phone: +91 9876543210</p>
              <p className="text-sm text-neutral-600">
                Address: 123 Main St, Kochi, Kerala
              </p>
            </div>
            {/* <div className="flex flex-col gap-4">
              <h1 className="text-lg font-bold text-black">Quick links</h1>
              <p className="text-sm text-neutral-600 cursor-pointer hover:text-navy">Home</p>
              <p className="text-sm text-neutral-600 cursor-pointer hover:text-navy">Chat</p>
              <p className="text-sm text-neutral-600 cursor-pointer hover:text-navy">Library</p>
              <p className="text-sm text-neutral-600 cursor-pointer hover:text-navy">Quiz</p>
            </div> */}
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-lg font-bold text-black">Socials</h1>
            <div className="flex text-neutral-600 gap-6 text-xl">
              <SiGmail className="cursor-pointer hover:text-navy transition-colors" />
              <FiGithub className="cursor-pointer hover:text-navy transition-colors" />
              <FaXTwitter className="cursor-pointer hover:text-navy transition-colors" />
              <FiLinkedin className="cursor-pointer hover:text-navy transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
