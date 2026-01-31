import { motion } from "framer-motion";
import { useElevenLabs } from "@/contexts/ElevenLabsContext";

const JarvisCore = () => {
  const { status, isSpeaking, isConnecting, isListening, toggleConversation } = useElevenLabs();
  const isActive = status === "connected";
  const isProcessing = isActive && !isSpeaking && !isListening;

  // Dynamic glow intensity based on state
  const getGlowStyle = () => {
    if (isSpeaking) {
      return {
        boxShadow: `
          0 0 30px hsl(195 100% 50% / 0.9),
          0 0 60px hsl(195 100% 50% / 0.6),
          0 0 100px hsl(195 100% 50% / 0.4),
          0 0 150px hsl(195 100% 50% / 0.2),
          inset 0 0 40px hsl(195 100% 50% / 0.4)
        `,
      };
    }
    if (isActive) {
      return {
        boxShadow: `
          0 0 40px hsl(120 100% 50% / 0.9),
          0 0 80px hsl(120 100% 50% / 0.6),
          0 0 120px hsl(120 100% 50% / 0.4),
          0 0 180px hsl(120 100% 50% / 0.2),
          inset 0 0 50px hsl(120 100% 50% / 0.5)
        `,
      };
    }
    if (isConnecting) {
      return {
        boxShadow: `
          0 0 25px hsl(45 100% 50% / 0.8),
          0 0 50px hsl(45 100% 50% / 0.5),
          0 0 80px hsl(45 100% 50% / 0.3),
          inset 0 0 30px hsl(45 100% 50% / 0.3)
        `,
      };
    }
    return {
      boxShadow: `
        0 0 30px hsl(195 100% 50% / 0.8),
        0 0 60px hsl(195 100% 50% / 0.5),
        0 0 100px hsl(195 100% 50% / 0.3),
        inset 0 0 30px hsl(195 100% 50% / 0.3)
      `,
    };
  };

  const getCoreGradient = () => {
    if (isConnecting) {
      return "radial-gradient(circle at 30% 30%, hsl(45 100% 75%), hsl(45 100% 55%) 50%, hsl(45 100% 40%) 100%)";
    }
    if (isActive) {
      return "radial-gradient(circle at 30% 30%, hsl(120 100% 75%), hsl(120 100% 55%) 50%, hsl(120 100% 40%) 100%)";
    }
    return "radial-gradient(circle at 30% 30%, hsl(195 100% 75%), hsl(195 100% 55%) 50%, hsl(195 100% 40%) 100%)";
  };

  return (
    <button
      onClick={toggleConversation}
      className="relative flex items-center justify-center focus:outline-none cursor-pointer group pointer-events-auto"
      aria-label={isActive ? "End conversation" : "Start conversation"}
    >
      {/* Outer glow ring - enhanced when active */}
      <motion.div
        className="absolute w-44 h-44 rounded-full"
        style={{
          background: isActive 
            ? "radial-gradient(circle, hsl(120 100% 50% / 0.15) 0%, transparent 70%)"
            : "radial-gradient(circle, hsl(195 100% 50% / 0.1) 0%, transparent 70%)",
        }}
        animate={{
          scale: isActive ? [1, 1.4, 1] : [1, 1.2, 1],
          opacity: isActive ? [0.7, 1, 0.7] : [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: isActive ? 0.8 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Middle glow ring */}
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: isActive
            ? "radial-gradient(circle, hsl(120 100% 50% / 0.25) 0%, transparent 70%)"
            : "radial-gradient(circle, hsl(195 100% 50% / 0.2) 0%, transparent 70%)",
        }}
        animate={{
          scale: isActive ? [1, 1.3, 1] : [1, 1.1, 1],
          opacity: isActive ? [0.9, 1, 0.9] : [0.6, 1, 0.6],
        }}
        transition={{
          duration: isActive ? 0.6 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Speaking indicator ring - pulsing outward */}
      {isSpeaking && (
        <>
          <motion.div
            className="absolute w-24 h-24 rounded-full border-2 border-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className="absolute w-24 h-24 rounded-full border border-primary/50"
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.15,
            }}
          />
        </>
      )}

      {/* Processing rotation ring */}
      {isProcessing && !isSpeaking && (
        <motion.div
          className="absolute w-28 h-28 rounded-full"
          style={{
            border: "2px dashed hsl(120 100% 50% / 0.6)",
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      {/* Core with dynamic neon glow */}
      <motion.div
        className="relative w-20 h-20 rounded-full transition-all duration-300 group-hover:scale-105"
        style={{
          background: getCoreGradient(),
          ...getGlowStyle(),
        }}
        animate={{
          scale: isSpeaking 
            ? [1, 1.12, 1.05, 1.1, 1] 
            : isActive 
            ? [1, 1.1, 1] 
            : [1, 1.05, 1],
          rotate: isProcessing && !isSpeaking ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          scale: {
            duration: isSpeaking ? 0.4 : isActive ? 0.8 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      >
        {/* Inner highlight */}
        <motion.div
          className="absolute top-2 left-3 w-6 h-4 rounded-full"
          style={{
            background: "radial-gradient(ellipse, hsl(0 0% 100% / 0.7), transparent)",
          }}
          animate={{
            opacity: isSpeaking ? [0.5, 0.8, 0.5] : [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: isSpeaking ? 0.3 : 1.5,
            repeat: Infinity,
          }}
        />

        {/* Secondary inner glow for depth */}
        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 40%, transparent 30%, hsl(0 0% 0% / 0.3) 100%)",
          }}
        />
      </motion.div>

      {/* Status text */}
      <motion.div
        className="absolute -bottom-10 text-xs font-mono tracking-widest"
        style={{
          color: isActive 
            ? "hsl(120 100% 50%)" 
            : isConnecting 
            ? "hsl(45 100% 50%)" 
            : "hsl(195 60% 50%)",
          textShadow: isActive 
            ? "0 0 10px hsl(120 100% 50% / 0.8)"
            : isConnecting
            ? "0 0 10px hsl(45 100% 50% / 0.8)"
            : "0 0 10px hsl(195 100% 50% / 0.5)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {isConnecting 
          ? "INITIALIZING..." 
          : isSpeaking 
          ? "JARVIS SPEAKING" 
          : isListening
          ? "LISTENING..."
          : isActive 
          ? "PROCESSING..." 
          : "CLICK TO TALK"}
      </motion.div>
    </button>
  );
};

export default JarvisCore;
