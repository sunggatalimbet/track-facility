import { useState, useEffect, useRef, useCallback } from "react";

interface UseCameraProps {
	onFrame: (imageData: string) => Promise<void>;
}

export const useCamera = ({ onFrame }: UseCameraProps) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const intervalRef = useRef<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [useRpiCamera, setUseRpiCamera] = useState(false);

	const captureFrame = useCallback(async () => {
		if (useRpiCamera) {
			try {
				const response = await fetch(
					`${import.meta.env.VITE_SERVER_URL}/api/camera/capture`,
				);
				const data = await response.json();

				if (data.success) {
					await onFrame(data.image);
				}
			} catch (err) {
				console.error("RPi camera error:", err);
				setError("Ошибка при получении изображения с камеры");
			}
			return;
		}

		if (!canvasRef.current || !videoRef.current) return;
		const canvas = canvasRef.current;
		const video = videoRef.current;

		canvas.width = 640;
		canvas.height = 480;
		const context = canvas.getContext("2d");
		if (!context) return;

		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		const imageData = canvas.toDataURL("image/jpeg", 0.8);
		await onFrame(imageData);
	}, [onFrame, useRpiCamera]);

	useEffect(() => {
		let mounted = true;
		const currentVideoRef = videoRef.current;

		async function setupCamera() {
			try {
				console.log("Инициализация камеры...");

				// Проверяем доступные устройства
				const devices = await navigator.mediaDevices.enumerateDevices();
				const videoDevices = devices.filter(
					(device) => device.kind === "videoinput",
				);

				if (videoDevices.length === 0) {
					console.log(
						"Веб-камеры не найдены, переключаемся на RPi камеру",
					);
					setUseRpiCamera(true);
					if (mounted) {
						intervalRef.current = window.setInterval(
							captureFrame,
							1000,
						);
					}
					return;
				}

				// Остальной код для веб-камеры...
				// ... (оставляем существующий код для веб-камеры)
			} catch (err) {
				console.log("Ошибка веб-камеры, пробуем RPi камеру", err);
				setUseRpiCamera(true);
				if (mounted) {
					intervalRef.current = window.setInterval(
						captureFrame,
						1000,
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
			if (!useRpiCamera && currentVideoRef?.srcObject) {
				const stream = currentVideoRef.srcObject as MediaStream;
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, [captureFrame, useRpiCamera]);

	// Если используется RPi камера, видео элемент не нужен
	if (useRpiCamera) {
		return {
			videoRef: null,
			canvasRef,
			error,
			isRpiCamera: true,
		};
	}

	return {
		videoRef,
		canvasRef,
		error,
		isRpiCamera: false,
	};
};
