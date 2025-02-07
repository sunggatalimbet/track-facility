import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Heart, Thermometer, Wine } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";

interface AlcoholData {
	sensorStatus: string;
	sensorReady: boolean;
	alcoholLevel: string | null;
	pinStates: {
		ready: number;
		sober: number;
		drunk: number;
		power: number;
	};
}

function Home() {
	const [time, setTime] = useState(new Date());
	const [isChecking, setIsChecking] = useState(false);
	const [alcoholData, setAlcoholData] = useState<AlcoholData | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const timer = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const handleDoorOpen = () => {
		setIsChecking(true);
		const socket = io(import.meta.env.VITE_SERVER_URL);

		socket.on("alcohol", (data) => {
			setAlcoholData(data);
			if (data.alcoholLevel !== null) {
				socket.disconnect();
				setIsChecking(false);
				navigate("/face-identification");
			}
		});

		socket.on("connect_error", (error) => {
			console.error("Socket connection error:", error);
			setIsChecking(false);
		});

		return () => {
			socket.disconnect();
		};
	};

	const formattedDate = format(time, "EEEE, dd.MM", { locale: ru });
	const formattedTime = format(time, "HH:mm");

	return (
		<div className="w-full min-h-screen bg-black text-white flex self-center flex-col">
			<div className="h-24 w-24">
				<img src="/logo.jpg" alt="Logo" className="w-full h-full" />
			</div>

			<div className="flex-1 flex flex-col items-center justify-center">
				<motion.h1
					className="text-[100px] font-medium leading-tight"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
				>
					{formattedTime}
				</motion.h1>
				<motion.p
					className="text-[36px] font-medium mb-8 text-center"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
				>
					{formattedDate}
				</motion.p>

				<div className="flex gap-4 mb-12">
					{[Heart, Thermometer, Wine].map((Icon, index) => (
						<motion.div
							key={index}
							className={`w-10 h-10 md:w-12 md:h-12 bg-[#272727] rounded-full flex items-center justify-center ${
								isChecking && index === 2
									? "animate-pulse bg-[#5096FF]"
									: ""
							}`}
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.4 + index * 0.1 }}
						>
							<Icon size={20} className="md:w-6 md:h-6" />
						</motion.div>
					))}
				</div>

				{alcoholData && (
					<div className="mb-4 text-sm">
						<p>Status: {alcoholData.sensorStatus}</p>
						<p>Ready: {alcoholData.sensorReady ? "Yes" : "No"}</p>
						{alcoholData.pinStates && (
							<div className="text-xs text-gray-400">
								Sober:{" "}
								{alcoholData.pinStates.sober ? "HIGH" : "LOW"} |
								Drunk:{" "}
								{alcoholData.pinStates.drunk ? "HIGH" : "LOW"}
							</div>
						)}
					</div>
				)}
			</div>

			<motion.button
				className={`w-full py-4 ${
					isChecking ? "bg-gray-500" : "bg-[#5096FF]"
				} rounded-full text-white text-lg font-medium relative`}
				onClick={handleDoorOpen}
				disabled={isChecking}
				whileHover={{ scale: isChecking ? 1 : 1.02 }}
				whileTap={{ scale: isChecking ? 1 : 0.98 }}
			>
				{isChecking ? (
					<>
						<span className="opacity-50">Подождите...</span>
						<motion.div
							className="absolute inset-0 flex items-center justify-center"
							animate={{ rotate: 360 }}
							transition={{
								duration: 1,
								repeat: Infinity,
								ease: "linear",
							}}
						>
							<div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
						</motion.div>
					</>
				) : (
					"открыть дверь"
				)}
			</motion.button>
		</div>
	);
}

export default Home;
