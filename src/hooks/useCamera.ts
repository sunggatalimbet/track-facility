import {
	useState,
	useEffect,
	useRef,
	// useCallback
} from "react";
import { io, Socket } from "socket.io-client";

interface UseCameraProps {
	onFrame: (imageData: string) => Promise<void>;
}

export const useCamera = ({ onFrame }: UseCameraProps) => {
	// const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const socketRef = useRef<Socket | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [lastFrame, setLastFrame] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		async function setupCamera() {
			try {
				// Подключаемся к WebSocket
				const socket = io(import.meta.env.VITE_SERVER_URL);
				socketRef.current = socket;

				socket.on("connect", () => {
					console.log("Connected to camera socket");
					socket.emit("start-camera");
				});

				socket.on("camera-frame", async (data) => {
					if (!mounted) return;

					if (data.success) {
						setLastFrame(data.image);
						await onFrame(data.image);
					}
				});

				socket.on("camera-error", (errorMessage) => {
					if (!mounted) return;
					console.error("Camera error:", errorMessage);
					setError(errorMessage);
				});

				socket.on("disconnect", () => {
					console.log("Disconnected from camera socket");
				});
			} catch (err) {
				console.error("Error setting up camera:", err);
				setError("Failed to connect to camera");
			}
		}

		setupCamera();

		return () => {
			mounted = false;
			if (socketRef.current) {
				socketRef.current.emit("stop-camera");
				socketRef.current.disconnect();
			}
		};
	}, [onFrame]);

	return {
		videoRef: null,
		canvasRef,
		error,
		isRpiCamera: true,
		lastFrame,
	};
};
