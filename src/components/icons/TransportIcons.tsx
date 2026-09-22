import React from 'react';

/**
 * Custom High-Fidelity SVG Icon for Philippine Motorized Tricycle
 * Features: Motorcycle front fork, windshield, engine housing, passenger sidecar with roof and wheel.
 */
export const MotorizedTricycleIcon: React.FC<{ className?: string; size?: number }> = ({ 
  className = 'w-6 h-6',
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Sidecar Roof / Canopy */}
      <path 
        d="M4 14C4 12.8954 4.89543 12 6 12H24C25.1046 12 26 12.8954 26 14V17H4V14Z" 
        fill="currentColor" 
        fillOpacity="0.25"
      />
      <path 
        d="M4 14C4 12.8954 4.89543 12 6 12H24C25.1046 12 26 12.8954 26 14V17H4V14Z" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Sidecar Pillars */}
      <path d="M7 17V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M23 17V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Sidecar Body Tub */}
      <path 
        d="M4 25H25C26.1046 25 27 25.8954 27 27V33C27 34.6569 25.6569 36 24 36H7C5.34315 36 4 34.6569 4 33V25Z" 
        fill="currentColor" 
        fillOpacity="0.2"
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinejoin="round"
      />
      
      {/* Sidecar Passenger Window Opening */}
      <path d="M9 20H21V25H9V20Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Sidecar Wheel */}
      <circle cx="12" cy="37" r="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="12" cy="37" r="2" fill="currentColor" />

      {/* Motorcycle Frame & Connection to Sidecar */}
      <path d="M26 30H32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Motorcycle Handlebars & Front Fork */}
      <path d="M41 18L44 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40 18L36 26L39 37" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Motorcycle Windshield */}
      <path d="M40 18C41 15 39 13 37 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Motorcycle Tank & Seat */}
      <path d="M30 26C31 24 34 24 36 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Engine Block */}
      <rect x="31" y="28" width="6" height="5" rx="1.5" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Motorcycle Front Wheel */}
      <circle cx="39" cy="37" r="5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="39" cy="37" r="2" fill="currentColor" />

      {/* Headlight Beam Sparkle */}
      <path d="M42 22L46 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M41 25L45 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

/**
 * Custom High-Fidelity SVG Icon for Philippine Pedicab (Trisikad)
 * Features: Bicycle diamond frame, pedal crank with pedals, bicycle saddle, passenger sidecar with curved canvas canopy, spoke wheels.
 */
export const PedicabIcon: React.FC<{ className?: string; size?: number }> = ({ 
  className = 'w-6 h-6',
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Trisikad Curved Fabric Canopy (Roof) */}
      <path 
        d="M5 14C5 11 8 9.5 15 9.5C22 9.5 25 11 25 14C25 15 24 15.5 22 15.5H8C6 15.5 5 15 5 14Z" 
        fill="currentColor" 
        fillOpacity="0.25"
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      {/* Canopy Support Bars */}
      <path d="M8 15.5V26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 15.5V26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      
      {/* Passenger Sidecar Basket/Seat */}
      <path 
        d="M5 25H25C26 25 26.5 26 26.5 27.5L25 34C24.5 35.5 23 36.5 21.5 36.5H7.5C6 36.5 5 35.5 4.5 34L3.5 27.5C3.5 26 4 25 5 25Z" 
        fill="currentColor" 
        fillOpacity="0.18"
        stroke="currentColor" 
        strokeWidth="2.2" 
        strokeLinejoin="round"
      />

      {/* Sidecar Wheel */}
      <circle cx="11" cy="37" r="5.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M11 31.5V42.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.5 37H16.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="11" cy="37" r="1.5" fill="currentColor" />

      {/* Sidecar Coupling Strut to Bicycle */}
      <path d="M25 31H30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />

      {/* Bicycle Diamond Frame */}
      {/* Rear Wheel to Bottom Bracket (Chainstay) */}
      <path d="M29 37L36 37" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Bottom Bracket to Seat (Seat Tube) */}
      <path d="M36 37L34 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Bicycle Saddle */}
      <path d="M32 23C32 23 33.5 22 36 22C37.5 22 38 23 38 23" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Bottom Bracket to Headtube (Down Tube) */}
      <path d="M36 37L41 26" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Seat to Headtube (Top Tube) */}
      <path d="M34 26H41" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      {/* Front Fork & Handlebars */}
      <path d="M41 23L42 20M40 20H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M41 23L43 37" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />

      {/* Bicycle Pedal Sprocket & Crank */}
      <circle cx="36" cy="37" r="2.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M34.5 34.5L37.5 39.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />

      {/* Bicycle Front Wheel */}
      <circle cx="43" cy="37" r="5.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M43 31.5V42.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M37.5 37H48.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="43" cy="37" r="1.5" fill="currentColor" />

      {/* Eco Leaf Badge Element floating near pedicab */}
      <path 
        d="M26 12C28 10 32 10.5 32 10.5C32 10.5 32.5 14.5 30.5 16.5C28.5 18.5 25.5 18 25.5 18C25.5 18 24 14 26 12Z" 
        fill="currentColor" 
        fillOpacity="0.6"
      />
      <path d="M26 17L29.5 13" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
};
