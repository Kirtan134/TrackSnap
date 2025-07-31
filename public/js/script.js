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
    const { latitude, longitude } = position.coords;
    socket.emit("sendLocation", { latitude, longitude, myname });
  });
}

const map = L.map("map").setView([0, 0], 10);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

const markers = {};

socket.on("receiveLocation", (data) => {
  const { id, myname, latitude, longitude } = data;

  if (id === currentUserId) {
    map.setView([latitude, longitude], 15);
  }

  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
    markers[id].bindPopup(myname);
  }
});

socket.on("user-disconnected", (disconnectedId) => {
  if (markers[disconnectedId]) {
    map.removeLayer(markers[disconnectedId]);
    delete markers[disconnectedId];
  }
});

socket.on("userCountUpdate", (count) => {
  document.title = `TrackSnap - ${count} users online`;
});
