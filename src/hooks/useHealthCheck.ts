import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { StateKey } from "../constants";

const MAX_STABILITY_TIME = 7; // 7 seconds for full stability

export const useHealthCheck = () => {
	const navigate = useNavigate();
	const [currentState, setCurrentState] = useState<StateKey>("PULSE");
	const [stabilityTime, setStabilityTime] = useState(0);
	const [bpmData, setBpmData] = useState<null | {
		bpm: string;
	}>(null);
	const [temperatureData, setTemperatureData] = useState<null | {
		temperature: string;
	}>(null);
	const [alcoholData, setAlcoholData] = useState<null | {
		alcoholLevel: string;
	}>(null);

	useEffect(() => {
		const socket = io("http://localhost:3000", {
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

		socket.on("heartbeat", (data) => {
			if (currentState === "PULSE") {
				lastDataReceivedTime = Date.now();
				setBpmData(data);
				setStabilityTime((prev) =>
					Math.min(prev + 1, MAX_STABILITY_TIME),
				);
			}
		});

		socket.on("temperature", (data) => {
			if (currentState === "TEMPERATURE") {
				lastDataReceivedTime = Date.now();
				setTemperatureData(data);
				setStabilityTime((prev) =>
					Math.min(prev + 1, MAX_STABILITY_TIME),
				);
			}
		});

		socket.on("alcohol", (data) => {
			if (currentState === "ALCOHOL") {
				lastDataReceivedTime = Date.now();
				setAlcoholData(data);
				setStabilityTime((prev) =>
					Math.min(prev + 1, MAX_STABILITY_TIME),
				);
			}
		});

		return () => {
			socket.disconnect();
			clearInterval(interval);
		};
	}, [currentState]);

	const handleComplete = useCallback(() => {
		const sequence: StateKey[] = ["PULSE", "TEMPERATURE", "ALCOHOL"];
		const currentIndex = sequence.indexOf(currentState);

		if (currentIndex < sequence.length - 1) {
			setCurrentState(sequence[currentIndex + 1]);
			setStabilityTime(0);
		} else {
			navigate("/complete-authentication", {
				state: { success: true },
			});
		}
	}, [currentState, navigate]);

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
