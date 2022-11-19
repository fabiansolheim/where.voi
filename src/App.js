import { useState, useRef, useEffect } from "react";
import "./App.css";
import ReactMapGL, {
  Marker,
  FlyToInterpolator,
  NavigationControl,
} from "react-map-gl";

import useSupercluster from "use-supercluster";

const { REACT_APP_MAPBOX_TOKEN } = process.env;

function App() {
  const [viewport, setViewport] = useState({
    latitude: 59.913727,
    longitude: 10.731024,
    width: "100vw",
    height: "100vh",
    zoom: 11.4,
  });
  const mapRef = useRef();

  const navControlStyle = {
    position: "absolute",
    right: 10,
    top: 10,
  };

  const [voiScooters, setVoiScooters] = useState([]);
  const voiUrl = "https://api.entur.io/mobility/v2/gbfs/voi/free_bike_status";

  const points = voiScooters.map((voi, index) => ({
    key: index,
    type: "Feature",
    properties: {
      cluster: false,
      voiId: voi.id,
      category: "category",
    },
    geometry: {
      type: "Point",
      coordinates: [voi.lon, voi.lat],
    },
  }));

  const bounds = mapRef.current
    ? mapRef.current.getMap().getBounds().toArray().flat()
    : null;

  const { clusters, supercluster } = useSupercluster({
    points,
    zoom: viewport.zoom,
    bounds,
    options: { radius: 75, maxZoom: 20 },
  });

  async function fetchVoiScooters() {
    const response = await fetch(voiUrl);
    const voiData = await response.json();
    setVoiScooters(voiData.data.bikes);
  }

  useEffect(() => {
    fetchVoiScooters();
  }, []);

  return (
    <div className="App">
      <div className="hero-container">
        <h1 className="logo">
          where
          <strong>.voi</strong>
        </h1>
      </div>
      <ReactMapGL
                    style={{zIndex: 2}}
        {...viewport}
        mapStyle="mapbox://styles/mapbox/dark-v10"
        maxZoom={20}
        mapboxApiAccessToken={REACT_APP_MAPBOX_TOKEN}
        onViewportChange={(newViewport) => {
          setViewport({ ...newViewport });
        }}
        ref={mapRef}
      >
        <div style={{position: "absolute", right: 20, top: 20, zIndex: 10}}>
        <NavigationControl style={{border: "2px red solid"}}  />
        </div>
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } =
            cluster.properties;

          if (isCluster) {
            return (
              <Marker
                key={cluster.id}
                latitude={latitude}
                longitude={longitude}
              >
                <div
                  className="cluster-marker"
                  style={{
                    width: `${10 + (pointCount / points.length) * 30}px`,
                    height: `${10 + (pointCount / points.length) * 30}px`,
                  }}
                  onClick={() => {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id),
                      20
                    );
                    setViewport({
                      ...viewport,
                      latitude,
                      longitude,
                      zoom: expansionZoom,
                      transitionInterpolator: new FlyToInterpolator({
                        speed: 2,
                      }),
                      transitionDuration: "auto",
                    });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }
          return (
            <Marker
              key={cluster.properties.voiId}
              latitude={latitude}
              longitude={longitude}
            >
              <button className="scooter-marker">
                <img src="./voi.png" alt="" />
              </button>
            </Marker>
          );
        })}
      </ReactMapGL>
    </div>
  );
}

export default App;
