document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {
    const files = event.target.files;
    const maxFiles = 100; // Adjust based on performance requirements
    const batchSize = 10; // Number of files to process at a time

    for (let i = 0; i < Math.min(files.length, maxFiles); i += batchSize) {
        processBatch(files, i, Math.min(i + batchSize, files.length));
    }
}

function processBatch(files, start, end) {
    for (let i = start; i < end; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                EXIF.getData(img, function() {
                    const lat = EXIF.getTag(this, "GPSLatitude");
                    const lon = EXIF.getTag(this, "GPSLongitude");
                    const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
                    const lonRef = EXIF.getTag(this, "GPSLongitudeRef") || "W";

                    if (lat && lon) {
                        const latitude = convertDMSToDD(lat, latRef);
                        const longitude = convertDMSToDD(lon, lonRef);
                        placeMarker(latitude, longitude, e.target.result);
                    }
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function convertDMSToDD(dms, ref) {
    let dd = dms[0] + dms[1]/60 + dms[2]/3600;
    if (ref === "S" || ref === "W") {
        dd = dd * -1;
    }
    return dd;
}

const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const markers = L.markerClusterGroup();
map.addLayer(markers);

function placeMarker(lat, lon, imageUrl) {
    const marker = L.marker([lat, lon]);
    const popupContent = `<img src="${imageUrl}" style="width: 100px; height: auto;">`;
    marker.bindPopup(popupContent);
    markers.addLayer(marker);
}
