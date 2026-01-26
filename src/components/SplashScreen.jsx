import { motion } from 'framer-motion';
import { FaPlane, FaBriefcase } from 'react-icons/fa';

const SplashScreen = ({ onComplete }) => {
    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm text-neutral-900 overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Background Elements */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse pointer-events-none"></div>

            {/* Flight Animation */}
            <motion.div
                className="absolute top-1/4 left-[-100px] text-6xl text-primary-500 opacity-60"
                animate={{
                    x: ['-10vw', '110vw'],
                    y: [0, -50, 0],
                    rotate: [0, 10, 0]
                }}
                transition={{
                    duration: 4,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 1
                }}
            >
                <FaPlane />
            </motion.div>

            {/* Briefcase Animation */}
            <motion.div
                className="relative z-10 mb-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.5
                }}
            >
                <div className="relative">
                    <FaBriefcase className="text-9xl text-primary-500 drop-shadow-2xl" />
                    <motion.div
                        className="absolute top-0 left-0 right-0 h-1/2 bg-primary-400 rounded-t-lg origin-bottom"
                        initial={{ rotateX: 0 }}
                        animate={{ rotateX: -30 }} // "Opening" effect
                        transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    />
                </div>
            </motion.div>

            {/* Text Content */}
            <motion.div
                className="text-center z-10 px-4 max-w-2xl"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
            >
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-neutral-900">
                    Welcome to <span className="text-primary-500">YOLO</span>
                </h1>

                <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-neutral-200 shadow-xl mb-8">
                    <p className="text-lg md:text-xl font-medium leading-relaxed mb-4 text-neutral-800">
                        This is the <span className="font-bold text-primary-500">Basic Version</span> of YOLO.
                    </p>
                    <p className="text-base md:text-lg opacity-90 text-neutral-600">
                        The Next Version is under process. Please <span className="font-bold text-primary-500">Pack Your Bags</span> by then to take off with YOLO!
                    </p>
                </div>

                <motion.button
                    onClick={onComplete}
                    className="bg-primary-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-primary-600 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 mx-auto"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.5, type: "spring" }}
                    whileTap={{ scale: 0.95 }}
                >
                    Continue to use Present Version
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </motion.button>
            </motion.div>

        </motion.div>
    );
};

export default SplashScreen;
