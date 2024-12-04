import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@phosphor-icons/react";

type IconButtonProps = {
	icon: Icon;
	props: any;
};

export default function IconButton({ icon: Icon, ...props }: IconButtonProps) {
	return (
		<motion.div
			className="w-12 h-12 bg-[#272727] rounded-full flex items-center justify-center"
			initial={{ scale: 0 }}
			animate={{ scale: 1 }}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			{...props}
		>
			<Icon size={24} />
		</motion.div>
	);
}
