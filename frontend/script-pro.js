let map;
let routeLine;
let policeMarkers = [];
let routeSafety = {};
let validatedStartCoords = null;
let validatedDestCoords = null;
let selectedRouteData = null;

document.addEventListener("DOMContentLoaded", function () {
    map = L.map("map").setView([12.9716, 77.5946], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    setTimeout(() => {
        loadCrimeHeatmap();
        map.invalidateSize();
    }, 500);

    loadProfile();
    loadSavedContactCard();
    renderRecentSearches();
    updateGuestLabel();
});

function loadProfile() {
    const name = localStorage.getItem("sw_user_name") || "Guest User";
    const email = localStorage.getItem("sw_user_email") || "Guest Access";

    document.getElementById("profileName").textContent = name;
    document.getElementById("profileEmail").textContent = email || "Guest Access";
}

function updateGuestLabel() {
    const isGuest = localStorage.getItem("sw_guest_mode") === "true";
    document.getElementById("guestModeLabel").textContent = isGuest ? "Mode: Guest" : "Mode: Full Access";
}

function toggleMenu() {
    document.getElementById("menuDropdown").classList.toggle("show");
}

function toggleTips() {
    const panel = document.getElementById("tipsPanel");
    panel.style.display = panel.style.display === "none" ? "block" : "none";
}

window.addEventListener("click", function (e) {
    const menu = document.getElementById("menuDropdown");
    const btn = document.querySelector(".menu-btn");

    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove("show");
    }
});

function showMap() {
    const container = document.getElementById("mapContainer");
    if (container) {
        container.style.display = "flex";
    }

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 200);
}

function calculateSafetyScore(route, mode) {
    let crime = Math.min(route.crime / 10, 1);
    let lighting = Math.min(route.lighting / 10, 1);
    let police = Math.min(route.police / 10, 1);
    let crowd = Math.min(route.crowd / 10, 1);

    let crimeWeight = 25;
    let lightingWeight = 35;
    let policeWeight = 25;
    let crowdWeight = 15;

    if (mode === "women") {
        lightingWeight = 40;
        policeWeight = 30;
        crowdWeight = 15;
        crimeWeight = 15;
    } else if (mode === "student") {
        crowdWeight = 25;
        lightingWeight = 35;
        policeWeight = 20;
        crimeWeight = 20;
    } else if (mode === "night") {
        lightingWeight = 45;
        policeWeight = 30;
        crowdWeight = 10;
        crimeWeight = 15;
    }

    let score =
        (lighting * lightingWeight) +
        (police * policeWeight) +
        (crowd * crowdWeight) +
        ((1 - crime) * crimeWeight);

    return Math.max(0, Math.min(100, Math.round(score)));
}

function getSafetyColor(score) {
    if (score >= 75) return "#22c55e";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
}

function getSafetyLabel(score) {
    if (score >= 75) return "Safe";
    if (score >= 50) return "Moderate";
    return "Risky";
}

function getRouteColor(routeName) {
    const score = routeSafety[routeName];
    if (score >= 75) return "#22c55e";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
}

function getRecommendationReason(route, mode) {
    if (mode === "women" && route.lighting >= 8 && route.police >= 7) {
        return "Recommended because lighting is high and police presence is strong.";
    }
    if (mode === "student" && route.crowd >= 7) {
        return "Recommended because public activity is stronger and safer for student commute.";
    }
    if (mode === "night" && route.lighting >= 8) {
        return "Recommended because night visibility is better on this route.";
    }
    if (route.crime <= 3) {
        return "Lowest crime exposure among available routes.";
    }
    if (route.crowd >= 7) {
        return "Safer due to better public activity.";
    }
    return "Balanced safety indicators across the route.";
}

function getModeTravelTip(mode) {
    if (mode === "women") {
        return "Women Safety Mode prioritizes lighting, public activity, and nearby support.";
    }
    if (mode === "student") {
        return "Student Commute Mode prioritizes more active and visible public routes.";
    }
    if (mode === "night") {
        return "Night Travel Mode prioritizes visibility and discourages isolated areas.";
    }
    return "Standard Mode balances all route safety factors.";
}

