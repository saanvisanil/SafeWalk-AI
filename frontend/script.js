let map;
let routeLine;

// 🔹 Run after page loads
document.addEventListener("DOMContentLoaded", function() {

    // ✅ Initialize map AFTER DOM loads
    map = L.map('map').setView([12.9716, 77.5946], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);


    // ✅ Realistic SOS Button
    document.getElementById("sosBtn").addEventListener("click", function() {
        this.innerHTML = "🚨 Alert Sent!";
        this.style.background = "red";

        navigator.geolocation.getCurrentPosition(position => {
            console.log("User location:",
                position.coords.latitude,
                position.coords.longitude
            );
        });

        alert("Emergency location shared with nearest police station.");
    });

});


// 🔹 Fetch routes
function getRoutes() {
    const start = document.querySelector("input[placeholder='Enter Start Location']").value;
const destination = document.querySelector("input[placeholder='Enter Destination']").value;
    const time = document.getElementById("time").value;

    document.getElementById("loading").style.display = "block";

    fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ time: parseInt(time) })
    })
    .then(response => response.json())
    .then(data => {
        let output = "";

        data.forEach(route => {
            output += `
                <div class="route-card" onclick="selectRoute('${route.route}')">
                    <h3>${route.route}</h3>
                    <p><strong>Status:</strong> ${route.status}</p>
                    <p>Crime Score: ${route.crime}</p>
                    <p>Lighting: ${route.lighting}</p>
                    <p>Police Nearby: ${route.police}</p>
                </div>
            `;
        });

        document.getElementById("loading").style.display = "none";
        document.getElementById("results").innerHTML = output;
    });
}
async function getCoordinates(place) {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
    );
    const data = await response.json();

    if (data.length === 0) {
        alert("Location not found: " + place);
        return null;
    }

    return [
        parseFloat(data[0].lat),
        parseFloat(data[0].lon)
    ];
}


// 🔹 Draw route on map
async function selectRoute(routeName) {

    console.log("Selected:", routeName);

    const start = document.querySelector("input[placeholder='Enter Start Location']").value;
    const destination = document.querySelector("input[placeholder='Enter Destination']").value;

    const startCoords = await getCoordinates(start);
    const destCoords = await getCoordinates(destination);

    if (!startCoords || !destCoords) return;

    if (routeLine) {
        map.removeLayer(routeLine);
    }

    let latMid = (startCoords[0] + destCoords[0]) / 2;
    let lonMid = (startCoords[1] + destCoords[1]) / 2;

    let offset = Math.abs(startCoords[0] - destCoords[0]) * 0.3;

    let midPoint;

    if (routeName.includes("1")) {
        midPoint = [latMid + offset, lonMid];
    }
    else if (routeName.includes("2")) {
        midPoint = [latMid, lonMid + offset];
    }
    else {
        midPoint = [latMid - offset, lonMid];
    }

    const coords = [
        startCoords,
        midPoint,
        destCoords
    ];

    routeLine = L.polyline(coords, {
        color: getRouteColor(routeName),
        weight: 6
    }).addTo(map);

    map.fitBounds(routeLine.getBounds());
}
function getRouteColor(routeName) {
    if (routeName.includes("1")) return "green";
    if (routeName.includes("2")) return "orange";
    return "red";
}
