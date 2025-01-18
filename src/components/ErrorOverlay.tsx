import { motion } from "framer-motion";

interface ErrorOverlayProps {
	message: string;
}

export const ErrorOverlay = ({ message }: ErrorOverlayProps) => {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.8 }}
			transition={{
				duration: 0.5,
				ease: "easeInOut",
			}}
			className="absolute inset-0 flex items-end justify-center"
			style={{
				background: `
          radial-gradient(
            ellipse at center bottom,
            rgba(255,0,0,0.95) 0%,
            rgba(255,0,0,0.8) 30%,
            rgba(255,0,0,0.4) 60%,
            rgba(255,0,0,0) 100%
          )
        `,
			}}
		>
			<motion.div
				initial={{ y: 50, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: 50, opacity: 0 }}
				transition={{ delay: 0.2 }}
				className="p-6 text-center mb-8 max-w-[90%]"
			>
				<p className="text-white font-medium text-lg">{message}</p>
			</motion.div>
		</motion.div>
	);
};
