// Initialize connection and variables
const socket = io();
let currentUserId = null;
let isDarkMode = false;

// Get user ID when connected
socket.on("connect", () => {
  currentUserId = socket.id;
});

// Get user name
let myname = prompt("Enter your name");
if (!myname || myname.trim() === "") {
  myname = "Anonymous User";
}

if (navigator.geolocation) {
  navigator.geolocation.watchPosition((position) => {
    const { latitude, longitude, accuracy } = position.coords;
    socket.emit("sendLocation", { latitude, longitude, accuracy, myname });
  });
}

const map = L.map("map").setView([0, 0], 10);

// Map layers for light and dark mode
const lightLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
);
const darkLayer = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
);

lightLayer.addTo(map);

// Dark mode toggle function
function toggleDarkMode() {
  const toggleButton = document.getElementById("darkModeToggle");

  if (isDarkMode) {
    // Switch to light mode
    map.removeLayer(darkLayer);
    lightLayer.addTo(map);
    if (toggleButton) toggleButton.textContent = "🌙";
    isDarkMode = false;
    localStorage.setItem("darkMode", "false");
  } else {
    // Switch to dark mode
    map.removeLayer(lightLayer);
    darkLayer.addTo(map);
    if (toggleButton) toggleButton.textContent = "☀️";
    isDarkMode = true;
    localStorage.setItem("darkMode", "true");
  }
}

// Load saved preference after DOM loads
document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("darkModeToggle");
  if (toggleButton) {
    toggleButton.addEventListener("click", toggleDarkMode);

    // Apply saved dark mode preference
    if (localStorage.getItem("darkMode") === "true") {
      toggleDarkMode();
    }
  }
});

const markers = {};
const accuracyCircles = {};
let userLocations = {};

// Update user list display
function updateUserList() {
  const userListContent = document.getElementById("userListContent");
  if (!userListContent) return;

  userListContent.innerHTML = "";

  // Add each user to the list
  for (const userId in userLocations) {
    const user = userLocations[userId];
    const userDiv = document.createElement("div");
    userDiv.className = "user-item";
    userDiv.textContent = user.name;

    // Mark current user and add click handler
    if (userId === currentUserId) {
      userDiv.classList.add("current-user");
      userDiv.textContent += " (You)";
    }

    // Click to center map on user
    userDiv.onclick = () => {
      if (markers[userId] && user) {
        map.setView([user.latitude, user.longitude], 15);
        markers[userId].openPopup();
      }
    };

    userListContent.appendChild(userDiv);
  }
}

// Calculate distance between two points in kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get accuracy color based on GPS accuracy
function getAccuracyColor(accuracy) {
  if (accuracy <= 10) return "#4CAF50"; // Green - very accurate
  if (accuracy <= 50) return "#FF9800"; // Orange - medium
  return "#F44336"; // Red - poor accuracy
}

// Handle receiving location updates
socket.on("receiveLocation", (data) => {
  const { id, myname, latitude, longitude, accuracy = 100 } = data;

  // Store user location
  userLocations[id] = { latitude, longitude, name: myname, accuracy };

  // Center map on current user
  if (id === currentUserId) {
    map.setView([latitude, longitude], 15);
  }

  // Update or create marker
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }

  // Create popup with user info
  let popupContent = `<b>${myname}</b><br>Accuracy: ${accuracy.toFixed(0)}m`;

  // Add distance for other users
  if (id !== currentUserId && userLocations[currentUserId]) {
    const currentUser = userLocations[currentUserId];
    const distance = calculateDistance(
      currentUser.latitude,
      currentUser.longitude,
      latitude,
      longitude
    );
    popupContent += `<br>Distance: ${distance.toFixed(1)}km`;
  }

  // Update accuracy circle
  const color = getAccuracyColor(accuracy);
  if (accuracyCircles[id]) {
    accuracyCircles[id].setLatLng([latitude, longitude]);
    accuracyCircles[id].setRadius(accuracy);
    accuracyCircles[id].setStyle({ color: color, fillColor: color });
  } else {
    accuracyCircles[id] = L.circle([latitude, longitude], {
      color: color,
      fillColor: color,
      fillOpacity: 0.2,
      radius: accuracy,
    }).addTo(map);
  }

  markers[id].bindPopup(popupContent);
  updateUserList();
});

// Handle user disconnection
socket.on("user-disconnected", (disconnectedId) => {
  // Remove marker if exists
  if (markers[disconnectedId]) {
    map.removeLayer(markers[disconnectedId]);
    delete markers[disconnectedId];
  }

  // Remove accuracy circle if exists
  if (accuracyCircles[disconnectedId]) {
    map.removeLayer(accuracyCircles[disconnectedId]);
    delete accuracyCircles[disconnectedId];
  }

  // Remove from user locations and update list
  delete userLocations[disconnectedId];
  updateUserList();
});

// Update page title with user count
socket.on("userCountUpdate", (count) => {
  document.title = `TrackSnap - ${count} users online`;
});
