import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { VideoDisplay } from "../components/VideoDisplay";
import { useCamera } from "../hooks/useCamera";

const ERROR_LIMIT = 5;
const BLOCK_DURATION = 30000; // 30 seconds block
const OVERLAY_DURATION = 5000; // 5 seconds overlay display

export default function FaceIdentification() {
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [consecutiveErrors, setConsecutiveErrors] = useState(0);
	const [isBlocked, setIsBlocked] = useState(false);
	const [showErrorOverlay, setShowErrorOverlay] = useState(false);
	const navigate = useNavigate();

	const handleError = useCallback((errorMessage: string) => {
		setError(errorMessage);
		console.log(consecutiveErrors);
		setConsecutiveErrors((prev) => {
			const newCount = prev + 1;
			if (newCount >= ERROR_LIMIT) {
				setShowErrorOverlay(true);
				setIsBlocked(true);
				setTimeout(() => {
					setIsBlocked(false);
					setConsecutiveErrors(0);
				}, BLOCK_DURATION);
				return 0;
			}
			return newCount;
		});
	}, []);

	const handleFrame = useCallback(
		async (imageData: string) => {
			if (isProcessing) return;

			try {
				setIsProcessing(true);
				const response = await fetch(
					`${import.meta.env.VITE_SERVER_URL}/api/verify-face`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ image: imageData }),
					},
				);

				const data = await response.json();

				if (data.matched) {
					setConsecutiveErrors(0);
					localStorage.setItem("faceId", data.faceId);
					navigate("/health-check");
				} else if (data.error === "No face detected in image") {
					handleError(
						"Лицо не обнаружено в кадре. Пожалуйста, убедитесь, что ваше лицо находится в центре кадра и хорошо освещено.",
					);
				} else if (!data.matched) {
					handleError(
						"Не удалось подтвердить личность. Пожалуйста, убедитесь, что вы зарегистрированный пользователь.",
					);
				}
			} catch (err) {
				handleError(
					"Ошибка при проверке лица. Пожалуйста, попробуйте снова.",
				);
				console.error("Error verifying face:", err);
			} finally {
				setIsProcessing(false);
			}
		},
		[isProcessing, navigate, handleError],
	);

	const {
		videoRef,
		canvasRef,
		error: cameraError,
	} = useCamera({
		onFrame: handleFrame,
		isBlocked,
	});

	// Reset error overlay after duration
	useEffect(() => {
		let timeoutId: number;
		if (showErrorOverlay) {
			timeoutId = window.setTimeout(() => {
				setShowErrorOverlay(false);
			}, OVERLAY_DURATION);
		}
		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [showErrorOverlay]);

	const errorMessage = isProcessing
		? "Проверка..."
		: isBlocked
		? "Проверка временно заблокирована. Пожалуйста, подождите."
		: cameraError || error || "Сканируйте своё лицо для подтверждения";

	const errorOverlayMessage =
		"Превышено количество попыток идентификации. Система будет заблокирована на 30 секунд. Пожалуйста, убедитесь, что вы находитесь в хорошо освещенном месте и ваше лицо четко видно в камере.";

	return (
		<div className="min-h-screen bg-black text-white flex flex-col">
			<Header />

			<div className="flex-1 flex flex-col items-center justify-center p-6">
				<motion.h1
					className="text-2xl font-medium mb-2"
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
				>
					Распознавание лица
				</motion.h1>

				<motion.p
					className="text-center text-gray-400 mb-8"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
				>
					{errorMessage}
				</motion.p>

				<VideoDisplay
					ref={videoRef}
					isProcessing={isProcessing}
					showErrorOverlay={showErrorOverlay}
					errorMessage={errorOverlayMessage}
				/>

				<canvas ref={canvasRef} style={{ display: "none" }} />
			</div>
		</div>
	);
}
