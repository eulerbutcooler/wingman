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
import { VideoText } from "@/components/ui/video-text"
import { MultiStepLoader as Loader } from "../../components/ui/multi-step-loader";
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
    <div className="relative w-full h-[700px] rounded-2xl overflow-hidden ">
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
            className="w-full blur-[5px] h-full object-cover object-center"
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  return (
    <div className="relative min-h-screen w-full flex flex-col pt-24 md:pt-34 items-center px-4 md:px-0">
      {/* Background Image - Fixed viewport covering */}
      <div className="fixed inset-0 z-0 h-screen w-screen">
        <Image
          src="/su9.jpg"
          alt="Background"
          fill
          className="object-cover opacity-98 blur-[2px] object-top"
          priority
        />
      </div>
      
      {/* Content with overlay - scrolls over background */}
      <div className="relative z-10 w-full md:w-11/12 flex flex-col lg:flex-row cta text-left justify-between md:p-10 gap-8 lg:gap-12 rounded-4xl font-mono">
        <div className="flex w-full flex-col pt-30 pb-64 justify-between gap-2 lg:gap-2 text-center relative">
          <h1 className="text-[150px] text-center z-10  font-bold text-white relative ">AeroMentor</h1>
          <h1 className="text-6xl z-10 text-center flex text-white items-center justify-center gap-2">
            <span>Get grounded answers anytime.</span>
            <TextRotate
              texts={["Cited.", "Clear.", "Ready."]}
              mainClassName="text-white overflow-hidden text-6xl font-semibold"
              staggerFrom={"last"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={2000}
            />
          </h1>
          
          <div className="flex gap-4 justify-center items-center mt-8">

            <button className="px-4 py-1  pt-2 z-30 bg-white text-black cursor-pointer font-semibold rounded-2xl text-xl shadow-md h-12 flex items-center justify-center">
              Learn More
            </button>
            <button className="px-4 py-1 pt-2 bg-black border-2 z-30 border-black cursor-pointer text-white font-semibold rounded-2xl text-xl shadow-md h-12 flex items-center justify-center">
              Get Started
            </button>
          </div>

          {/* <Image
            src="/su-7.png"
            alt="Su-7 Aircraft"
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 rotate-180 -translate-y-1/2 scale-y-[-1] opacity-70"
            width={1000}
            height={1300}
            priority
          /> */}

          

        </div>

        <div className="flex justify-center lg:justify-end">
          
        </div>
      </div>

      
      <div className="z-10 w-full md:w-11/12 flex justify-between  items-center mt-12 mb-8  relative overflow-hidden">
        {/* Texture overlay */}
        {/* backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-xl */}
        {/* <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 2px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 2px
          )`
        }}></div> */}
        
        <div className="relative z-10 flex flex-col gap-4">
          <h1 className="text-8xl font-bold text-white">Chat</h1>
          <p className="text-2xl text-white/90 leading-relaxed max-w-2xl">
            Upload course materials and get instant answers with precise citations. Our RAG-powered chatbot provides intelligent responses backed by page numbers and source references.
          </p>
        </div>
        <div className="relative z-10"><Image
          src="/chat.png"
          alt="Chat"
          width={1000}
          height={800}
          className="object-contain"
        /></div>
      </div>
      <div className="z-10 w-full md:w-11/12 flex justify-between  items-center mt-12 mb-8  relative overflow-hidden">
        {/* Texture overlay */}
        {/* backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-xl */}
        {/* <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 2px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 2px
          )`
        }}></div> */}
        
        
        <div className="relative z-10"><Image
          src="/library.png"
          alt="Chat"
          width={1000}
          height={800}
          className="object-contain scale-x-[-1]"
        /></div>
        <div className="relative z-10 flex flex-col gap-4">
          <h1 className="text-8xl font-bold text-white">Library</h1>
          <p className="text-2xl text-white/90 leading-relaxed max-w-2xl">
            Access comprehensive aeronautical engineering courses with structured topics and lessons. Browse through PDFs, documents, and presentations organized into complete learning paths for your curriculum.
          </p>
        </div>
      </div>
      <div className="z-10 w-full md:w-11/12 flex justify-between  items-center mt-12 mb-8  relative overflow-hidden">
        {/* Texture overlay */}
        {/* backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-8 shadow-xl */}
        {/* <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 2px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0px,
            rgba(255, 255, 255, 0.03) 1px,
            transparent 1px,
            transparent 2px
          )`
        }}></div> */}
        
        <div className="relative z-10 flex flex-col gap-4">
          <h1 className="text-8xl font-bold text-white">Quiz</h1>
          <p className="text-2xl text-white/90 leading-relaxed max-w-2xl">
            Test your knowledge with AI-generated quizzes across multiple difficulty levels. Each quiz features 30 comprehensive questions with instant feedback, detailed explanations, and performance tracking to enhance your learning.
          </p>
        </div>
        <div className="relative z-10"><Image
          src="/quiz.png"
          alt="Chat"
          width={1000}
          height={800}
          className="object-contain"
        /></div>
      </div>
      <div className="relative z-10 h-[500px] flex flex-col mt-62  w-10/12 overflow-hidden">
        <VideoText src="/edit.mp4">Everything You Need</VideoText>
        <VideoText src="/edit.mp4">To Ace Aeronautical</VideoText>
        <VideoText src="/edit.mp4">Technology</VideoText>
      </div>








      <div className="relative z-10 flex flex-col lg:flex-row w-full md:w-11/12 mt-12 md:mt-24 gap-8 md:gap-24 justify-between mb-12 md:mb-24 px-4 md:px-0">
        <div className="flex flex-col w-full lg:w-1/2 gap-4">
          <h1 className="text-lg font-bold text-white">NIAT</h1>
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

          <p className="text-sm text-neutral-300">
            Built by the Naval Institute of Aeronautical Technology, Kochi —
            empowering learners with practical engineering and innovation.
          </p>
          <p className="text-sm text-neutral-300">
            Established in 1956 under Southern Naval Command, advancing
            aeronautical education and applied research.
          </p>
          <p className="text-xs text-neutral-300">
            © 2025 NIAT. All rights reserved.
          </p>
        </div>
        <div className="flex flex-col justify-between  w-full text-right gap-6 md:gap-4">
          <div className="flex flex-col md:flex-row justify-between gap-6 md:gap-4">
            <div className="flex flex-col w-full  gap-4">
              <h1 className="text-lg font-bold text-white">Contact us</h1>
              <p className="text-sm text-neutral-300">
                Email: wingmanai.contact@gmail.com
              </p>
              <p className="text-sm text-neutral-300">Phone: +91 9876543210</p>
              <p className="text-sm text-neutral-300">
                Address: INS Garuda, Naval Base, Kochi 682004, Kerala
              </p>
            </div>
            
          </div>
          <div className="flex text-right  flex-col gap-4">
            <h1 className="text-lg  font-bold text-white">Socials</h1>
            <div className="flex  text-neutral-300 gap-6 text-xl justify-end">
              <SiGmail className="cursor-pointer  hover:text-navy transition-colors" />
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
