import { useHealthCheck } from "../hooks/useHealthCheck";
import Header from "../components/Header";
import LoadingCircle from "../components/LoadingCircle";
import { STATES } from "../constants";
import { motion, AnimatePresence } from "framer-motion";
import type { Icon } from "@phosphor-icons/react";

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1 },
	},
};

const itemVariants = {
	hidden: { y: 20, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
		transition: { type: "spring", stiffness: 300, damping: 20 },
	},
};

export default function HealthCheck() {
	const MAX_STABILITY_TIME = 7;

	const { currentState, stabilityTime, bpmData, handleComplete } =
		useHealthCheck();

	const state = STATES[currentState] as {
		title: string;
		subtitle: string;
		icon: Icon;
		value: string;
		unit: string;
	};

	return (
		<div className="min-h-screen bg-black text-white flex flex-col">
			<Header />

			<motion.div
				className="flex-1 flex flex-col items-center justify-center p-6"
				variants={containerVariants}
			>
				<AnimatePresence mode="wait">
					<motion.div
						key={currentState}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3 }}
						className="text-center"
					>
						<motion.h1
							className="text-xl md:text-2xl font-medium mb-2"
							variants={itemVariants}
						>
							{state.title}
						</motion.h1>
						<motion.p
							className="text-gray-400 mb-12"
							variants={itemVariants}
						>
							{state.subtitle}
						</motion.p>
						{/* Display BPM or mock data */}
						{bpmData && (
							<div className="text-sm text-gray-300">
								Current BPM: {bpmData?.bpm} | Finger Detected:{" "}
								{bpmData.fingerDetected ? "Yes" : "No"}
							</div>
						)}
					</motion.div>
				</AnimatePresence>

				{/* LoadingCircle with Background Progress */}
				<LoadingCircle
					key={currentState}
					icon={state.icon}
					value={bpmData ? bpmData.bpm.toString() : state.value} // Show BPM or mock value
					unit={state.unit}
					progress={(stabilityTime / MAX_STABILITY_TIME) * 100} // Progress in percentage
					onComplete={handleComplete}
				/>

				<motion.div
					className="fixed bottom-8 left-0 right-0 flex justify-center gap-4 px-6"
					variants={containerVariants}
				>
					{Object.entries(STATES).map(([key, { icon: Icon }]) => (
						<motion.div
							key={key}
							variants={itemVariants}
							className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center ${
								currentState === key
									? "bg-[#5096FF]"
									: "bg-[#272727]"
							}`}
						>
							<Icon
								weight="bold"
								className="w-5 h-5 md:w-6 md:h-6"
							/>
						</motion.div>
					))}
				</motion.div>
			</motion.div>
		</div>
	);
}
