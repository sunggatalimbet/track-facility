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
		const imageData = canvas.toDataURL("image/jpeg", 0.8);
		await onFrame(imageData);
	}, [onFrame]);

	useEffect(() => {
		let mounted = true;
		const currentVideoRef = videoRef.current;

		async function setupCamera() {
			try {
				console.log("Инициализация камеры...");

				// Получаем список всех доступных устройств
				const devices = await navigator.mediaDevices.enumerateDevices();
				const videoDevices = devices.filter(
					(device) => device.kind === "videoinput",
				);
				console.log("Найденные камеры:", videoDevices);

				// Пробуем разные конфигурации камеры
				const constraints = [
					// Сначала пробуем заднюю камеру
					{
						video: {
							facingMode: "environment",
							width: { ideal: 640 },
							height: { ideal: 480 },
							frameRate: { ideal: 30 },
							// Дополнительные настройки для лучшей совместимости
							aspectRatio: { ideal: 1.333333 }, // 4:3
							resizeMode: "crop-and-scale",
						},
					},
					// Затем пробуем первую доступную камеру
					{
						video: {
							deviceId: videoDevices[0]?.deviceId
								? { exact: videoDevices[0].deviceId }
								: undefined,
							width: { ideal: 640 },
							height: { ideal: 480 },
						},
					},
					// В крайнем случае, любую камеру
					{
						video: true,
					},
				];

				let stream: MediaStream | null = null;
				let error: Error | null = null;

				// Пробуем каждую конфигурацию по очереди
				for (const constraint of constraints) {
					try {
						stream = await navigator.mediaDevices.getUserMedia(
							constraint,
						);
						console.log(
							"Успешно подключена камера с настройками:",
							constraint,
						);
						break;
					} catch (e) {
						error = e as Error;
						console.log(
							"Не удалось подключить камеру с настройками:",
							constraint,
						);
					}
				}

				if (!stream) {
					throw error || new Error("Не удалось подключить камеру");
				}

				if (currentVideoRef && mounted) {
					currentVideoRef.srcObject = stream;
					await new Promise((resolve) => {
						if (currentVideoRef) {
							currentVideoRef.onloadedmetadata = resolve;
						}
					});

					// Начинаем захват только после полной загрузки видео
					if (mounted) {
						intervalRef.current = window.setInterval(
							captureFrame,
							1000,
						);
					}
				}
			} catch (err) {
				if (mounted) {
					console.error("Ошибка инициализации камеры:", err);
					setError(
						"Не удалось получить доступ к камере. Пожалуйста, проверьте разрешения и подключение.",
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
				const stream = currentVideoRef.srcObject as MediaStream;
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, [captureFrame]);

	return {
		videoRef,
		canvasRef,
		error,
	};
};
