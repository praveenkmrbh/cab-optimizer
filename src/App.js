import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function App() {
  const [roster, setRoster] = useState([]);
  const [officeLocation, setOfficeLocation] = useState([19.0760, 72.8777]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('csv', file);
    formData.append('office', JSON.stringify(officeLocation));

    const response = await fetch('/.netlify/functions/optimize', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    setRoster(result);
  };

  return (
    <div className="App">
      <h1>Office Cab Optimizer</h1>
      
      <div className="controls">
        <input type="file" accept=".csv" onChange={handleFileUpload} />
        <div className="map-container">
          <MapContainer center={officeLocation} zoom={13}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {roster.map((cab, idx) => (
              <React.Fragment key={idx}>
                <Polyline
                  positions={cab.route.map(p => [p.lat, p.lon])}
                  color={['#FF0000', '#00FF00', '#0000FF'][idx % 3]}
                />
                {cab.route.map((point, pIdx) => (
                  <Marker
                    key={pIdx}
                    position={[point.lat, point.lon]}
                    icon={L.icon({
                      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${['red', 'green', 'blue'][idx % 3]}.png`,
                      iconSize: [25, 41]
                    })}
                  >
                    <Popup>{point.name} (Cab #{idx+1})</Popup>
                  </Marker>
                ))}
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
        <div className="roster-list">
          {roster.map((cab, idx) => (
            <div key={idx} className="cab-group">
              <h3>Cab #{idx+1} ({cab.size}-seater)</h3>
              <ol>
                {cab.route.map((emp, eIdx) => (
                  <li key={eIdx}>{emp.name} - {emp.time} mins</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
