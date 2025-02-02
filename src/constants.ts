import {
	// Heart,
	Thermometer,
	Wine,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

export const STATES = {
	// PULSE: {
	// 	title: "Измерение пульса",
	// 	subtitle: "Держите палец на месте",
	// 	icon: Heart as Icon,
	// 	value: "Загрузка...",
	// 	unit: "BPM",
	// },
	TEMPERATURE: {
		title: "Измерение температуры",
		subtitle: "Держите палец на месте",
		icon: Thermometer as Icon,
		value: "Загрузка...",
		unit: "°C",
	},
	ALCOHOL: {
		title: "Измерение уровня алкоголя",
		subtitle: "Держите палец на месте",
		icon: Wine as Icon,
		value: "Загрузка...",
		unit: "MG",
	},
} as const;

export type StateKey = keyof typeof STATES; // "PULSE" | "TEMPERATURE" | "ALCOHOL"
