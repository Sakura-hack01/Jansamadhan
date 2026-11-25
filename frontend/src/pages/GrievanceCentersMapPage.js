import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import {
  FiMapPin, FiNavigation, FiSearch, FiVolume2, FiVolumeX,
  FiClock, FiPhone, FiCheckSquare, FiSquare, FiExternalLink,
  FiArrowLeft, FiCrosshair, FiChevronRight, FiChevronLeft,
  FiPrinter, FiShield, FiUsers, FiInfo
} from 'react-icons/fi';
import { RiGovernmentLine } from 'react-icons/ri';
import api from '../utils/api';
import { FALLBACK_CENTERS } from '../data/grievanceCenters';

const TYPE_META = {
  central: { label: 'Central Govt', color: '#000080', bg: '#eff6ff' },
  state: { label: 'State Jan Sunwai', color: '#138808', bg: '#dcfce7' },
  district: { label: 'District Collectorate', color: '#d97706', bg: '#fef3c7' },
  appellate: { label: 'Appellate (DPG)', color: '#7c3aed', bg: '#f3e8ff' },
  csc: { label: 'Citizen Seva / CSC', color: '#0284c7', bg: '#e0f2fe' },
};

const PROFILES = [
  { id: 'driving', label: 'Car / Auto', osrm: 'driving', icon: '🚗', speedKmh: 28 },
  { id: 'bike', label: 'Two-Wheeler', osrm: 'bike', icon: '🛵', speedKmh: 24 },
  { id: 'foot', label: 'Walking', osrm: 'foot', icon: '🚶', speedKmh: 4.8 },
];

const DEFAULT_DOCS = [
  'Original Aadhaar Card / Voter ID / Govt Photo ID',
  'Signed Written Grievance Application (or Reference Printout)',
  'Supporting Documents / Receipts / Photos (photocopies)',
  'Previous Complaint Number (if filing Reminder or Appeal)',
];

function formatDistance(meters) {
  if (meters == null) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${Math.max(1, mins)} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getManeuverArrow(type, modifier = '') {
  const m = modifier.toLowerCase();
  if (type === 'arrive') return '⚑';
  if (type === 'depart') return '▶';
  if (type === 'roundabout' || type === 'rotary') return '⟳';
  if (m.includes('uturn')) return '↶';
  if (m.includes('sharp left')) return '↰';
  if (m.includes('slight left')) return '↖';
  if (m.includes('left')) return '←';
  if (m.includes('sharp right')) return '↱';
  if (m.includes('slight right')) return '↗';
  if (m.includes('right')) return '→';
  return '↑';
}

function buildHumanInstruction(step) {
  const type = step.maneuver?.type || 'continue';
  const mod = step.maneuver?.modifier || '';
  const road = step.name ? ` onto ${step.name}` : '';
  const distText = formatDistance(step.distance);

  if (type === 'depart') return `Head ${mod || 'forward'}${road} (${distText})`;
  if (type === 'arrive') return `Arrive at your physical grievance center on the ${mod || 'destination'}`;
  if (type === 'roundabout' || type === 'rotary') {
    const exit = step.maneuver?.exit ? `take exit ${step.maneuver.exit}` : 'exit';
    return `At the roundabout, ${exit}${road} in ${distText}`;
  }
  if (type === 'turn' || type === 'end of road' || type === 'fork') {
    return `Turn ${mod || 'ahead'}${road} after ${distText}`;
  }
  if (type === 'merge') return `Merge ${mod || ''}${road} in ${distText}`;
  if (type === 'new name' || type === 'continue') return `Continue ${mod || 'straight'}${road} for ${distText}`;
  return `${type.replace(/_/g, ' ')} ${mod}${road} (${distText})`;
}

function isCenterOpenNow(center) {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + 5.5 * 3600000);
  const day = ist.getDay(); // 0=Sun, 6=Sat
  const hourDecimal = ist.getHours() + ist.getMinutes() / 60;

  if (day === 0) return { open: false, text: 'Closed Today (Sunday)' };
  if (day === 6 && !String(center.workingDays || '').includes('Sat')) {
    return { open: false, text: 'Closed Today (Saturday)' };
  }
  const openH = center.openHour ?? 9.5;
  const closeH = center.closeHour ?? 17.5;
  const fmtH = (h) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    const period = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
  };
  if (hourDecimal >= openH && hourDecimal < closeH) {
    return { open: true, text: `Open Now · Closes ${fmtH(closeH)}` };
  }
  return { open: false, text: `Closed · Opens ${fmtH(openH)}` };
}

