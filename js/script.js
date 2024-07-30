const socket = io();

socket.on('connect', () => {
    console.log('Connected to server');
});

const myname = prompt("Enter your name");


if(navigator.geolocation){
    navigator.geolocation.watchPosition((position)=> {
        const {latitude, longitude} = position.coords;
        socket.emit('sendLocation', {latitude, longitude, myname});
    }, (error) => {
        console.log(error);
    },
    {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0 //no cacheing
    });

}

const map = L.map("map").setView([0, 0], 20);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© Kirtan Parikh"
}).addTo(map);  

const marker = {};

// Define a custom icon
const customIcon = L.icon({
    iconUrl: '/images/map-pin.png', // Replace with the path to your custom icon
    iconSize: [38, 38], // Size of the icon
    iconAnchor: [22, 38], // Point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76] // Point from which the popup should open relative to the iconAnchor
});

socket.on('receiveLocation', (data) => {
    console.log(data);
    const {id, myname, latitude, longitude} = data;
    console.log(`Received location for ${name} at [${latitude}, ${longitude}]`);
    map.setView([latitude, longitude], 20);
    if(marker[id]){
        marker[id].setLatLng([latitude, longitude]);
        marker[id].bindPopup(myname).openPopup();
    }
    else{
        marker[id] = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        marker[id].bindPopup(myname).openPopup();
    }
});

socket.on('user-disconnected', () => {
    if(marker[id]){
        map.removeLayer(marker[id]);
        delete marker[id];  
    }

});