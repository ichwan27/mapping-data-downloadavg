import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import DataKabupaten from './Data/kabupaten.geojson';
import DataDownload from './Data/data-download.json';

mapboxgl.accessToken = 'pk.eyJ1IjoiaWNod2FuMjciLCJhIjoiY2t0NDZ5cHQ3MTEwaTJ2bWxzMWxxb212OSJ9.R7VGO4Ft1Zx9Giih-yeMcw';

function getData(kabupaten){
  return DataDownload.filter(item => item.location === kabupaten);
}

function getDataColor(){
  let data = [];
  data.push('match');
  data.push(['get','KABUPATEN']);
  DataDownload.map((e) => {
    data.push(e.location);
    if(e.avg_download_throughput > 15000){
      data.push('#B71C1C');
    }else if(e.avg_download_throughput > 10000 && e.avg_download_throughput <= 15000){
      data.push('#EF5350');
    }else if(e.avg_download_throughput > 0 && e.avg_download_throughput <= 10000){
      data.push('#FFEBEE');
    }else{
      data.push('yellow');
    }
    return true;
  })
  data.push('white');  
  return data;
}

export default function App() {
const mapContainer = useRef(null);
const map = useRef(null);
const [lng, setLng] = useState(112.6);
const [lat, setLat] = useState(-7.80);
const [zoom, setZoom] = useState(7);

const layers = [
  '0 - 5,000',
  '5,000 - 10,000',
  '10,000 - 15,000',
  '15,000+',
  'NULL'
];

const colors = [
  '#FFEBEE',
  '#FFCDD2',
  '#EF5350',
  '#B71C1C',
  'yellow'
];

useEffect(() => {
  if (map.current) return; // initialize map only once
  map.current = new mapboxgl.Map({
    container: mapContainer.current,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [lng, lat],
    zoom: zoom
  });
});

useEffect(() => {
  if (!map.current) return; // wait for map to initialize
  map.current.on('move', () => {
    setLng(map.current.getCenter().lng.toFixed(4));
    setLat(map.current.getCenter().lat.toFixed(4));
    setZoom(map.current.getZoom().toFixed(2));
  });
});

useEffect(() => {
  if (!map.current) return;
    map.current.on('load', () => {
      map.current.addSource('kabupaten',{
        'type':'geojson',
        'data': DataKabupaten
      });
      map.current.addLayer({
        'id':'kabupaten',
        'type' : 'fill',
        'source' : 'kabupaten',
        'layout': {},
        'paint' : {
          'fill-color': getDataColor(),
          'fill-opacity': 0.8 
        }
      })
      map.current.addLayer({
        'id': 'state-borders',
        'type': 'line',
        'source': 'kabupaten',
        'layout': {},
        'paint': {
          'line-color': '#000',
          'line-width': 0.1
        }
      });
    });
    
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '900px'
    });
    
    map.current.on('mousemove', 'kabupaten', (e) => {
      // Change the cursor style as a UI indicator.
      map.current.getCanvas().style.cursor = 'pointer';
      const kabupaten = e.features[0].properties.KABUPATEN
      const data = getData(kabupaten);
      let avg = data[0].avg_download_throughput;
      // Copy coordinates array.
      const description = 
    `<h2><strong>${data[0].location}</strong></h2>
        <h3>${data[0].region}</h3>
        <p>
            <em>
                <strong>Average Download: ${ avg != null ? `<i>${(avg.toLocaleString(undefined,{maximumFractionDigits: 2}))} </i> Downloads` : 'Data download tidak ada'}</strong></em></p>
                </strong> 
            </em>
        </p>`;
  popup.setLngLat(e.lngLat).setHTML(description).addTo(map.current);
});

map.current.on('mouseleave', 'kabupaten', () => {
  map.current.getCanvas().style.cursor = '';
  popup.remove();
});
    // create legend
    const legend = document.getElementById('legend');

    layers.forEach((layer, i) => {
        const color = colors[i];
        const item = document.createElement('div');
        const key = document.createElement('span');
        key.className = 'legend-key';
        key.style.backgroundColor = color;

        const value = document.createElement('span');
        value.innerHTML = `${layer}`;
        item.appendChild(key);
        item.appendChild(value);
        legend.appendChild(item);
    });

});
return (
  <div>
  <div className="sidebar">
    Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}
  </div>
  <div ref={mapContainer} className="map-container" />
  <div className='map-overlay' id='legend'></div>
</div>
);
}