function showAppMessage(message, type = "info") {
    const results = document.getElementById("results");

    let bg = "rgba(59,130,246,0.12)";
    let border = "#3b82f6";

    if (type === "error") {
        bg = "rgba(239,68,68,0.12)";
        border = "#ef4444";
    }
    if (type === "success") {
        bg = "rgba(34,197,94,0.12)";
        border = "#22c55e";
    }

    results.innerHTML = `
        <div class="panel-card" style="background:${bg}; border:1px solid ${border};">
            ${message}
        </div>
    `;
}

async function getCoordinates(place) {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`
    );

    const data = await response.json();

    if (!data || data.length === 0) {
        return null;
    }

    return [
        parseFloat(data[0].lat),
        parseFloat(data[0].lon)
    ];
}

function getCurrentUserContactKey() {
    const isGuest = localStorage.getItem("sw_guest_mode") === "true";
    if (isGuest) return null;

    const email = localStorage.getItem("sw_user_email");
    if (!email) return null;

    return `sw_emergency_contact_${email}`;
}

function getCurrentUserSearchKey() {
    const isGuest = localStorage.getItem("sw_guest_mode") === "true";
    if (isGuest) return null;

    const email = localStorage.getItem("sw_user_email");
    if (!email) return null;

    return `sw_recent_searches_${email}`;
}

function saveRecentSearch(start, destination, time, mode) {
    const searchKey = getCurrentUserSearchKey();
    if (!searchKey) return;

    const existing = JSON.parse(localStorage.getItem(searchKey) || "[]");
    const item = { start, destination, time, mode };

    existing.unshift(item);
    localStorage.setItem(searchKey, JSON.stringify(existing.slice(0, 5)));

    renderRecentSearches();
}

function renderRecentSearches() {
    const container = document.getElementById("recentSearches");
    if (!container) return;

    const isGuest = localStorage.getItem("sw_guest_mode") === "true";

    if (isGuest) {
        container.innerHTML = "Guest mode does not store or display recent searches.";
        return;
    }

    const searchKey = getCurrentUserSearchKey();
    if (!searchKey) {
        container.innerHTML = "No recent searches yet.";
        return;
    }

    const searches = JSON.parse(localStorage.getItem(searchKey) || "[]");

    if (searches.length === 0) {
        container.innerHTML = "No recent searches yet.";
        return;
    }

    container.innerHTML = searches.map(item => `
        <div class="recent-search-item">
            <strong>${item.start}</strong> → <strong>${item.destination}</strong><br>
            <small>${item.time} | ${item.mode}</small>
        </div>
    `).join("");
}

function loadSavedContactCard() {
    const contactBox = document.getElementById("savedContactText");
    if (!contactBox) return;

    const isGuest = localStorage.getItem("sw_guest_mode") === "true";

    if (isGuest) {
        contactBox.textContent = "Guest mode does not store emergency contacts.";
        return;
    }

    const contactKey = getCurrentUserContactKey();
    if (!contactKey) {
        contactBox.textContent = "No emergency contact saved.";
        return;
    }

    const contact = localStorage.getItem(contactKey);

    if (contact) {
        contactBox.textContent = `Saved contact: ${contact}`;
    } else {
        contactBox.textContent = "No emergency contact saved.";
    }
}

function showNightWarning(time, mode) {
    const banner = document.getElementById("warningBanner");
    if (!banner) return;

    if (time === "2" || mode === "night") {
        banner.innerHTML = `
            <div class="warning-banner">
                ⚠ Night mode active: avoid low-crowd, low-light areas and prefer well-lit public roads.
            </div>
        `;
    } else {
        banner.innerHTML = "";
    }
}

async function getRoutes() {
    const start = document.getElementById("startInput").value.trim();
    const destination = document.getElementById("destInput").value.trim();
    const time = document.getElementById("time").value;
    const mode = document.getElementById("safetyMode").value;

    const timeMap = {
        "0": "Morning",
        "1": "Evening",
        "2": "Night"
    };

    showMap();
    document.getElementById("results").innerHTML = "";

    if (!start || !destination) {
        showAppMessage("Please enter both start and destination locations.", "error");
        return;
    }

    document.getElementById("loading").style.display = "block";
    showNightWarning(time, mode);

    try {
        validatedStartCoords = await getCoordinates(start);
        validatedDestCoords = await getCoordinates(destination);

        if (!validatedStartCoords) {
            document.getElementById("loading").style.display = "none";
            showAppMessage(`Start location not found: ${start}`, "error");
            return;
        }

        if (!validatedDestCoords) {
            document.getElementById("loading").style.display = "none";
            showAppMessage(`Destination not found: ${destination}`, "error");
            return;
        }

        saveRecentSearch(start, destination, timeMap[time], mode);

        const response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                time: parseInt(time),
                mode: mode
            })
        });

        const data = await response.json();

        const enrichedRoutes = data.map(route => {
            const safetyScore = calculateSafetyScore(route, mode);
            return {
                ...route,
                safetyScore,
                safetyLabel: getSafetyLabel(safetyScore),
                explanation: getRecommendationReason(route, mode)
            };
        });

        enrichedRoutes.sort((a, b) => b.safetyScore - a.safetyScore);
        selectedRouteData = enrichedRoutes[0];

        let output = `
            <div class="summary-bar">
                <div class="summary-pill">📍 ${start}</div>
                <div class="summary-pill">🏁 ${destination}</div>
                <div class="summary-pill">🛡 ${enrichedRoutes[0].route} is safest</div>
                <div class="summary-pill">🎯 ${getModeTravelTip(mode)}</div>
            </div>
        `;

        enrichedRoutes.forEach((route, index) => {
            routeSafety[route.route] = route.safetyScore;
            const isRecommended = index === 0;

            output += `
                <div class="route-card ${isRecommended ? "recommended-card" : ""}" onclick="selectRoute('${route.route}')">
                    <div class="route-header">
                        <h3>
                            ${route.route}
                            ${isRecommended ? `<span class="badge">⭐ Recommended</span>` : ""}
                        </h3>
                    </div>

                    <p><strong>Status:</strong> ${route.safetyLabel}</p>
                    ${isRecommended ? `<p><strong>AI Route Explanation:</strong> ${route.explanation}</p>` : ""}
                    <p><strong>ETA:</strong> ${route.eta} mins</p>
                    <p><strong>Distance:</strong> ${route.distance} km</p>
                    <p>Crime Score: ${route.crime}</p>
                    <p>Crowd: ${route.crowd}</p>
                    <p>Lighting: ${route.lighting}</p>
                    <p>Police Nearby: ${route.police}</p>

                    <p>
                        <strong>Safety Score:</strong>
                        <span class="safety-meter" style="color:${getSafetyColor(route.safetyScore)}">
                            ${route.safetyScore}%
                        </span>
                        (${route.safetyLabel})
                    </p>
                </div>
            `;
        });

        document.getElementById("results").innerHTML = output;
        document.getElementById("loading").style.display = "none";

    } catch (error) {
        console.error(error);
        document.getElementById("loading").style.display = "none";
        showAppMessage("Could not fetch routes. Make sure backend is running.", "error");
    }
}

async function selectRoute(routeName) {
    if (!validatedStartCoords || !validatedDestCoords) {
        showAppMessage("Please search valid locations first.", "error");
        return;
    }

    const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQwMmFjYmVjNTE4MzQwMTI4YjBhMzg2YjI5ZjQ3ZDczIiwiaCI6Im11cm11cjY0In0=";
    const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${apiKey}&start=${validatedStartCoords[1]},${validatedStartCoords[0]}&end=${validatedDestCoords[1]},${validatedDestCoords[0]}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.features || !data.features[0]) {
            alert("Could not load route from map service.");
            return;
        }

        const coords = data.features[0].geometry.coordinates;
        const latlngs = coords.map(c => [c[1], c[0]]);

        if (routeLine) {
            map.removeLayer(routeLine);
        }

        routeLine = L.polyline(latlngs, {
            color: getRouteColor(routeName),
            weight: 6
        }).addTo(map);

        map.fitBounds(routeLine.getBounds());
    } catch (error) {
        console.error("Route drawing error:", error);
        alert("Failed to draw route on map.");
    }
}

function editContact() {
    const isGuest = localStorage.getItem("sw_guest_mode") === "true";
    if (isGuest) {
        alert("Guest mode has limited features. Please sign in to save emergency contacts.");
        return;
    }

    const contactKey = getCurrentUserContactKey();
    if (!contactKey) {
        alert("User profile not found. Please sign in again.");
        return;
    }

    const existingContact = localStorage.getItem(contactKey) || "";
    let contact = prompt("Enter Emergency Contact Number:", existingContact);

    if (contact && contact.trim() !== "") {
        localStorage.setItem(contactKey, contact.trim());
        loadSavedContactCard();
        alert("Contact saved successfully");
    }
}

function sendSOS() {
    const isGuest = localStorage.getItem("sw_guest_mode") === "true";
    if (isGuest) {
        alert("Guest mode has limited access. Please sign in to use SOS.");
        return;
    }

    const contactKey = getCurrentUserContactKey();
    if (!contactKey) {
        alert("User profile not found. Please sign in again.");
        return;
    }

    const contact = localStorage.getItem(contactKey);

    if (!contact) {
        alert("Enter emergency contact first");
        return;
    }

    navigator.geolocation.getCurrentPosition(async pos => {
        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;

        let message =
            "🚨 SOS ALERT!\nTrusted contact notified.\nLocation:\nhttps://maps.google.com/?q=" + lat + "," + lon;

        alert(message);
        loadPoliceStations(lat, lon);
    }, () => {
        alert("Could not access your location.");
    });
}

function shareTrip() {
    const isGuest = localStorage.getItem("sw_guest_mode") === "true";
    if (isGuest) {
        alert("Guest mode cannot share trips. Please sign in for full features.");
        return;
    }

    const start = document.getElementById("startInput").value.trim();
    const destination = document.getElementById("destInput").value.trim();

    if (!start || !destination || !selectedRouteData) {
        alert("Search routes first before sharing trip.");
        return;
    }

    const msg = `I’m travelling from ${start} to ${destination}. Chosen route: ${selectedRouteData.route}. ETA: ${selectedRouteData.eta} mins. Safety score: ${selectedRouteData.safetyScore}%.`;

    navigator.clipboard.writeText(msg)
        .then(() => alert("Trip details copied to clipboard!"))
        .catch(() => alert("Could not copy trip details."));
}

async function loadPoliceStations(lat, lon) {
    policeMarkers.forEach(marker => map.removeLayer(marker));
    policeMarkers = [];

    const query = `
[out:json];
node["amenity"="police"](around:2000,${lat},${lon});
out;
`;

    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    try {
        const response = await fetch(url);
        const data = await response.json();

        data.elements.forEach(station => {
            const marker = L.marker([station.lat, station.lon])
                .addTo(map)
                .bindPopup("🚓 Police Station<br>Nearby Help Available");

            policeMarkers.push(marker);
        });
    } catch (error) {
        console.error("Error loading police stations:", error);
    }
}

function alertPolice() {
    const isGuest = localStorage.getItem("sw_guest_mode") === "true";
    if (isGuest) {
        alert("Guest mode can only view routes. Sign in to use police alert assistance.");
        return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
        let lat = pos.coords.latitude;
        let lon = pos.coords.longitude;

        loadPoliceStations(lat, lon);

        const contactKey = getCurrentUserContactKey();
        const contact = contactKey ? localStorage.getItem(contactKey) : null;

        if (contact) {
            alert(`Police assistance simulation activated.\nNearby police stations displayed on map.\nEmergency contact ${contact} would also be alerted.`);
        } else {
            alert("Nearby police stations displayed on map. Save an emergency contact for combined alert simulation.");
        }
    }, () => {
        alert("Could not access your location.");
    });
}

function loadCrimeHeatmap() {
    const crimeData = [
        [12.9716, 77.5946, 0.8],
        [12.975, 77.59, 0.6],
        [12.968, 77.60, 0.9],
        [12.973, 77.602, 0.7]
    ];

    L.heatLayer(crimeData, {
        radius: 25,
        blur: 15,
        maxZoom: 17
    }).addTo(map);
}