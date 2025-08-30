'use client';

import React from 'react';
import type { FC, ReactNode } from 'react';

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

const AuroraBackground: FC<AuroraBackgroundProps> = ({ 
  className, 
  children, 
  showRadialGradient = true, 
  ...props 
}) => (
  <div className={cn("relative min-h-screen w-full", className)} {...props}>
    <div className="fixed inset-0 overflow-hidden">
      <div className={cn(
        `pointer-events-none absolute -inset-[10px] opacity-75 blur-[10px] invert filter will-change-transform after:fixed after:inset-0 after:[background-attachment:fixed] after:mix-blend-difference after:content-[""] [background-image:var(--white-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] after:[background-image:var(--white-gradient),var(--aurora)] after:[background-size:200%,_100%] after:animate-aurora`, 
        showRadialGradient && `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
      )}></div>
    </div>
    <div className="relative z-5">
      {children}
    </div>
    <style jsx>{`
      :root {
        --aurora: repeating-linear-gradient(100deg,#3b82f6 10%,#a5b4fc 15%,#93c5fd 20%,#ddd6fe 25%,#60a5fa 30%);
        --dark-gradient: repeating-linear-gradient(100deg,#000 0%,#000 7%,transparent 10%,transparent 12%,#000 16%);
        --white-gradient: repeating-linear-gradient(100deg,#fff 0%,#fff 7%,transparent 10%,transparent 12%,#fff 16%);
      }
      @keyframes aurora {
        from { background-position: 50% 50%, 50% 50%; }
        to { background-position: 350% 50%, 350% 50%; }
      }
      .after\\:animate-aurora::after {
        animation: aurora 60s linear infinite;
      }
    `}</style>
  </div>
);

export default AuroraBackground;
