import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";

function App() {
  const notify = () => toast("Please enter Emergency Number and Email");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  let latitudeUser, longitudeUser;

  const handleHelp = () => {
    if (!email || !phone) {
      notify();
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          fetch("http://localhost:5000/send-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, latitude, longitude }),
          })
            .then((res) => res.json())
            .then((data) => alert(data.message))
            .catch((err) => alert("Error sending alert: " + err.message));
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

  const getUserLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        latitudeUser = latitude;
        longitudeUser = longitude;

        console.log(
          `https://www.google.com/maps?q=${latitudeUser},${longitudeUser}`
        );
      },
      (error) => {
        alert("Error fetching location: " + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen flex flex-col items-center  bg-white">
        <div className="w-full bg-red-600 text-white flex justify-between p-4">
          <h1 className="text-xl font-bold">SHEcurity</h1>
          <div className="text-sm">
            <span className="mr-2">
              Wi-Fi <span className="font-bold">ON</span>
            </span>
            <span>
              GPS <span className="font-bold">ON</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center mt-16">
          <button
            onClick={handleHelp}
            className="bg-red-600  text-white text-2xl font-bold h-40 w-40  rounded-full shadow-2xl shadow-black cursor-pointer"
          >
            HELP
          </button>

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
        </div>
      </div>
    </>
  );
}

export default App;
