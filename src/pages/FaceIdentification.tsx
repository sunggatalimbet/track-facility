import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/Header";

export default function FaceIdentification() {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		async function setupCamera() {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: { facingMode: "user" },
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream;
				}
				// Simulate face detection after 3 seconds
				setTimeout(() => {
					navigate("/health-check");
				}, 3000);
			} catch (err) {
				console.error("Error accessing camera:", err);
			}
		}

		setupCamera();

		return () => {
			if (videoRef.current?.srcObject) {
				const videoStream = videoRef.current.srcObject as MediaStream;
				videoStream
					.getTracks()
					.forEach((track: MediaStreamTrack) => track.stop());
			}
		};
	}, [navigate]);

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
					className="text-gray-400 mb-8"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
				>
					Сканируйте своё лицо для подтверждения
				</motion.p>

				<motion.div
					className="w-full aspect-[3/4] max-w-md border-2 border-[#5096FF] rounded-3xl overflow-hidden"
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ delay: 0.3 }}
				>
					<video
						ref={videoRef}
						className="w-full h-full object-cover"
						autoPlay
						playsInline
						muted
					/>
				</motion.div>
			</div>
		</div>
	);
}
