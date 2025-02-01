import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Header";
import { VideoDisplay } from "../components/VideoDisplay";
import { useCamera } from "../hooks/useCamera";
import toast from "react-hot-toast";

export default function FaceIdentification() {
	const hasShownError = useRef(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [, setConsecutiveErrors] = useState(0);
	const navigate = useNavigate();

	const handleError = useCallback(
		(errorMessage: string) => {
			if (hasShownError.current) return;

			setError(errorMessage);
			setConsecutiveErrors((prev) => {
				const newCount = prev + 1;
				if (newCount >= 3) {
					hasShownError.current = true;
					toast.error(error, {
						duration: 3000,
						style: {
							background: "#272727",
							color: "#fff",
							borderRadius: "8px",
						},
					});
					navigate("/");
				}
				return newCount;
			});
		},
		[navigate, error],
	);

	useEffect(() => {
		hasShownError.current = false;
		return () => {
			hasShownError.current = false;
		};
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
				} else {
					handleError(
						"Не удалось подтвердить личность. Пожалуйста, убедитесь, что вы зарегистрированный пользователь или свяжитесь с администрацией.",
					);
				}
			} catch (err) {
				handleError(
					"Ошибка при проверке лица. Пожалуйста, попробуйте снова или свяжитесь с администрацией.",
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
	});

	const errorMessage = isProcessing
		? "Проверка..."
		: cameraError || error || "Сканируйте своё лицо для подтверждения";

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

				<VideoDisplay ref={videoRef} isProcessing={isProcessing} />

				<canvas ref={canvasRef} style={{ display: "none" }} />
			</div>
		</div>
	);
}
