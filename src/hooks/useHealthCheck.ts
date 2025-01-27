import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { StateKey } from "../constants";

const MAX_STABILITY_TIME = 7; // 7 seconds for full stability

export const useHealthCheck = () => {
	const navigate = useNavigate();
	const [currentState, setCurrentState] = useState<StateKey>("PULSE");
	const [stabilityTime, setStabilityTime] = useState(0);
	const [bpmData, setBpmData] = useState<null | { bpm: string }>(null);
	const [temperatureData, setTemperatureData] = useState<null | {
		temperature: string;
	}>(null);
	const [alcoholData, setAlcoholData] = useState<null | {
		alcoholLevel: string;
	}>(null);

	// Add refs to track submission status
	const isSubmitting = useRef(false);
	const socketRef = useRef<Socket | null>(null);

	useEffect(() => {
		socketRef.current = io(import.meta.env.VITE_SERVER_URL, {
			transports: ["websocket"],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		let lastDataReceivedTime = Date.now();

		const updateStability = () => {
			if (Date.now() - lastDataReceivedTime > 1000) {
				setStabilityTime((prev) => Math.max(prev - 1, 0));
			}
		};

		const interval = setInterval(updateStability, 1000);

		socketRef.current.on("heartbeat", (data) => {
			if (currentState === "PULSE") {
				lastDataReceivedTime = Date.now();
				setBpmData(data);
				setStabilityTime((prev) =>
					Math.min(prev + 1, MAX_STABILITY_TIME),
				);
			}
		});

		socketRef.current.on("temperature", (data) => {
			if (currentState === "TEMPERATURE") {
				lastDataReceivedTime = Date.now();
				setTemperatureData(data);
				setStabilityTime((prev) =>
					Math.min(prev + 1, MAX_STABILITY_TIME),
				);
			}
		});

		socketRef.current.on("alcohol", (data) => {
			if (currentState === "ALCOHOL") {
				lastDataReceivedTime = Date.now();
				setAlcoholData(data);
				setStabilityTime((prev) =>
					Math.min(prev + 1, MAX_STABILITY_TIME),
				);
			}
		});

		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
			clearInterval(interval);
		};
	}, [currentState]);

	const handleComplete = useCallback(async () => {
		const sequence: StateKey[] = ["PULSE", "TEMPERATURE", "ALCOHOL"];
		const currentIndex = sequence.indexOf(currentState);

		if (currentIndex < sequence.length - 1) {
			setCurrentState(sequence[currentIndex + 1]);
			setStabilityTime(0);
			return;
		}

		// Prevent duplicate submissions
		if (isSubmitting.current) {
			return;
		}

		isSubmitting.current = true;

		const faceId = localStorage.getItem("faceId");

		try {
			// Disconnect socket before sending data to prevent any race conditions
			if (socketRef.current) {
				socketRef.current.disconnect();
			}

			const response = await fetch(
				`${import.meta.env.VITE_SERVER_URL}/health`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						bpmData,
						temperatureData,
						alcoholData,
						faceId,
					}),
				},
			);

			if (bpmData && temperatureData && alcoholData) {
				localStorage.setItem(
					"results",
					JSON.stringify({
						pulse: bpmData.bpm,
						temperature: temperatureData.temperature,
						alcohol: alcoholData.alcoholLevel,
					}),
				);
			}

			if (!response.ok) {
				throw new Error("Something went wrong.");
			}

			const responseData = await response.json();
			console.log("Data sent successfully:", responseData);

			navigate("/complete-authentication", {
				state: { success: true },
			});
		} catch (error) {
			console.error("Error sending data:", error);
			isSubmitting.current = false; // Reset submission flag on error
		}
	}, [currentState, navigate, bpmData, temperatureData, alcoholData]);

	return {
		currentState,
		stabilityTime,
		bpmData,
		temperatureData,
		alcoholData,
		handleComplete,
		setCurrentState,
	};
};
