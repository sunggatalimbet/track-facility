import { useState, useEffect, useRef, useCallback } from "react";

interface UseCameraProps {
	onFrame: (imageData: string) => Promise<void>;
}

export const useCamera = ({ onFrame }: UseCameraProps) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const intervalRef = useRef<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	const captureFrame = useCallback(async () => {
		if (!canvasRef.current || !videoRef.current) return;

		const canvas = canvasRef.current;
		const video = videoRef.current;

		canvas.width = 640;
		canvas.height = 480;

		const context = canvas.getContext("2d");
		if (!context) return;

		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		const imageData = canvas.toDataURL("image/jpeg", 0.6);

		await onFrame(imageData);
	}, [onFrame]);

	useEffect(() => {
		let mounted = true;
		const currentVideoRef = videoRef.current;

		async function setupCamera() {
			try {
				console.log("Попытка доступа к камере...");
				const devices = await navigator.mediaDevices.enumerateDevices();
				console.log("Доступные устройства:", devices);

				const stream = await navigator.mediaDevices.getUserMedia({
					video: {
						facingMode: "user",
						width: { ideal: 640 },
						height: { ideal: 480 },
					},
				});

				console.log(
					"Получен поток с камеры:",
					stream.getVideoTracks()[0].label,
				);

				if (currentVideoRef && mounted) {
					currentVideoRef.srcObject = stream;
				}

				if (mounted) {
					intervalRef.current = window.setInterval(
						captureFrame,
						1000,
					);
				}
			} catch (err) {
				if (mounted) {
					const errorMessage =
						err instanceof Error ? err.message : String(err);
					console.error("Подробная ошибка подключения камеры:", {
						error: err,
						message: errorMessage,
						name:
							err instanceof Error
								? err.name
								: "Неизвестная ошибка",
					});
					setError(
						`Ошибка доступа к камере: ${errorMessage}. Пожалуйста, проверьте разрешения.`,
					);
				}
			}
		}

		setupCamera();

		return () => {
			mounted = false;
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			if (currentVideoRef?.srcObject) {
				const videoStream = currentVideoRef.srcObject as MediaStream;
				videoStream
					.getTracks()
					.forEach((track: MediaStreamTrack) => track.stop());
			}
		};
	}, [captureFrame]);

	return {
		videoRef,
		canvasRef,
		error,
	};
};
