import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Heart, Thermometer, Wine } from "@phosphor-icons/react";
import { motion } from "framer-motion";

function Home() {
	const [time, setTime] = useState(new Date());
	const navigate = useNavigate();

	useEffect(() => {
		const timer = setInterval(() => setTime(new Date()), 1000);
		return () => clearInterval(timer);
	}, []);

	const formattedDate = format(time, "EEEE, dd.MM", { locale: ru });
	const formattedTime = format(time, "HH:mm");

	return (
		<div className="w-full min-h-screen bg-black text-white flex self-center flex-col">
			<div className="h-12 w-12">
				<img
					src="/placeholder-logo.svg"
					alt="Logo"
					className="w-full h-full"
				/>
			</div>

			<div className="flex-1 flex flex-col items-center justify-center">
				<motion.h1
					className="text-[100px]  font-medium leading-tight"
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
							className="w-10 h-10 md:w-12 md:h-12 bg-[#272727] rounded-full flex items-center justify-center"
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.4 + index * 0.1 }}
						>
							<Icon size={20} className="md:w-6 md:h-6" />
						</motion.div>
					))}
				</div>
			</div>

			<motion.button
				className="w-full py-4 bg-[#5096FF] rounded-full text-white text-lg font-medium"
				onClick={() => navigate("/face-identification")}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
			>
				открыть дверь
			</motion.button>
		</div>
	);
}

export default Home;
