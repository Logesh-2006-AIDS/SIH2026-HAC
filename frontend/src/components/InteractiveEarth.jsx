import React, { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';

export default function InteractiveEarth() {
  const globeRef = useRef();
  const { scene } = useThree();
  const [countries, setCountries] = useState(null);
  const globeInstance = useRef(null);

  useEffect(() => {
    // Fetch GeoJSON data for countries
    fetch('https://unpkg.com/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(countriesData => {
        setCountries(countriesData.features);
      });
  }, []);

  useEffect(() => {
    if (!countries || globeInstance.current) return;

    // Generate dense random network data
    const N_NODES = 800;
    const gData = [...Array(N_NODES).keys()].map(() => ({
      lat: (Math.random() - 0.5) * 160,
      lng: (Math.random() - 0.5) * 360,
      size: Math.random() * 0.5 + 0.1,
      color: '#ff2222'
    }));

    const N_ARCS = 400;
    const arcsData = [...Array(N_ARCS).keys()].map(() => ({
      startLat: (Math.random() - 0.5) * 160,
      startLng: (Math.random() - 0.5) * 360,
      endLat: (Math.random() - 0.5) * 160,
      endLng: (Math.random() - 0.5) * 360,
      color: ['#ff0000', '#ff3333', '#aa0000'][Math.floor(Math.random() * 3)]
    }));

    // Add specific arcs connecting to India
    for(let i=0; i<30; i++) {
      arcsData.push({
        startLat: 20 + (Math.random() - 0.5) * 10,
        startLng: 80 + (Math.random() - 0.5) * 10,
        endLat: (Math.random() - 0.5) * 160,
        endLng: (Math.random() - 0.5) * 360,
        color: '#ff4444'
      });
    }

    // Create the ThreeGlobe instance
    const Globe = new ThreeGlobe({ animateIn: false })
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg') // Dark base
      .polygonsData(countries)
      .polygonCapColor(feat => feat.properties.ISO_A2 === 'IN' ? 'rgba(255, 0, 0, 0.6)' : 'rgba(10, 0, 0, 0.8)')
      .polygonSideColor(() => 'rgba(0, 0, 0, 0)')
      .polygonStrokeColor(feat => feat.properties.ISO_A2 === 'IN' ? '#ff0000' : 'rgba(255, 50, 50, 0.6)')
      .polygonAltitude(feat => feat.properties.ISO_A2 === 'IN' ? 0.02 : 0.01)
      
      // Nodes
      .pointsData(gData)
      .pointColor('color')
      .pointAltitude(0.01)
      .pointRadius('size')
      
      // Arcs
      .arcsData(arcsData)
      .arcColor('color')
      .arcDashLength(0.4)
      .arcDashGap(4)
      .arcDashInitialGap(() => Math.random() * 5)
      .arcDashAnimateTime(2000)
      .arcAltitudeAutoScale(0.3)
      .arcStroke(0.3);

    // Customize the globe material
    const globeMaterial = Globe.globeMaterial();
    globeMaterial.color = new THREE.Color(0x020000);
    globeMaterial.emissive = new THREE.Color(0x220000);
    globeMaterial.emissiveIntensity = 0.2;
    globeMaterial.shininess = 0.8;

    // Add a custom red glow (atmosphere)
    const atmosphereGeometry = new THREE.SphereGeometry(Globe.getGlobeRadius() * 1.15, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    Globe.add(atmosphere);

    // Outer faint glow
    const outerGlowGeo = new THREE.SphereGeometry(Globe.getGlobeRadius() * 1.3, 64, 64);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    Globe.add(outerGlow);

    if (globeRef.current) {
      globeRef.current.add(Globe);
      globeInstance.current = Globe;
    }

    // Set initial rotation to show India
    Globe.rotation.y = -Math.PI / 3;
    Globe.rotation.x = Math.PI / 12;

    // Cleanup
    return () => {
      if (globeRef.current && globeInstance.current) {
        globeRef.current.remove(globeInstance.current);
        globeInstance.current = null;
      }
    };
  }, [countries]);

  // Mouse parallax logic
  useFrame((state) => {
    if (globeRef.current) {
      const targetY = state.mouse.x * 0.5;
      const targetX = -state.mouse.y * 0.5;
      globeRef.current.rotation.y = THREE.MathUtils.lerp(globeRef.current.rotation.y, targetY, 0.05);
      globeRef.current.rotation.x = THREE.MathUtils.lerp(globeRef.current.rotation.x, targetX, 0.05);
    }
  });

  return (
    <>
      <ambientLight color={0xffaaaa} intensity={0.5} />
      <directionalLight color={0xff0000} intensity={3} position={[10, 5, 10]} />
      <directionalLight color={0xff2222} intensity={1} position={[-10, -5, -10]} />
      <pointLight color={0xff0000} intensity={2} position={[0, 0, 200]} />
      
      <group ref={globeRef} />

    </>
  );
}
