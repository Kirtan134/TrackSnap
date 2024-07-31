
# TrackSnap

**Track and share your location in real-time.**

## Description

TrackSnap allows you to see the real-time locations of all active users on this server. Please note, no data is stored or cached on our end. Location is updated every 5 seconds for precise tracking. This feature is purely for demonstration purposes.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Technologies](#technologies)
- [License](#license)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)

## Features

- Real-time location tracking of all active users
- Location updates every 5 seconds
- No data storage or caching
- Interactive map using Leaflet

## Installation

1. **Clone the repository**
    ```sh
    git clone https://github.com/yourusername/tracksnap.git
    cd tracksnap
    ```

2. **Install dependencies**
    ```sh
    npm install
    ```

3. **Run the server**
    ```sh
    node app.js
    ```

## Usage

1. Open your browser and navigate to `http://localhost:3000`.
2. Allow location access when prompted.
3. See the real-time locations of all active users on the interactive map.

## Technologies

- **Node.js**: JavaScript runtime environment
- **Express.js**: Web framework for Node.js
- **Socket.io**: Real-time, bidirectional and event-based communication
- **Leaflet**: Open-source JavaScript library for mobile-friendly interactive maps
- **EJS**: Embedded JavaScript templating

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes.

## Acknowledgements

- Thanks to the developers of [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [Socket.io](https://socket.io/), [Leaflet](https://leafletjs.com/), and [EJS](https://ejs.co/) for their great tools and libraries.

## Notice

Please be aware that the free web service on Render spins down if it goes 15 minutes without receiving any inbound traffic. When the service receives a new request, it will spin back up, which can take up to a minute. During this time, you may experience a noticeable delay, such as a browser page load hanging temporarily.
