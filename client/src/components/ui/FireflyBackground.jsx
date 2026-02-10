import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const FireflyBackground = () => {
    const [fireflies, setFireflies] = useState([]);

    useEffect(() => {
        const count = 20; // Number of fireflies
        const newFireflies = Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // Random start X %
            y: Math.random() * 100, // Random start Y %
            size: Math.random() * 4 + 2, // Size between 2px and 6px
            duration: Math.random() * 10 + 10, // Duration between 10s and 20s
            delay: Math.random() * 5 // Delay up to 5s
        }));
        setFireflies(newFireflies);
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {fireflies.map((firefly) => (
                <motion.div
                    key={firefly.id}
                    className="absolute rounded-full bg-yellow-400/30 blur-[1px] shadow-[0_0_10px_2px_rgba(250,204,21,0.2)]"
                    style={{
                        left: `${firefly.x}%`,
                        top: `${firefly.y}%`,
                        width: firefly.size,
                        height: firefly.size,
                    }}
                    animate={{
                        y: [0, -100, 0], // Move up and down gently
                        x: [0, Math.random() * 50 - 25, 0], // Meander horizontally
                        opacity: [0, 1, 0], // Fade in and out
                        scale: [0, 1.2, 0]
                    }}
                    transition={{
                        duration: firefly.duration,
                        repeat: Infinity,
                        delay: firefly.delay,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    );
};

export default FireflyBackground;
