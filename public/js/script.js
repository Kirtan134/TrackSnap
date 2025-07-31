const socket = io();
let currentUserId = null;

socket.on("connect", () => {
  currentUserId = socket.id;
});

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
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

const markers = {};
const accuracyCircles = {};
let userLocations = {};

// Update user list display
function updateUserList() {
  const userListContent = document.getElementById("userListContent");
  if (!userListContent) return;

  userListContent.innerHTML = "";

  Object.keys(userLocations).forEach((userId) => {
    const user = userLocations[userId];
    const userDiv = document.createElement("div");
    userDiv.className = "user-item";
    userDiv.textContent = user.name;

    if (userId === currentUserId) {
      userDiv.classList.add("current-user");
      userDiv.textContent += " (You)";
      userDiv.onclick = () => {
        if (markers[userId] && user) {
          map.setView([user.latitude, user.longitude], 15);
          markers[userId].openPopup();
        }
      };
    } else {
      userDiv.onclick = () => {
        if (markers[userId] && user) {
          map.setView([user.latitude, user.longitude], 15);
          markers[userId].openPopup();
        }
      };
    }

    userListContent.appendChild(userDiv);
  });
}

// Simple distance calculator
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
  return R * c; // Distance in km
}

// Get accuracy color based on GPS accuracy
function getAccuracyColor(accuracy) {
  if (accuracy <= 10) return "#4CAF50"; // Green - very accurate
  if (accuracy <= 50) return "#FF9800"; // Orange - medium
  return "#F44336"; // Red - poor accuracy
}

socket.on("receiveLocation", (data) => {
  const { id, myname, latitude, longitude, accuracy = 100 } = data;

  // Store user location
  userLocations[id] = { latitude, longitude, name: myname, accuracy };

  if (id === currentUserId) {
    map.setView([latitude, longitude], 15);
  }

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }

  // Create popup content with distances and accuracy
  let popupContent = `<b>${myname}</b><br>Accuracy: ${accuracy.toFixed(0)}m`;
  if (id !== currentUserId && userLocations[currentUserId]) {
    const distance = calculateDistance(
      userLocations[currentUserId].latitude,
      userLocations[currentUserId].longitude,
      latitude,
      longitude
    );
    popupContent += `<br>Distance: ${distance.toFixed(1)}km`;
  }

  // Update or create accuracy circle
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

socket.on("user-disconnected", (disconnectedId) => {
  if (markers[disconnectedId]) {
    map.removeLayer(markers[disconnectedId]);
    delete markers[disconnectedId];
  }
  if (accuracyCircles[disconnectedId]) {
    map.removeLayer(accuracyCircles[disconnectedId]);
    delete accuracyCircles[disconnectedId];
  }
  delete userLocations[disconnectedId];
  updateUserList();
});

socket.on("userCountUpdate", (count) => {
  document.title = `TrackSnap - ${count} users online`;
});
