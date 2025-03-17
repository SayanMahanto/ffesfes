import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import policeStations from "./policeStations.json";
import { ArrowUpRight } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/484/484167.png",
  iconSize: [32, 32],
});

const stationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/252/252025.png",
  iconSize: [32, 32],
});

function App() {
  const notify = () => toast("Please enter Emergency Number and Email");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [displayPolice, setDisplayPolice] = useState("mt-8 w-80 mb-8 hidden");
  const [userLocation, setUserLocation] = useState(null);
  const [nearestStations, setNearestStations] = useState([]);
  const [emailPhone, setEmailPhone] = useState(true);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const toRad = (angle) => (angle * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      console.log("Recognized Speech:", transcript);

      if (
        transcript.includes("help") ||
        transcript.includes("emergency") ||
        transcript.includes("police")
      ) {
        handleHelp();
      }
    };

    recognition.start();
  };

  useEffect(() => {
    startListening();
  }, []);

  const fetchUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });

          const sortedStations = policeStations
            .map((station) => ({
              ...station,
              distance: getDistance(
                latitude,
                longitude,
                station.latitude,
                station.longitude
              ),
            }))
            .sort((a, b) => a.distance - b.distance);

          setNearestStations(sortedStations.slice(0, 2));
        },
        (error) => {
          alert("Error fetching location: " + error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const setItemWithExpiry = (key, value, hours) => {
    const expiry = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(key, JSON.stringify({ value, expiry }));
  };

  const getItemWithExpiry = (key) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    const { value, expiry } = JSON.parse(itemStr);
    if (Date.now() > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return value;
  };

  useEffect(() => {
    const storedEmail = getItemWithExpiry("Email");
    const storedPhone = getItemWithExpiry("Phone");

    if (storedEmail && storedPhone) {
      setEmail(storedEmail);
      setPhone(storedPhone);
      setEmailPhone(false);
    } else {
      setEmailPhone(true);
    }

    fetchUserLocation();
  }, []);

  const resetHandle = () => {
    localStorage.clear();
    setEmailPhone(true);
    setEmail("");
    setPhone("");
    setDisplayPolice("mt-8 w-80 mb-8 hidden");
  };

  const handleHelp = () => {
    if (!email || !phone) {
      notify();
      return;
    }

    setItemWithExpiry("Email", email, 24);
    setItemWithExpiry("Phone", phone, 24);

    setDisplayPolice("mt-8 w-80 mb-8");

    if (!userLocation) {
      alert("Fetching your location...");
      return;
    }

    fetch("http://localhost:5000/send-alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, ...userLocation }),
    })
      .then((res) => res.json())
      .then((data) => alert(data.message))
      .catch((err) => alert("Error sending alert: " + err.message));
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen flex flex-col items-center bg-white">
        <div className="w-full bg-red-600 text-white flex justify-between p-4">
          <h1 className="text-xl font-bold">SHEcurity</h1>
        </div>

        <div className="flex flex-col items-center mt-10">
          <button
            onClick={handleHelp}
            className="bg-red-600 text-white text-2xl font-bold h-40 w-40 rounded-full shadow-2xl shadow-black cursor-pointer"
          >
            HELP
          </button>
          <button
            onClick={resetHandle}
            className="text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-2.5 me-2 my-5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
          >
            Reset Contact
          </button>

          {emailPhone && (
            <div className="mt-6 w-80">
              <input
                type="text"
                placeholder="Enter emergency phone number"
                className="w-full p-3 mt-4 bg-gray-800 text-white rounded-md focus:outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                type="email"
                placeholder="Enter emergency email"
                className="w-full p-3 mt-4 bg-gray-800 text-white rounded-md focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}
        </div>

        {userLocation && nearestStations.length > 0 && (
          <div className={displayPolice}>
            <h2 className="text-lg font-bold mb-3 text-center">
              Nearest Police Stations
            </h2>
            <MapContainer
              center={[userLocation.latitude, userLocation.longitude]}
              zoom={14}
              style={{ height: "100px", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={userIcon}
              >
                <Popup>You are here</Popup>
              </Marker>
              {nearestStations.map((station, index) => (
                <Marker
                  key={index}
                  position={[station.latitude, station.longitude]}
                  icon={stationIcon}
                >
                  <Popup>{station.name}</Popup>
                </Marker>
              ))}
            </MapContainer>

            {nearestStations.map((station, index) => (
              <div
                key={index}
                className="p-3 bg-gray-100 shadow flex justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold">{station.name}</h2>
                  <p>📍 Distance: {station.distance.toFixed(2)} km</p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${station.latitude},${station.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 w-15 h-15 text-white px-4 mt-2 rounded-full text-center flex place-items-center"
                >
                  <ArrowUpRight size={45} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
