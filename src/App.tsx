import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import FaceIdentification from "./pages/FaceIdentification";
import HealthCheck from "./pages/HealthCheck";
import CompleteAuthentication from "./pages/CompleteAuthentication";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Home />} />
				<Route
					path="/face-identification"
					element={<FaceIdentification />}
				/>
				<Route path="/health-check" element={<HealthCheck />} />
				<Route
					path="/complete-authentication"
					element={<CompleteAuthentication />}
				/>
			</Routes>
		</Router>
	);
}

export default App;
