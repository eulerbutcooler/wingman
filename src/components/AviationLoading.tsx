"use client";

const INDIAN_DEFENCE_AVIATION_FACTS = [
  "The Indian Air Force was raised on 8 October 1932, and over the decades it has evolved from a small auxiliary force into one of the world’s largest and most capable air arms, with responsibilities that include air defence, strategic reach, humanitarian support, and networked joint operations.",
  "The Su-30MKI, built for India with significant customisation, combines long range, heavy payload, and high agility, making it central to deterrence missions, deep strike planning, and sustained air dominance patrols across multiple theatres.",
  "HAL Tejas represents a major step in India’s indigenous aerospace ecosystem, combining domestic design, production, and systems integration while improving national capability in fighter development, fleet sustainment, and long-term defence self-reliance.",
  "The induction of Rafale fighters in 2020 significantly boosted precision-strike and beyond-visual-range combat capability, while also improving sensor fusion, survivability, and rapid mission readiness for complex operational requirements.",
  "India’s Netra AEW&C platform expands airborne situational awareness by detecting, tracking, and coordinating threats over wide areas, enabling faster command decisions and stronger integration between airborne assets and ground-based control networks.",
  "The C-17 Globemaster III provides India with true strategic airlift power, allowing rapid movement of troops, heavy equipment, and relief material over long distances, especially during urgent military deployments and disaster response operations.",
  "The C-130J Super Hercules is heavily used for special operations, tactical insertion, and difficult-airfield missions, giving India flexible options for high-tempo logistics, precision support tasks, and rapid response in challenging terrain.",
  "Astra, India’s indigenous beyond-visual-range air-to-air missile, strengthens sovereign combat capability by enabling long-range interception while reducing dependency on foreign munitions in critical operational scenarios.",
  "HAL Prachand, India’s dedicated Light Combat Helicopter, is optimized for high-altitude warfare and armed reconnaissance, giving forces improved support in mountainous sectors where performance, agility, and quick-response firepower are essential.",
  "Large-force drills such as Exercise Gagan Shakti demonstrate the Indian Air Force’s ability to coordinate multi-platform operations at scale, validating readiness, logistics endurance, and inter-command execution under realistic stress conditions.",
];

function getRandomFact() {
  const index = Math.floor(Math.random() * INDIAN_DEFENCE_AVIATION_FACTS.length);
  return INDIAN_DEFENCE_AVIATION_FACTS[index];
}

export default function AviationLoading() {
  const fact = getRandomFact();

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-gradient-to-b from-sky-50 via-white to-blue-50"></div>
      <div className="fixed inset-0 bg-white/30 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden">
          <div className="wind wind-1"></div>
          <div className="wind wind-2"></div>
          <div className="wind wind-3"></div>
          <div className="plane">✈️</div>
        </div>

        <p className="mt-4 text-sm md:text-base text-slate-800 text-center leading-relaxed max-w-xl px-2">
          &quot;{fact}&quot;
        </p>

        <p className="mt-3 text-xs md:text-sm font-semibold tracking-wide text-blue-700/90">
          Loading mission data...
        </p>
      </div>

      <style jsx>{`
        .plane {
          position: relative;
          z-index: 2;
          font-size: 4.5rem;
          transform: rotate(0deg);
          animation: plane-bounce 1.35s ease-in-out infinite;
          filter: drop-shadow(0 8px 10px rgba(15, 23, 42, 0.18));
        }

        .wind {
          position: absolute;
          height: 2px;
          border-radius: 9999px;
          background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.7), transparent);
          width: 180px;
          animation: wind-pass 1.6s linear infinite;
          opacity: 0.8;
        }

        .wind-1 {
          top: 32%;
          animation-delay: 0s;
        }

        .wind-2 {
          top: 50%;
          width: 220px;
          animation-delay: 0.35s;
        }

        .wind-3 {
          top: 68%;
          width: 160px;
          animation-delay: 0.7s;
        }

        @keyframes plane-bounce {
          0%,
          100% {
            transform: translateY(2px);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes wind-pass {
          0% {
            transform: translateX(-220px);
            opacity: 0;
          }
          20% {
            opacity: 0.85;
          }
          80% {
            opacity: 0.85;
          }
          100% {
            transform: translateX(220px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
