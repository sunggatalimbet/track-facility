import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoDisplayProps {
	isProcessing: boolean;
	lastFrame?: string | null;
}

export const VideoDisplay = forwardRef<HTMLVideoElement, VideoDisplayProps>(
	({ isProcessing, lastFrame }) => {
		return (
			<motion.div
				className="w-full aspect-[3/4] max-w-md border-2 border-[#5096FF] rounded-3xl overflow-hidden relative"
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ delay: 0.3 }}
			>
				<AnimatePresence mode="wait">
					{lastFrame && (
						<motion.img
							key={lastFrame}
							src={lastFrame}
							alt="Camera Feed"
							className="w-full h-full object-cover"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
						/>
					)}
				</AnimatePresence>

				{(isProcessing || !lastFrame) && (
					<div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
						<div className="w-8 h-8 border-t-2 border-[#5096FF] rounded-full animate-spin" />
					</div>
				)}
			</motion.div>
		);
	},
);

VideoDisplay.displayName = "VideoDisplay";