export default function GrievanceCentersMapPage({ embedded = false }) {
  const [centers, setCenters] = useState(FALLBACK_CENTERS);
  const [typeFilter, setTypeFilter] = useState('all');
  const [wheelchairOnly, setWheelchairOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Origin Location (default: New Delhi Central)
  const [origin, setOrigin] = useState({
    lat: 28.6315,
    lng: 77.2167,
    label: 'Connaught Place, New Delhi (Default)',
  });
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [pickOnMapMode, setPickOnMapMode] = useState(false);
  const [liveGpsActive, setLiveGpsActive] = useState(false);

  // Selected Destination & Navigation State
  const [selectedCenter, setSelectedCenter] = useState(FALLBACK_CENTERS[0]);
  const [travelProfile, setTravelProfile] = useState('driving');
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // Citizen Readiness & Visit Pass Novelty
  const [checkedDocs, setCheckedDocs] = useState({});
  const [visitPass, setVisitPass] = useState(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitSlot, setVisitSlot] = useState('10:30 AM - 11:30 AM');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const originMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const pickModeRef = useRef(false);

  useEffect(() => {
    pickModeRef.current = pickOnMapMode;
  }, [pickOnMapMode]);

  // Fetch centers from backend (fallback to local dataset if offline)
  useEffect(() => {
    let cancelled = false;
    api
      .get('/centers')
      .then(({ data }) => {
        if (!cancelled && Array.isArray(data?.data) && data.data.length > 0) {
          setCenters(data.data);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Compute filtered & distance-sorted centers
  const filteredCenters = useMemo(() => {
    return centers
      .filter((c) => {
        if (typeFilter !== 'all' && c.type !== typeFilter) return false;
        if (wheelchairOnly && !c.facilities?.wheelchairAccessible) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const hay = [
            c.name,
            c.departmentName,
            c.address?.city,
            c.address?.state,
            c.address?.pincode,
            c.address?.street,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((c) => {
        const meters = haversineMeters(origin.lat, origin.lng, c.lat, c.lng);
        return { ...c, distanceMeters: meters, distanceKm: Number((meters / 1000).toFixed(2)) };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [centers, typeFilter, wheelchairOnly, searchQuery, origin]);

  // Speak turn instruction aloud
  const speakInstruction = useCallback(
    (text) => {
      if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-IN';
        utter.rate = 0.98;
        window.speechSynthesis.speak(utter);
      } catch {}
    },
    [voiceEnabled]
  );

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [origin.lat, origin.lng],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (e) => {
      if (!pickModeRef.current) return;
      const { lat, lng } = e.latlng;
      setOrigin({
        lat,
        lng,
        label: `Map Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      });
      setPickOnMapMode(false);
      toast.success('Starting location updated from map click!');
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Render Origin & Center Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Pulsing User Origin Pin
    const originIcon = L.divIcon({
      className: 'js-origin-pin',
      html: `<div class="gps-pulse-dot"><div class="gps-pulse-ring"></div></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    originMarkerRef.current = L.marker([origin.lat, origin.lng], { icon: originIcon })
      .bindPopup(`<strong>Your Starting Location</strong><br/>${origin.label}`)
      .addTo(layer);

    // Physical Grievance Center Markers
    filteredCenters.forEach((center) => {
      const meta = TYPE_META[center.type] || TYPE_META.district;
      const isSelected = selectedCenter?._id === center._id;
      const pinIcon = L.divIcon({
        className: 'js-center-pin',
        html: `<div style="
          width:${isSelected ? 34 : 26}px;
          height:${isSelected ? 34 : 26}px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:${isSelected ? '#FF9933' : meta.color};
          border:3px solid #fff;
          box-shadow:0 4px 12px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;
        "><span style="transform:rotate(45deg);color:#fff;font-size:${isSelected ? 14 : 11}px;font-weight:800;">🏛</span></div>`,
        iconSize: [isSelected ? 34 : 26, isSelected ? 34 : 26],
        iconAnchor: [isSelected ? 17 : 13, isSelected ? 34 : 26],
      });

      const marker = L.marker([center.lat, center.lng], { icon: pinIcon }).addTo(layer);
      marker.bindPopup(
        `<div style="min-width:200px">
          <div style="font-weight:800;color:#000080;font-size:13px;margin-bottom:4px">${center.name}</div>
          <div style="font-size:11.5px;color:#475569;margin-bottom:4px">${center.address?.street}, ${center.address?.city}</div>
          <div style="font-size:11.5px;font-weight:700;color:#138808">${formatDistance(center.distanceMeters)} away</div>
        </div>`
      );
      marker.on('click', () => {
        setSelectedCenter(center);
      });
    });
  }, [filteredCenters, origin, selectedCenter]);

  // Fetch Turn-by-Turn Route from OSRM whenever origin, destination, or travel profile changes
  const fetchRoute = useCallback(async () => {
    if (!selectedCenter) return;
    setRouteLoading(true);
    setActiveStepIdx(0);

    const profileObj = PROFILES.find((p) => p.id === travelProfile) || PROFILES[0];
    const url = `https://router.project-osrm.org/route/v1/${profileObj.osrm}/${origin.lng},${origin.lat};${selectedCenter.lng},${selectedCenter.lat}?overview=full&geometries=geojson&steps=true`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Routing unavailable');
      const data = await res.json();
      if (!data.routes || !data.routes.length) throw new Error('No route found');

      const route = data.routes[0];
      const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const rawSteps = (route.legs || []).flatMap((leg) => leg.steps || []);
      const steps = rawSteps.map((s, idx) => ({
        idx,
        distance: s.distance,
        duration: s.duration,
        name: s.name || 'Unnamed road',
        type: s.maneuver?.type || 'continue',
        modifier: s.maneuver?.modifier || '',
        location: s.maneuver?.location ? [s.maneuver.location[1], s.maneuver.location[0]] : null,
        instruction: buildHumanInstruction(s),
        arrow: getManeuverArrow(s.maneuver?.type, s.maneuver?.modifier),
      }));

      setRouteData({
        isFallback: false,
        distanceMeters: route.distance,
        durationSeconds: route.duration,
        coords,
        steps,
      });

      if (steps[0]) speakInstruction(steps[0].instruction);
    } catch {
      // Graceful Fallback: Direct route + estimated turns
      const straightMeters = haversineMeters(origin.lat, origin.lng, selectedCenter.lat, selectedCenter.lng);
      const estRoadMeters = straightMeters * 1.22;
      const estSeconds = (estRoadMeters / 1000 / profileObj.speedKmh) * 3600;
      const midLat = (origin.lat + selectedCenter.lat) / 2;
      const midLng = (origin.lng + selectedCenter.lng) / 2;

      setRouteData({
        isFallback: true,
        distanceMeters: estRoadMeters,
        durationSeconds: estSeconds,
        coords: [
          [origin.lat, origin.lng],
          [selectedCenter.lat, selectedCenter.lng],
        ],
        steps: [
          {
            idx: 0,
            distance: estRoadMeters * 0.5,
            duration: estSeconds * 0.5,
            name: 'Approach Route',
            type: 'depart',
            modifier: 'ahead',
            location: [origin.lat, origin.lng],
            instruction: `Depart from ${origin.label} toward ${selectedCenter.address?.city} (${formatDistance(estRoadMeters * 0.5)})`,
            arrow: '▶',
          },
          {
            idx: 1,
            distance: estRoadMeters * 0.5,
            duration: estSeconds * 0.5,
            name: selectedCenter.address?.street || selectedCenter.name,
            type: 'continue',
            modifier: 'straight',
            location: [midLat, midLng],
            instruction: `Continue toward ${selectedCenter.address?.street || selectedCenter.name} for ${formatDistance(estRoadMeters * 0.5)}`,
            arrow: '↑',
          },
          {
            idx: 2,
            distance: 0,
            duration: 0,
            name: selectedCenter.name,
            type: 'arrive',
            modifier: 'ahead',
            location: [selectedCenter.lat, selectedCenter.lng],
            instruction: `Arrive at ${selectedCenter.name}`,
            arrow: '⚑',
          },
        ],
      });
    } finally {
      setRouteLoading(false);
    }
  }, [origin, selectedCenter, travelProfile, speakInstruction]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Draw Route Polyline & Turn Waypoints on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = routeLayerRef.current;
    if (!map || !layer || !routeData) return;

    layer.clearLayers();

    if (routeData.coords?.length) {
      // Outer Navy casing + Inner Saffron/Blue route line
      L.polyline(routeData.coords, {
        color: '#000080',
        weight: 7,
        opacity: 0.85,
      }).addTo(layer);

      L.polyline(routeData.coords, {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.95,
        dashArray: routeData.isFallback ? '8 8' : undefined,
      }).addTo(layer);

      // Step markers for turn maneuvers
      routeData.steps.forEach((step, idx) => {
        if (!step.location || idx === 0 || idx === routeData.steps.length - 1) return;
        const isCurrent = idx === activeStepIdx;
        const dot = L.circleMarker(step.location, {
          radius: isCurrent ? 8 : 5,
          color: '#fff',
          weight: 2,
          fillColor: isCurrent ? '#FF9933' : '#000080',
          fillOpacity: 1,
        }).addTo(layer);
        dot.bindTooltip(`Step ${idx + 1}: ${step.instruction}`, { direction: 'top' });
        dot.on('click', () => {
          setActiveStepIdx(idx);
          speakInstruction(step.instruction);
        });
      });

      const bounds = L.latLngBounds(routeData.coords);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
    }
  }, [routeData, activeStepIdx, speakInstruction]);

  // Geolocation: Use Current GPS Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    const toastId = toast.loading('Detecting your current GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setOrigin({
          lat: latitude,
          lng: longitude,
          label: `My Current GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
        });
        toast.success('Current location set! Routes updated.', { id: toastId });
      },
      (err) => {
        toast.error(err.message || 'Location permission denied. Enter an address or click on the map instead.', {
          id: toastId,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Live GPS Follow Mode (updates origin as user walks/drives)
  useEffect(() => {
    if (!liveGpsActive) {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }
    if (!navigator.geolocation) {
      toast.error('Live GPS tracking is not supported in this browser.');
      setLiveGpsActive(false);
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: 'Live GPS Tracking Active',
        });
      },
      () => {
        toast.error('Unable to maintain live GPS lock.');
        setLiveGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [liveGpsActive]);

  // Search manual starting address via Nominatim
  const handleSearchOriginAddress = async (e) => {
    e.preventDefault();
    if (!locationQuery.trim()) return;
    setSearchingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=5&q=${encodeURIComponent(
          locationQuery
        )}`
      );
      const results = await res.json();
      if (!results.length) {
        toast.error('Address not found in India. Try a city name, area, or pincode.');
        setLocationSuggestions([]);
      } else {
        setLocationSuggestions(results);
      }
    } catch {
      toast.error('Address lookup failed. You can click directly on the map to set your location.');
    } finally {
      setSearchingLocation(false);
    }
  };

  const selectSuggestion = (item) => {
    setOrigin({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      label: item.display_name.split(',').slice(0, 3).join(','),
    });
    setLocationSuggestions([]);
    setLocationQuery(item.display_name.split(',').slice(0, 2).join(','));
    toast.success('Starting point updated!');
  };

  const focusStepOnMap = (idx) => {
    if (!routeData?.steps?.[idx]) return;
    setActiveStepIdx(idx);
    const step = routeData.steps[idx];
    if (step.location && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(step.location, 16, { duration: 0.6 });
    }
    speakInstruction(step.instruction);
  };

  const handleGenerateVisitPass = (e) => {
    e.preventDefault();
    const tokenNo = `JSV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setVisitPass({
      tokenNo,
      visitorName: visitorName.trim() || 'Citizen Visitor',
      slot: visitSlot,
      centerName: selectedCenter.name,
      address: `${selectedCenter.address?.street}, ${selectedCenter.address?.city}, ${selectedCenter.address?.state} - ${selectedCenter.address?.pincode}`,
      issuedAt: new Date().toLocaleString('en-IN'),
    });
    toast.success(`Visit Pass ${tokenNo} generated!`);
  };

  const activeStep = routeData?.steps?.[activeStepIdx];
  const openStatus = selectedCenter ? isCenterOpenNow(selectedCenter) : null;
  const googleMapsUrl = selectedCenter
    ? `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${selectedCenter.lat},${selectedCenter.lng}`
    : '#';

  return (
    <div style={{ minHeight: embedded ? 'auto' : '100vh', background: '#f1f5f9' }}>
      {!embedded && (
        <>
          <div className="tricolor-bar" />
          <header style={{ background: '#000080', color: '#fff', padding: '14px 24px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.14)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                  <FiArrowLeft size={15} /> Home
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src="/emblem.png" alt="Emblem" style={{ height: 38, width: 38, background: '#fff', padding: 3, borderRadius: 8 }} />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Poppins, sans-serif', lineHeight: 1.1 }}>JanSamadhan Physical Centers Navigator</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)' }}>Turn-by-Turn Route Guidance to Official Grievance Offices Across India</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/login" style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.35)', color: '#fff', fontSize: 13, fontWeight: 600 }}>Sign In</Link>
                <Link to="/register" style={{ padding: '8px 16px', borderRadius: 8, background: '#FF9933', color: '#fff', fontSize: 13, fontWeight: 700 }}>Register</Link>
              </div>
            </div>
          </header>
        </>
      )}

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: embedded ? '4px 0 24px' : '22px 20px 36px' }}>
        {/* Header / Origin Location Controls */}
        <div style={panelCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiGovernmentLine /> Physical Grievance Centers &amp; Live Route Guidance
              </h1>
              <p style={{ fontSize: 13, color: '#475569', margin: '3px 0 0' }}>
                Starting from: <strong style={{ color: '#000080' }}>{origin.label}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={handleUseCurrentLocation} style={primaryBtn}>
                <FiCrosshair size={15} /> Use Current GPS
              </button>
              <button
                type="button"
                onClick={() => setLiveGpsActive((v) => !v)}
                style={{ ...outlineBtn, background: liveGpsActive ? '#dcfce7' : '#fff', borderColor: liveGpsActive ? '#16a34a' : '#cbd5e1', color: liveGpsActive ? '#15803d' : '#334155' }}
              >
                <FiNavigation size={14} /> {liveGpsActive ? 'Live GPS: ON' : 'Live Follow'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPickOnMapMode((v) => !v);
                  if (!pickOnMapMode) toast('Click anywhere on the map to set your starting location.');
                }}
                style={{ ...outlineBtn, background: pickOnMapMode ? '#fef3c7' : '#fff', borderColor: pickOnMapMode ? '#d97706' : '#cbd5e1', color: pickOnMapMode ? '#92400e' : '#334155' }}
              >
                <FiMapPin size={14} /> {pickOnMapMode ? 'Click Map Now...' : 'Pick Start on Map'}
              </button>
            </div>
          </div>

          {/* Manual Address Input + Center Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }} className="responsive-2col">
            <div style={{ position: 'relative' }}>
              <form onSubmit={handleSearchOriginAddress} style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <FiSearch size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Enter your starting address, area, or pincode (e.g. Karol Bagh, 110005)"
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                </div>
                <button type="submit" disabled={searchingLocation} style={navySmallBtn}>
                  {searchingLocation ? 'Finding...' : 'Set Start'}
                </button>
              </form>
              {locationSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.12)', zIndex: 500, marginTop: 4, overflow: 'hidden' }}>
                  {locationSuggestions.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => selectSuggestion(item)}
                      style={{ padding: '10px 14px', fontSize: 13, color: '#0f172a', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                    >
                      📍 {item.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter centers by city, state, dept..."
                style={{ ...inputStyle, flex: 1, minWidth: 160 }}
              />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                <option value="all">All Center Types</option>
                <option value="central">Central Ministry</option>
                <option value="appellate">Appellate (DPG)</option>
                <option value="state">State Jan Sunwai</option>
                <option value="district">District Collectorate</option>
                <option value="csc">Citizen Seva / CSC</option>
              </select>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 10px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={wheelchairOnly} onChange={(e) => setWheelchairOnly(e.target.checked)} />
                ♿ Accessible
              </label>
            </div>
          </div>
        </div>

        {/* Main 2-Column Workspace: Left Center Directory + Right Interactive Map & Turn Guidance */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 18, marginTop: 18 }} className="responsive-2col">
          {/* Left Column: Physical Centers List */}
          <div style={{ ...panelCard, padding: 16, maxHeight: 760, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#000080' }}>
                {filteredCenters.length} Physical Centers (Nearest First)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredCenters.map((c) => {
                const meta = TYPE_META[c.type] || TYPE_META.district;
                const isSel = selectedCenter?._id === c._id;
                const openInfo = isCenterOpenNow(c);
                return (
                  <div
                    key={c._id}
                    onClick={() => {
                      setSelectedCenter(c);
                      setVisitPass(null);
                    }}
                    style={{
                      padding: 14,
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: `2px solid ${isSel ? '#000080' : '#e2e8f0'}`,
                      background: isSel ? '#eff6ff' : '#fff',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#000080' }}>
                        {formatDistance(c.distanceMeters)}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 6 }}>
                      {c.address?.street}, {c.address?.city}, {c.address?.state}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
                      <span style={{ color: openInfo.open ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
                        ● {openInfo.open ? 'Open Now' : 'Closed'}
                      </span>
                      <span style={{ color: '#64748b' }}>Wait ~{c.avgWaitMinutes || 15} mins</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live Navigation HUD + Leaflet Map + Turn-by-Turn + Readiness */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Active Turn-by-Turn Navigation HUD */}
            <div style={{ background: 'linear-gradient(135deg, #000066, #000080)', color: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 10px 25px rgba(0,0,80,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {PROFILES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTravelProfile(p.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12.5,
                        fontWeight: 700,
                        background: travelProfile === p.id ? '#FF9933' : 'rgba(255,255,255,0.14)',
                        color: '#fff',
                      }}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !voiceEnabled;
                      setVoiceEnabled(next);
                      toast.success(next ? 'Voice turn guidance enabled' : 'Voice guidance muted');
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                      background: voiceEnabled ? '#138808' : 'rgba(255,255,255,0.14)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {voiceEnabled ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
                    {voiceEnabled ? 'Voice ON' : 'Voice OFF'}
                  </button>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: '#fff', color: '#000080', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}
                  >
                    Google Maps <FiExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Next Turn Instruction Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: '#FF9933', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, flexShrink: 0 }}>
                    {routeLoading ? '…' : activeStep?.arrow || '↑'}
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#FFB366', fontWeight: 700 }}>
                      {routeData ? `Step ${activeStepIdx + 1} of ${routeData.steps.length}` : 'Calculating route'}
                      {routeData?.isFallback && ' · Estimated Direct Guidance'}
                    </div>
                    <div style={{ fontSize: 16.5, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                      {routeLoading
                        ? 'Calculating turn-by-turn route...'
                        : activeStep?.instruction || `Navigate to ${selectedCenter?.name}`}
                    </div>
                    {routeData && (
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 3 }}>
                        Total Distance: <strong>{formatDistance(routeData.distanceMeters)}</strong> &middot; Est. Time: <strong>{formatDuration(routeData.durationSeconds)}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {routeData?.steps?.length > 1 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      disabled={activeStepIdx <= 0}
                      onClick={() => focusStepOnMap(activeStepIdx - 1)}
                      style={{ ...stepNavBtn, opacity: activeStepIdx <= 0 ? 0.45 : 1 }}
                    >
                      <FiChevronLeft size={16} /> Prev
                    </button>
                    <button
                      type="button"
                      disabled={activeStepIdx >= routeData.steps.length - 1}
                      onClick={() => focusStepOnMap(activeStepIdx + 1)}
                      style={{ ...stepNavBtn, opacity: activeStepIdx >= routeData.steps.length - 1 ? 0.45 : 1 }}
                    >
                      Next Turn <FiChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Map Canvas */}
            <div style={{ ...panelCard, padding: 8, overflow: 'hidden' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: 390, borderRadius: 12, zIndex: 1 }} />
            </div>

            {/* Turn-by-Turn Maneuvers + Center Readiness & Visit Token */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="responsive-2col">
              {/* Step-by-Step Meter Guidance */}
              <div style={{ ...panelCard, maxHeight: 420, overflowY: 'auto' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 12 }}>
                  🧭 Turn-by-Turn Meter Guidance
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(routeData?.steps || []).map((step, idx) => {
                    const isCurr = idx === activeStepIdx;
                    return (
                      <div
                        key={idx}
                        onClick={() => focusStepOnMap(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: 10,
                          cursor: 'pointer',
                          background: isCurr ? '#eff6ff' : '#f8fafc',
                          border: `1px solid ${isCurr ? '#000080' : '#e2e8f0'}`,
                        }}
                      >
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: isCurr ? '#000080' : '#e2e8f0', color: isCurr ? '#fff' : '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                          {step.arrow}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{step.instruction}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>
                            {step.distance > 0 ? `${formatDistance(step.distance)} · ${formatDuration(step.duration)}` : 'Final Destination'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Center Details, Checklist & Visit Token Pass */}
              {selectedCenter && (
                <div style={{ ...panelCard, maxHeight: 420, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
                        {selectedCenter.name}
                      </h3>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{selectedCenter.departmentName}</div>
                    </div>
                    {openStatus && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: openStatus.open ? '#dcfce7' : '#fee2e2', color: openStatus.open ? '#15803d' : '#b91c1c', whiteSpace: 'nowrap' }}>
                        {openStatus.text}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 12.5, color: '#334155', display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div><FiMapPin size={13} style={{ marginRight: 5 }} /> {selectedCenter.address?.street}, {selectedCenter.address?.landmark}, {selectedCenter.address?.city} - {selectedCenter.address?.pincode}</div>
                    <div><FiPhone size={13} style={{ marginRight: 5 }} /> Helpline: <strong>{selectedCenter.phone}</strong> &middot; <FiClock size={13} /> {selectedCenter.workingDays}</div>
                    {selectedCenter.nearestTransit && <div>🚇 Nearest Transit: <strong>{selectedCenter.nearestTransit}</strong></div>}
                    <div><FiUsers size={13} style={{ marginRight: 5 }} /> Crowd: <strong style={{ textTransform: 'capitalize' }}>{selectedCenter.crowdLevel}</strong> (~{selectedCenter.avgWaitMinutes} min wait)</div>
                  </div>

                  {/* Facilities */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {selectedCenter.facilities?.wheelchairAccessible && <span style={chipStyle}>♿ Wheelchair Ramp</span>}
                    {selectedCenter.facilities?.womensDesk && <span style={chipStyle}>👩 Women&apos;s Desk</span>}
                    {selectedCenter.facilities?.tokenCounter && <span style={chipStyle}>🎫 Token Counter</span>}
                    {selectedCenter.facilities?.photocopyAvailable && <span style={chipStyle}>🖨️ Scan/Copy</span>}
                    {(selectedCenter.languages || []).map((lang) => (
                      <span key={lang} style={{ ...chipStyle, background: '#f1f5f9', color: '#334155' }}>🗣 {lang}</span>
                    ))}
                  </div>

                  {/* Pre-Visit Document Checklist */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#000080', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiInfo size={14} /> Carry These Documents Before Going:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {DEFAULT_DOCS.map((doc) => {
                        const checked = !!checkedDocs[doc];
                        return (
                          <div
                            key={doc}
                            onClick={() => setCheckedDocs((p) => ({ ...p, [doc]: !p[doc] }))}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: checked ? '#15803d' : '#334155', cursor: 'pointer', textDecoration: checked ? 'line-through' : 'none' }}
                          >
                            {checked ? <FiCheckSquare color="#15803d" /> : <FiSquare color="#64748b" />}
                            <span>{doc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Instant Physical Visit Token Pass Generator */}
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#000080', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FiShield size={14} /> Generate Physical Visit Token Pass
                    </div>
                    {!visitPass ? (
                      <form onSubmit={handleGenerateVisitPass} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input
                          value={visitorName}
                          onChange={(e) => setVisitorName(e.target.value)}
                          placeholder="Your Full Name"
                          style={{ ...inputStyle, flex: 1, minWidth: 130, padding: '8px 10px', fontSize: 12.5 }}
                        />
                        <select value={visitSlot} onChange={(e) => setVisitSlot(e.target.value)} style={{ ...inputStyle, width: 'auto', padding: '8px 10px', fontSize: 12.5 }}>
                          <option value="10:30 AM - 11:30 AM">10:30 AM - 11:30 AM</option>
                          <option value="11:30 AM - 1:00 PM">11:30 AM - 1:00 PM</option>
                          <option value="2:30 PM - 4:00 PM">2:30 PM - 4:00 PM</option>
                          <option value="4:00 PM - 5:00 PM">4:00 PM - 5:00 PM</option>
                        </select>
                        <button type="submit" style={{ ...navySmallBtn, padding: '8px 12px', fontSize: 12.5 }}>
                          Get Token
                        </button>
                      </form>
                    ) : (
                      <div style={{ background: '#fff', border: '1px dashed #000080', borderRadius: 10, padding: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#000080', fontSize: 14 }}>{visitPass.tokenNo}</strong>
                          <button type="button" onClick={() => window.print()} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 6, padding: '4px 8px', fontSize: 11.5, fontWeight: 700, color: '#000080', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <FiPrinter size={12} /> Print
                          </button>
                        </div>
                        <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
                          Visitor: <strong>{visitPass.visitorName}</strong> &middot; Slot: <strong>{visitPass.slot}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{visitPass.centerName}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const panelCard = {
  background: '#fff',
  border: '1px solid #cbd5e1',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
};
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: '#f8fafc',
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  color: '#0f172a',
  fontSize: 13.5,
  boxSizing: 'border-box',
};
const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
  borderRadius: 10, background: '#000080', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const outlineBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px',
  borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, cursor: 'pointer',
};
const navySmallBtn = {
  padding: '10px 16px', borderRadius: 10, background: '#000080', color: '#fff',
  fontSize: 13.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
};
const stepNavBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 12px',
  borderRadius: 8, background: 'rgba(255,255,255,0.16)', color: '#fff',
  fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
};
const chipStyle = {
  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
  background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe',
};
