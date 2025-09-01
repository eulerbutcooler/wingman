"use client";
import React from "react";
import { motion } from "motion/react";

export default function BorderTracerLoop() {
  return (
    <div className="relative w-64 h-64">
      <motion.svg
        className="absolute top-0 left-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <motion.rect
          x="1"
          y="1"
          width="98"
          height="98"
          rx="8"
          ry="8"
          fill="none"
          stroke="#18CCFC"
          strokeWidth="2"
          strokeDasharray="400" // total perimeter length
          strokeDashoffset="400"
          animate={{ strokeDashoffset: [400, 0] }}
          transition={{
            duration: 4,
            ease: "linear",
            repeat: Infinity,
          }}
        />
      </motion.svg>

      {/* Put your actual content inside this box */}
      
    </div>
  );
}
