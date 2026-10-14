import { useNavigate } from "react-router-dom";
import VenueVideoExperience from "../components/VenueVideoExperience.jsx";

export default function VenueExperiencePage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-black">
      <VenueVideoExperience onClose={() => navigate(-1)} />
    </main>
  );
}
