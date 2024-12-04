import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/Header";
import LoadingCircle from "../components/LoadingCircle";
import { io } from "socket.io-client";
import { STATES, StateKey } from "../constants";
import { Icon } from "@phosphor-icons/react";

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

type IBpmData = {
	bpm: string;
	fingerDetected: boolean;
};

export default function HealthCheck() {
	const [currentState, setCurrentState] = useState<StateKey>("PULSE");
	const [stabilityTime, setStabilityTime] = useState(0); // Track stable connection time
	const [bpmData, setBpmData] = useState<null | IBpmData>(null); // Stores BPM or other sensor data
	const navigate = useNavigate();
	const MAX_STABILITY_TIME = 7; // 7 seconds for full stability

	useEffect(() => {
		// Create socket connection
		const socket = io("http://localhost:3000", {
			transports: ["websocket"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		let lastDataReceivedTime = Date.now(); // Track the last time data was received
		const updateStability = () => {
			// Gradually decrease stability time when no data is received
			if (Date.now() - lastDataReceivedTime > 1000) {
				setStabilityTime((prev) => Math.max(prev - 1, 0));
			}
		};

		const interval = setInterval(updateStability, 1000);

		// Listen for heartbeat data
		socket.on("heartbeat", (data) => {
			lastDataReceivedTime = Date.now(); // Update the last data received time
			setBpmData(data); // Update BPM or sensor data
			setStabilityTime((prev) => Math.min(prev + 1, MAX_STABILITY_TIME)); // Increment stability time
		});

		// Cleanup on component unmount
		return () => {
			socket.disconnect();
			clearInterval(interval);
		};
	}, []);

	const handleComplete = useCallback(() => {
		const sequence: StateKey[] = ["PULSE", "TEMPERATURE", "ALCOHOL"];
		const currentIndex = sequence.indexOf(currentState);

		if (currentIndex < sequence.length - 1) {
			setCurrentState(sequence[currentIndex + 1]);
			setStabilityTime(0); // Reset stability time for the next state
		} else {
			navigate("/complete-authentication", { state: { success: true } });
		}
	}, [currentState, navigate]);

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
