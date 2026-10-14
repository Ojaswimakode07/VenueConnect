import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Approximate city-center coordinates for every city in the demo catalog.
// Falls back to India's geographic center if a city isn't in this list.
const CITY_COORDS = {
  "Amravati": [20.9374, 77.7796],
  "Mumbai": [19.0760, 72.8777],
  "New Delhi": [28.6139, 77.2090],
  "Bengaluru": [12.9716, 77.5946],
  "Chennai": [13.0827, 80.2707],
  "Hyderabad": [17.3850, 78.4867],
  "Jaipur": [26.9124, 75.7873],
  "Kolkata": [22.5726, 88.3639],
  "Ahmedabad": [23.0225, 72.5714],
  "Pune": [18.5204, 73.8567],
  "Nagpur": [21.1458, 79.0882],
  "Kochi": [9.9312, 76.2673],
  "Gurugram": [28.4595, 77.0266],
  "Varanasi": [25.3176, 82.9739],
  "Chandigarh": [30.7333, 76.7794],
  "Goa": [15.2993, 74.1240],
  "Indore": [22.7196, 75.8577],
  "Udaipur": [24.5854, 73.7125],
  "Srinagar": [34.0837, 74.7973],
  "Shimla": [31.1048, 77.1734],
  "Amritsar": [31.6340, 74.8723],
  "Rishikesh": [30.0869, 78.2676],
  "Patna": [25.5941, 85.1376],
  "Bhubaneswar": [20.2961, 85.8245],
  "Guwahati": [26.1445, 91.7362],
  "Raipur": [21.2514, 81.6296],
  "Ranchi": [23.3441, 85.3096],
  "Visakhapatnam": [17.6868, 83.2185],
  "Gangtok": [27.3389, 88.6065],
  "Mysuru": [12.2958, 76.6394],
  "Lucknow": [26.8467, 80.9462],
  "Bhopal": [23.2599, 77.4126],
  "Coimbatore": [11.0168, 76.9558],
  "Nashik": [19.9975, 73.7898],
  "Jim Corbett": [29.5320, 78.7747],
  "Vrindavan": [27.5806, 77.7006],
  "Kasauli": [30.8975, 76.9646],
  "Meerut": [28.9845, 77.7064],
  "Navi Mumbai": [19.0330, 73.0297],
  "Pimpri Chinchwad": [18.6298, 73.7997],
  "Lonavala": [18.7546, 73.4062],
  "Surat": [21.1702, 72.8311],
  "Vadodara": [22.3072, 73.1812],
  "Noida": [28.5355, 77.3910],
  "Faridabad": [28.4089, 77.3178],
  "Thane": [19.2183, 72.9781],
  "Vijayawada": [16.5062, 80.6480],
  "Madurai": [9.9252, 78.1198],
  "Thiruvananthapuram": [8.5241, 76.9366],
  "Dehradun": [30.3165, 78.0322],
  "Jammu": [32.7266, 74.8570],
  "Shillong": [25.5788, 91.8933],
  "Puducherry": [11.9416, 79.8083],
  "Jodhpur": [26.2389, 73.0243],
  "Jaisalmer": [26.9157, 70.9083],
  "Agra": [27.1767, 78.0081],
  "Prayagraj": [25.4358, 81.8463],
  "Kanpur": [26.4499, 80.3319],
  "Rajkot": [22.3039, 70.8022],
  "Mangaluru": [12.9141, 74.8560],
  "Tiruchirapalli": [10.7905, 78.7047],
  "Warangal": [17.9689, 79.5941],
  "Bhilai": [21.1938, 81.3509],
  "Durgapur": [23.5204, 87.3119],
  "Jamshedpur": [22.8046, 86.2029],
  "Cuttack": [20.4625, 85.8828],
};

const INDIA_CENTER = [22.9734, 78.6569];

// Small deterministic jitter so venues in the same city don't stack exactly
// on top of one another.
function jitter(seedNum) {
  const a = Math.sin(seedNum * 12.9898) * 43758.5453;
  return (a - Math.floor(a) - 0.5) * 0.35;
}

export default function IndiaMapView({ venues }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.L || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapRef.current).setView(INDIA_CENTER, 5);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(mapInstanceRef.current);
      markersLayerRef.current = window.L.layerGroup().addTo(mapInstanceRef.current);
    }

    const layer = markersLayerRef.current;
    layer.clearLayers();

    const bounds = [];
    venues.forEach((v, i) => {
      const base = CITY_COORDS[v.city] || INDIA_CENTER;
      const lat = base[0] + jitter(v.id * 2);
      const lng = base[1] + jitter(v.id * 2 + 1);
      bounds.push([lat, lng]);

      const marker = window.L.marker([lat, lng]).addTo(layer);
      const popupHtml = `
        <div style="min-width:180px">
          <div style="font-weight:700;font-family:serif;margin-bottom:2px;">${v.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:4px;">${v.city}${v.state ? ", " + v.state : ""} · ${v.category}</div>
          <div style="font-weight:700;color:#26241F;margin-bottom:6px;">₹${v.price_per_day.toLocaleString("en-IN")} / day</div>
          <button id="map-view-btn-${v.id}" style="background:#26241F;color:white;border:none;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;">
            View Details
          </button>
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.on("popupopen", () => {
        const btn = document.getElementById(`map-view-btn-${v.id}`);
        if (btn) btn.onclick = () => navigate(`/venues/${v.id}`);
      });
    });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 6 });
    } else {
      mapInstanceRef.current.setView(INDIA_CENTER, 5);
    }
  }, [venues, navigate]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 h-[32rem] relative z-0">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
