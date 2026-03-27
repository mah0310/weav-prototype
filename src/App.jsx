import { useState, useEffect, useRef } from "react";
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from './lib/supabase';
import { getWeather, getArea } from './lib/api';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const COLORS = [
  { color:"#F9A8B8", grad:"linear-gradient(135deg,#F9A8B8,#F48CA0)" },
  { color:"#FFC078", grad:"linear-gradient(135deg,#FFC078,#F0A858)" },
  { color:"#FFD966", grad:"linear-gradient(135deg,#FFD966,#F5C842)" },
  { color:"#FF9B7B", grad:"linear-gradient(135deg,#FF9B7B,#F07858)" },
  { color:"#8DD9A8", grad:"linear-gradient(135deg,#8DD9A8,#66C88A)" },
  { color:"#7EC8E8", grad:"linear-gradient(135deg,#7EC8E8,#58B0D8)" },
  { color:"#C8A0E8", grad:"linear-gradient(135deg,#C8A0E8,#B080D8)" },
  { color:"#80D4C8", grad:"linear-gradient(135deg,#80D4C8,#58C0B2)" },
];

// Mock pins with real Tokyo lat/lng (shown when Supabase not configured)
const MOCK_PINS = [
  { id:1, color:"#F9A8B8", grad:"linear-gradient(135deg,#F9A8B8,#F48CA0)", photo:"sakura", text:"帰り道の桜、今年もきれいだった", date:"2026-03-22", time:"17:42", weather:"sunny", temp:18, area:"渋谷区", lat:35.6614, lng:139.7000 },
  { id:2, color:"#FFC078", grad:"linear-gradient(135deg,#FFC078,#F0A858)", photo:"cafe",   text:"窓際の光がよかった",               date:"2026-03-20", time:"14:15", weather:"cloudy", temp:15, area:"目黒区", lat:35.6400, lng:139.6988 },
  { id:3, color:"#FFD966", grad:"linear-gradient(135deg,#FFD966,#F5C842)", photo:"cat",    text:"",                                 date:"2026-03-18", time:"12:30", weather:"sunny", temp:20, area:"港区",   lat:35.6569, lng:139.7510 },
  { id:4, color:"#FF9B7B", grad:"linear-gradient(135deg,#FF9B7B,#F07858)", photo:"sunset", text:"この色、写真じゃ伝わらないけど",  date:"2026-03-15", time:"17:58", weather:"sunny", temp:16, area:"渋谷区", lat:35.6580, lng:139.7016 },
  { id:5, color:"#8DD9A8", grad:"linear-gradient(135deg,#8DD9A8,#66C88A)", photo:"bread",  text:"焼きたての匂いにつられた",         date:"2026-03-12", time:"08:20", weather:"rainy", temp:12, area:"新宿区", lat:35.6938, lng:139.7034 },
  { id:6, color:"#7EC8E8", grad:"linear-gradient(135deg,#7EC8E8,#58B0D8)", photo:"puddle", text:"水たまりに映る空",                 date:"2026-03-10", time:"16:45", weather:"rainy", temp:11, area:"港区",   lat:35.6590, lng:139.7430 },
  { id:7, color:"#C8A0E8", grad:"linear-gradient(135deg,#C8A0E8,#B080D8)", photo:"flower", text:"名前は知らないけど好き",           date:"2026-03-08", time:"10:12", weather:"cloudy",temp:14, area:"渋谷区", lat:35.6628, lng:139.7081 },
  { id:8, color:"#80D4C8", grad:"linear-gradient(135deg,#80D4C8,#58C0B2)", photo:"stairs", text:"",                                 date:"2026-03-05", time:"19:00", weather:"sunny", temp:13, area:"品川区", lat:35.6284, lng:139.7387 },
];

// SVG illustrations for mock pins
const PhotoSvg = ({ type, color, size }) => {
  const s = size || 80;
  const svgs = {
    sakura: <svg viewBox="0 0 80 80" width={s} height={s}><rect width="80" height="80" fill={color}/><circle cx="22" cy="28" r="9" fill="rgba(255,255,255,.35)"/><circle cx="58" cy="22" r="7" fill="rgba(255,255,255,.28)"/><circle cx="40" cy="52" r="11" fill="rgba(255,255,255,.3)"/><circle cx="66" cy="56" r="6" fill="rgba(255,255,255,.25)"/><circle cx="14" cy="58" r="7.5" fill="rgba(255,255,255,.2)"/></svg>,
    cafe:   <svg viewBox="0 0 80 80" width={s} height={s}><rect width="80" height="80" fill={color}/><rect x="22" y="32" width="36" height="30" rx="4" fill="rgba(255,255,255,.22)"/><path d="M30 38 Q40 30 50 38" stroke="rgba(255,255,255,.3)" fill="none" strokeWidth="2"/><path d="M26 38 Q40 26 54 38" stroke="rgba(255,255,255,.15)" fill="none" strokeWidth="1.5"/></svg>,
    cat:    <svg viewBox="0 0 80 80" width={s} height={s}><rect width="80" height="80" fill={color}/><circle cx="40" cy="44" r="16" fill="rgba(255,255,255,.2)"/><polygon points="28,30 23,14 35,26" fill="rgba(255,255,255,.22)"/><polygon points="52,30 57,14 45,26" fill="rgba(255,255,255,.22)"/><circle cx="34" cy="41" r="2.5" fill="rgba(255,255,255,.4)"/><circle cx="46" cy="41" r="2.5" fill="rgba(255,255,255,.4)"/></svg>,
    sunset: <svg viewBox="0 0 80 80" width={s} height={s}><rect width="80" height="80" fill={color}/><circle cx="40" cy="48" r="20" fill="rgba(255,255,255,.25)"/><rect x="0" y="50" width="80" height="30" fill="rgba(0,0,0,.08)"/></svg>,
    bread:  <svg viewBox="0 0 80 80" width={s} height={s}><rect width="80" height="80" fill={color}/><ellipse cx="40" cy="42" rx="24" ry="16" fill="rgba(255,255,255,.22)"/><path d="M20 38 Q30 28 40 30 Q50 28 60 38" fill="rgba(255,255,255,.14)"/></svg>,
    puddle: <svg viewBox="0 0 80 80" width={s} height={s}><rect width="80" height="80" fill={color}/><ellipse cx="40" cy="50" rx="28" ry="14" fill="rgba(255,255,255,.18)"/><line x1="30" y1="8" x2="28" y2="32" stroke="rgba(255,255,255,.14)" strokeWidth="1.5"/><line x1="50" y1="5" x2="48" y2="29" stroke="rgba(255,255,255,.14)" strokeWidth="1.5"/><line x1="40" y1="3" x2="39" y2="27" stroke="rgba(255,255,255,.14)" strokeWidth="1.5"/></svg>,
    flower: <svg viewBox="0 0 80 80" width={s} height={s}><rect width="80" height="80" fill={color}/><circle cx="40" cy="34" r="7" fill="rgba(255,255,255,.28)"/><circle cx="32" cy="28" r="6" fill="rgba(255,255,255,.2)"/><circle cx="48" cy="28" r="6" fill="rgba(255,255,255,.2)"/><circle cx="33" cy="40" r="6" fill="rgba(255,255,255,.2)"/><circle cx="47" cy="40" r="6" fill="rgba(255,255,255,.2)"/><line x1="40" y1="44" x2="40" y2="66" stroke="rgba(255,255,255,.18)" strokeWidth="2.5"/></svg>,
    stairs: <svg viewBox="0 0 80 80" width={s} height={s}><rect width="80" height="80" fill={color}/><rect x="14" y="56" width="52" height="6" rx="2" fill="rgba(255,255,255,.18)"/><rect x="20" y="44" width="40" height="6" rx="2" fill="rgba(255,255,255,.18)"/><rect x="26" y="32" width="28" height="6" rx="2" fill="rgba(255,255,255,.18)"/><rect x="32" y="20" width="16" height="6" rx="2" fill="rgba(255,255,255,.18)"/></svg>,
  };
  return svgs[type] || <svg viewBox="0 0 80 80" width={s} height={s}><rect width="80" height="80" fill={color}/></svg>;
};

const WIcon = ({ type, size=14, color="currentColor" }) => {
  if (type==="sunny") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"/></svg>;
  if (type==="cloudy") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M16 13v4m-4-6v8m-4-4v2m10-10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>;
};

const fmtDate = d => { const dt = new Date(d); return `${dt.getMonth()+1}.${dt.getDate()}`; };
const ago = d => { const diff = Math.floor((new Date() - new Date(d)) / 864e5); return diff===0?"today":diff===1?"yesterday":`${diff}d`; };

function dbToPin(m) {
  const dt = new Date(m.created_at);
  return {
    id: m.id,
    color: m.color || COLORS[0].color,
    grad: m.grad || COLORS[0].grad,
    photo: null,
    photoUrl: m.photo_url,
    text: m.caption,
    date: m.created_at.split('T')[0],
    time: `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`,
    weather: m.weather,
    temp: m.temp,
    area: m.area,
    lat: m.lat,
    lng: m.lng,
  };
}

// Pin marker shape (reusable for map and list)
function PinShape({ pin, size=40 }) {
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50% 50% 50% 4px',
      transform: 'rotate(-45deg)',
      overflow: 'hidden',
      border: `${size/14}px solid white`,
      background: pin.grad,
      flexShrink: 0,
    }}>
      <div style={{ transform: 'rotate(45deg) scale(1.42)', width: '100%', height: '100%' }}>
        {pin.photoUrl
          ? <img src={pin.photoUrl} style={{ width:'100%', height:'100%', objectFit:'cover' }} alt="" />
          : <PhotoSvg type={pin.photo} color={pin.color} size={size} />
        }
      </div>
    </div>
  );
}

export default function Weav() {
  const [screen, setScreen]               = useState("map");
  const [pin, setPin]                     = useState(null);
  const [tab, setTab]                     = useState("map");
  const [step, setStep]                   = useState("camera");
  const [note, setNote]                   = useState("");
  const [toast, setToast]                 = useState(false);
  const [filter, setFilter]               = useState("all");
  const [ready, setReady]                 = useState(false);
  const [memories, setMemories]           = useState(supabase ? [] : MOCK_PINS);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [currentLocation, setCurrentLoc] = useState(null);
  const [currentArea, setCurrentArea]     = useState("不明");
  const [currentWeather, setCurrentWx]   = useState({ temp: 15, weather: "sunny" });
  const [locating, setLocating]           = useState(false);
  const [saving, setSaving]               = useState(false);
  const [cameraError, setCameraError]     = useState(null);
  const [locDenied, setLocDenied]         = useState(false);
  const [viewState, setViewState]         = useState({ longitude: 139.6917, latitude: 35.6895, zoom: 12 });

  const videoRef   = useRef(null);
  const streamRef  = useRef(null);
  const canvasRef  = useRef(null);

  // Initial setup
  useEffect(() => {
    setTimeout(() => setReady(true), 250);
    if (supabase) loadMemories();
    getUserLocation();
  }, []);

  // Camera lifecycle
  useEffect(() => {
    if (screen === "record" && step === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [screen, step]);

  // ── Data ──────────────────────────────────────────────
  async function loadMemories() {
    const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false });
    if (data?.length > 0) setMemories(data.map(dbToPin));
  }

  // ── Location ──────────────────────────────────────────
  function getUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = { lat: coords.latitude, lng: coords.longitude };
        setCurrentLoc(loc);
        setLocDenied(false);
        setViewState(v => ({ ...v, latitude: loc.lat, longitude: loc.lng, zoom: 14 }));
      },
      () => { setLocDenied(true); }
    );
  }

  function flyToCurrentLocation() {
    if (currentLocation) {
      setViewState(v => ({ ...v, latitude: currentLocation.lat, longitude: currentLocation.lng, zoom: 14 }));
    } else {
      getUserLocation();
    }
  }

  async function fetchLocationAndWeather() {
    setLocating(true);
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const { latitude: lat, longitude: lng } = pos.coords;
      setCurrentLoc({ lat, lng });
      const [wx, area] = await Promise.all([
        getWeather(lat, lng),
        MAPBOX_TOKEN ? getArea(lat, lng, MAPBOX_TOKEN) : Promise.resolve('不明'),
      ]);
      setCurrentWx(wx);
      setCurrentArea(area);
    } catch {
      // keep defaults
    } finally {
      setLocating(false);
    }
  }

  // ── Camera ────────────────────────────────────────────
  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setCameraError(err.name === 'NotAllowedError' ? 'カメラの許可が必要です' : 'カメラにアクセスできません');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  function capturePhoto() {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    canvas.width  = video.videoWidth  || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.85));
    stopCamera();
    setStep("confirm");
    fetchLocationAndWeather();
  }

  // ── Save ──────────────────────────────────────────────
  async function saveMemory() {
    if (saving) return;
    setSaving(true);

    const { color, grad } = COLORS[Math.floor(Math.random() * COLORS.length)];
    const now = new Date();

    let photo_url = null;
    if (supabase && capturedPhoto) {
      try {
        const blob     = await (await fetch(capturedPhoto)).blob();
        const filename = `${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('photos').upload(filename, blob, { contentType: 'image/jpeg' });
        if (!error) {
          photo_url = supabase.storage.from('photos').getPublicUrl(filename).data.publicUrl;
        }
      } catch (e) { console.error('Upload error:', e); }
    }

    const record = {
      caption:    note,
      lat:        currentLocation?.lat ?? 35.6895,
      lng:        currentLocation?.lng ?? 139.6917,
      area:       currentArea,
      weather:    currentWeather.weather,
      temp:       currentWeather.temp,
      color, grad, photo_url,
      created_at: now.toISOString(),
    };

    if (supabase) {
      const { data } = await supabase.from('memories').insert(record).select().single();
      if (data) setMemories(prev => [dbToPin(data), ...prev]);
    } else {
      setMemories(prev => [{
        id: Date.now(), color, grad,
        photo: null, photoUrl: capturedPhoto,
        text: note,
        date: now.toISOString().split('T')[0],
        time: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
        weather: currentWeather.weather,
        temp:    currentWeather.temp,
        area:    currentArea,
        lat:     record.lat,
        lng:     record.lng,
      }, ...prev]);
    }

    setSaving(false);
    setToast(true);
    setTimeout(() => {
      setToast(false);
      setCapturedPhoto(null);
      setNote("");
      setCurrentArea("不明");
      setCurrentWx({ temp: 15, weather: "sunny" });
      go("map", "map");
      if (currentLocation) {
        setViewState(v => ({ ...v, latitude: currentLocation.lat, longitude: currentLocation.lng, zoom: 14 }));
      }
    }, 1800);
  }

  // ── Navigation ────────────────────────────────────────
  const go = (s, t) => { setScreen(s); if (t) setTab(t); };

  // ── Derived ───────────────────────────────────────────
  const fl = filter === "all" ? memories : memories.filter(p => p.weather === filter);
  const now = new Date();
  const thisMonth = memories.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const areas    = new Set(memories.map(p => p.area).filter(Boolean)).size;
  const clearPct = memories.length > 0
    ? Math.round(memories.filter(p => p.weather === 'sunny').length / memories.length * 100)
    : 0;

  const todayStr = `${now.getMonth()+1}.${now.getDate()}`;

  return (
    <div className="outer" style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"linear-gradient(135deg,#FFF0E8 0%,#F0E8FF 50%,#E8F4FF 100%)", padding:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        .ph{width:375px;height:812px;border-radius:52px;background:#FFFFFF;position:relative;overflow:hidden;
          box-shadow:0 0 0 1px rgba(0,0,0,.06),0 24px 80px rgba(0,0,0,.08),0 8px 24px rgba(0,0,0,.04);
          font-family:'Noto Sans JP','DM Sans',system-ui,sans-serif;color:#1A1A1A}
        .notch{position:absolute;top:0;left:50%;transform:translateX(-50%);width:120px;height:34px;background:#1A1A1A;border-radius:0 0 22px 22px;z-index:999}
        .stbar{position:absolute;top:7px;left:0;right:0;z-index:998;display:flex;justify-content:space-between;padding:0 30px;font:600 12px/1 'DM Sans',sans-serif;color:#1A1A1A}
        .s{position:absolute;inset:0;transition:opacity .35s,transform .35s cubic-bezier(.4,0,.2,1)}
        .s.off{opacity:0;pointer-events:none;transform:translateY(8px)}
        .s.on{opacity:1;pointer-events:auto;transform:none}
        .s.up{transform:translateY(100%);opacity:1}
        .s.up.on{transform:none;transition:transform .42s cubic-bezier(.32,.72,0,1)}

        .mbg{position:absolute;top:0;left:0;right:0;bottom:80px;overflow:hidden}
        .fkmap{position:absolute;inset:0;background:linear-gradient(160deg,#F8F6F4,#EDE9E5);overflow:hidden}
        .mg{position:absolute;inset:-10px;opacity:.06;background-image:linear-gradient(#AAA .5px,transparent .5px),linear-gradient(90deg,#AAA .5px,transparent .5px);background-size:44px 44px}
        .rd{position:absolute;background:rgba(255,255,255,.5);border-radius:2px}
        .pk{position:absolute;border-radius:50%}
        .pn{cursor:pointer;filter:drop-shadow(0 3px 8px rgba(0,0,0,.15));transition:transform .22s cubic-bezier(.34,1.56,.64,1);display:inline-block}
        .pn:active{transform:scale(1.15)}
        @keyframes dr{0%{opacity:0;transform:scale(.5) translateY(-10px)}65%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
        .pa{animation:dr .5s cubic-bezier(.34,1.56,.64,1) both}
        .hd{position:absolute;top:48px;left:0;right:0;z-index:30;padding:10px 22px;display:flex;align-items:center;justify-content:space-between}
        .lg{font:700 26px/1 'DM Sans',sans-serif;color:#1A1A1A;letter-spacing:-1px}
        .bd{background:rgba(255,255,255,.82);backdrop-filter:blur(16px);padding:6px 16px;border-radius:100px;font:400 12px/1 'Noto Sans JP',sans-serif;color:#666;border:1px solid rgba(0,0,0,.06)}
        .bd b{font-weight:700;color:#FF7A5C;margin-left:3px}
        .fb{position:absolute;bottom:100px;left:50%;transform:translateX(-50%);z-index:30;width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#FF9A7B,#FF6B8A);border:none;box-shadow:0 6px 24px rgba(255,107,138,.35),0 2px 6px rgba(0,0,0,.06);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .fb:active{transform:translateX(-50%) scale(.9)}
        .fb svg{stroke:#fff;stroke-width:2.2;fill:none;stroke-linecap:round}
        .tb{position:absolute;bottom:0;left:0;right:0;height:80px;background:rgba(255,255,255,.88);backdrop-filter:blur(20px);border-top:1px solid rgba(0,0,0,.04);display:flex;align-items:flex-start;justify-content:space-around;padding-top:10px;z-index:50}
        .ti{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;cursor:pointer;padding:6px 22px;font-family:inherit;opacity:.3;transition:opacity .2s}
        .ti.on{opacity:1}
        .ti svg{width:21px;height:21px;stroke-width:1.7;fill:none;stroke:#1A1A1A;stroke-linecap:round;stroke-linejoin:round}
        .ti.on svg{stroke:#FF6B8A}
        .ti span{font:500 10px/1 'DM Sans',sans-serif;color:#888;letter-spacing:.6px}
        .ti.on span{color:#FF6B8A}
        .cx{position:absolute;top:56px;left:20px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.2);backdrop-filter:blur(10px);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10}
        .cx svg{width:16px;height:16px;stroke:#fff;stroke-width:2.2;fill:none;stroke-linecap:round}
        .cam{position:absolute;top:0;left:0;right:0;bottom:170px;background:#1C1A18;overflow:hidden;display:flex;align-items:center;justify-content:center}
        .ch-t{position:absolute;top:76px;left:0;right:0;text-align:center;font:300 14px/1 'Noto Sans JP',sans-serif;color:rgba(255,255,255,.3);letter-spacing:1px;z-index:2;pointer-events:none}
        .xh{width:190px;height:190px;border:1px solid rgba(255,255,255,.25);border-radius:18px;position:relative;z-index:2;pointer-events:none}
        .xh::before,.xh::after{content:'';position:absolute;background:rgba(255,255,255,.35)}
        .xh::before{width:.5px;height:18px;top:50%;left:50%;transform:translate(-50%,-50%)}
        .xh::after{width:18px;height:.5px;top:50%;left:50%;transform:translate(-50%,-50%)}
        .cc{position:absolute;bottom:0;left:0;right:0;height:170px;background:#1C1A18;display:flex;align-items:center;justify-content:center;gap:50px;padding-bottom:26px}
        .sh{width:70px;height:70px;border-radius:50%;background:none;border:3px solid rgba(255,255,255,.88);cursor:pointer;position:relative;transition:all .12s}
        .sh::after{content:'';position:absolute;inset:5px;border-radius:50%;background:rgba(255,255,255,.88);transition:all .12s}
        .sh:active{transform:scale(.88)}.sh:active::after{background:rgba(255,255,255,.45)}
        .sh:disabled{opacity:.4;cursor:not-allowed}
        .sb2{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.08);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center}
        .sb2:active{background:rgba(255,255,255,.16)}
        .cp{position:absolute;top:0;left:0;right:0;height:52%;overflow:hidden;background:#1C1A18}
        .cp img{width:100%;height:100%;object-fit:cover}
        .cf{position:absolute;bottom:0;left:0;right:0;height:90px;background:linear-gradient(transparent,#fff)}
        .cfm{position:absolute;bottom:0;left:0;right:0;top:48%;padding:16px 24px 90px;display:flex;flex-direction:column;gap:14px;background:#fff}
        .cm{display:flex;gap:12px;align-items:center;font:400 12px/1 'Noto Sans JP',sans-serif;color:#999}
        .cmi{display:flex;align-items:center;gap:4px}
        .inp{width:100%;padding:14px 16px;border:1.5px solid rgba(0,0,0,.06);border-radius:14px;background:#F8F8F8;font:400 14px/1.6 'Noto Sans JP',sans-serif;color:#1A1A1A;outline:none;resize:none;transition:border .25s}
        .inp::placeholder{color:#C0C0C0}.inp:focus{border-color:#FF9A7B}
        .ht{font:400 11px/1 'DM Sans',sans-serif;color:#C0C0C0;text-align:right}
        .sv{width:100%;padding:15px;border-radius:16px;background:linear-gradient(135deg,#FF9A7B,#FF6B8A);color:#fff;border:none;font:500 15px/1 'Noto Sans JP',sans-serif;cursor:pointer;transition:all .2s;letter-spacing:.5px}
        .sv:active{transform:scale(.97);opacity:.9}
        .sv:disabled{opacity:.6;cursor:not-allowed}
        .to{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.8);background:rgba(255,255,255,.96);backdrop-filter:blur(28px);border-radius:22px;padding:30px 40px;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 24px 64px rgba(0,0,0,.1);z-index:200;opacity:0;transition:all .4s cubic-bezier(.34,1.56,.64,1);pointer-events:none;border:1px solid rgba(0,0,0,.04)}
        .to.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
        @keyframes cd{to{stroke-dashoffset:0}}
        .tc{width:40px;height:40px}
        .tc circle{fill:rgba(255,107,138,.1)}
        .tc path{stroke:#FF6B8A;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;fill:none;stroke-dasharray:20;stroke-dashoffset:20}
        .to.show .tc path{animation:cd .35s .15s ease forwards}
        .dp{position:absolute;top:0;left:0;right:0;height:48%;overflow:hidden}
        .dp img{width:100%;height:100%;object-fit:cover}
        .db{position:absolute;top:42%;left:0;right:0;bottom:0;background:#fff;border-radius:26px 26px 0 0;padding:18px 24px 40px;box-shadow:0 -4px 20px rgba(0,0,0,.04);overflow-y:auto}
        .db::-webkit-scrollbar{display:none}
        .dh{width:34px;height:3.5px;background:rgba(0,0,0,.08);border-radius:2px;margin:0 auto 18px}
        .dt{font:400 18px/1.8 'Noto Sans JP',sans-serif;color:#1A1A1A;margin-bottom:18px}
        .de{font:italic 400 13px/1 'Noto Sans JP',sans-serif;color:#C0C0C0;margin-bottom:18px}
        .mgg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
        .mc{background:#F8F8F8;border-radius:14px;padding:13px 15px;border:1px solid rgba(0,0,0,.03)}
        .ml{font:500 9px/1 'DM Sans',sans-serif;color:#AAA;margin-bottom:4px;text-transform:uppercase;letter-spacing:1.4px}
        .mv{font:500 14px/1.4 'Noto Sans JP',sans-serif;color:#1A1A1A}
        .mm{width:100%;height:105px;border-radius:16px;overflow:hidden;position:relative;border:1px solid rgba(0,0,0,.04)}
        .mm img{width:100%;height:100%;object-fit:cover;border-radius:16px}
        .mm-fake{background:linear-gradient(135deg,#F2EFEC,#EDE9E5);width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}
        .mp{width:11px;height:11px;border-radius:50%;background:linear-gradient(135deg,#FF9A7B,#FF6B8A);border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,.12)}
        .ma{position:absolute;bottom:8px;right:12px;font:400 10px/1 'Noto Sans JP',sans-serif;color:#AAA;background:rgba(255,255,255,.8);padding:3px 10px;border-radius:10px}
        .th{padding:58px 22px 10px;display:flex;align-items:flex-end;justify-content:space-between;background:rgba(255,255,255,.9);backdrop-filter:blur(14px);position:sticky;top:0;z-index:10}
        .tt{font:700 24px/1 'DM Sans',sans-serif;color:#1A1A1A;letter-spacing:-.6px}
        .tn{font:400 12px/1 'DM Sans',sans-serif;color:#AAA}
        .fl{display:flex;gap:7px;padding:12px 22px;overflow-x:auto}
        .fl::-webkit-scrollbar{display:none}
        .ch{padding:7px 16px;border-radius:100px;background:#F8F8F8;border:1.5px solid rgba(0,0,0,.05);font:500 11px/1 'DM Sans',sans-serif;color:#888;cursor:pointer;white-space:nowrap;transition:all .2s;display:flex;align-items:center;gap:5px;letter-spacing:.4px}
        .ch.on{background:linear-gradient(135deg,#FF9A7B,#FF6B8A);border-color:transparent;color:#fff}
        .ss{display:flex;gap:8px;padding:6px 22px 16px}
        .sc{background:#F8F8F8;border-radius:14px;padding:12px;border:1px solid rgba(0,0,0,.03);flex:1;text-align:center}
        .sn{font:700 22px/1 'DM Sans',sans-serif;background:linear-gradient(135deg,#FF9A7B,#FF6B8A);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .sl{font:400 9px/1 'DM Sans',sans-serif;color:#AAA;margin-top:3px;letter-spacing:.6px}
        .cs{padding:0 22px 100px;display:flex;flex-direction:column;gap:12px}
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
        .cd{display:flex;gap:12px;background:#fff;border-radius:18px;padding:12px;border:1px solid rgba(0,0,0,.04);cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(0,0,0,.03);animation:fu .4s ease both}
        .cd:active{transform:scale(.98)}
        .cph{width:64px;height:64px;border-radius:14px;flex-shrink:0;overflow:hidden}
        .cph img{width:100%;height:100%;object-fit:cover}
        .cbo{flex:1;display:flex;flex-direction:column;justify-content:center;gap:4px;min-width:0}
        .ctx{font:400 13px/1.55 'Noto Sans JP',sans-serif;color:#1A1A1A;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .cem{font:italic 400 12px/1 'Noto Sans JP',sans-serif;color:#C0C0C0}
        .cme{display:flex;gap:8px;align-items:center;font:400 10px/1 'DM Sans',sans-serif;color:#AAA}
        .scr{overflow-y:auto;height:100%;-webkit-overflow-scrolling:touch}
        .scr::-webkit-scrollbar{display:none}
        /* current location dot */
        .cl{width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#FF8A6A,#FF6B8A);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.15);position:relative}
        .cl::after{content:'';position:absolute;inset:-6px;border-radius:50%;background:rgba(255,107,138,.2);animation:pu 2s ease-in-out infinite}
        @keyframes pu{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(2);opacity:0}}
        /* location button */
        .loc-btn{position:absolute;bottom:100px;right:18px;z-index:30;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.92);backdrop-filter:blur(12px);border:1px solid rgba(0,0,0,.06);box-shadow:0 2px 12px rgba(0,0,0,.08);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .loc-btn:active{transform:scale(.9)}
        .loc-btn.denied{opacity:.4}
        /* mapbox attribution small */
        .mapboxgl-ctrl-attrib{font-size:9px!important;opacity:.5}
        .mapboxgl-ctrl-logo{opacity:.4;transform:scale(.7);transform-origin:bottom left}
        /* mobile fullscreen */
        @media(max-width:430px){
          .outer{padding:0!important;background:white!important;min-height:100dvh!important;align-items:flex-start!important}
          .ph{width:100vw!important;height:100dvh!important;border-radius:0!important;box-shadow:none!important}
          .notch{display:none!important}
          .stbar{display:none!important}
        }
      `}</style>

      <div className="ph">
        <div className="notch"/>
        <div className="stbar">
          <span>{`${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`}</span>
          <span style={{ display:"flex", gap:5, alignItems:"center", opacity:.65 }}>
            <svg width="15" height="10" viewBox="0 0 15 10"><rect y="5" width="2.5" height="5" rx=".5" fill="currentColor" opacity=".35"/><rect x="3.8" y="3" width="2.5" height="7" rx=".5" fill="currentColor" opacity=".55"/><rect x="7.6" y="1" width="2.5" height="9" rx=".5" fill="currentColor" opacity=".75"/><rect x="11.4" width="2.5" height="10" rx=".5" fill="currentColor"/></svg>
            <svg width="22" height="10" viewBox="0 0 22 10"><rect x=".5" y=".5" width="17" height="9" rx="2.5" stroke="currentColor" fill="none"/><rect x="18.5" y="3" width="2" height="4" rx="1" fill="currentColor" opacity=".35"/><rect x="2" y="2" width="11" height="6" rx="1.5" fill="currentColor" opacity=".55"/></svg>
          </span>
        </div>

        {/* ── MAP ── */}
        <div className={`s ${screen==="map"?"on":"off"}`}>
          <div className="mbg">
            {MAPBOX_TOKEN ? (
              <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width:'100%', height:'100%' }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                attributionControl={false}
              >
                {ready && memories.map((p, i) => p.lat && p.lng && (
                  <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="bottom">
                    <div
                      className={`pn pa`}
                      style={{ animationDelay: `${i * .06}s` }}
                      onClick={e => { e.stopPropagation(); setPin(p); go("detail"); }}
                    >
                      <PinShape pin={p} size={40} />
                    </div>
                  </Marker>
                ))}
                {currentLocation && (
                  <Marker longitude={currentLocation.lng} latitude={currentLocation.lat} anchor="center">
                    <div className="cl"/>
                  </Marker>
                )}
              </Map>
            ) : (
              /* Fallback fake map when no Mapbox token */
              <div className="fkmap">
                <div className="mg"/>
                <div className="rd" style={{top:"33%",left:0,right:0,height:16}}/>
                <div className="rd" style={{top:"65%",left:"6%",right:"8%",height:11,transform:"rotate(-1deg)"}}/>
                <div className="rd" style={{top:0,bottom:0,left:"25%",width:13}}/>
                <div className="rd" style={{top:"6%",bottom:"6%",left:"58%",width:10}}/>
                <div className="pk" style={{width:85,height:65,top:"19%",left:"38%",borderRadius:"42% 58% 48% 52%",background:"rgba(141,217,168,.1)"}}/>
                <div style={{position:"absolute",top:"20%",left:"42%",font:"300 8px/1 'DM Sans',sans-serif",color:"#BBB",letterSpacing:2,opacity:.55}}>YOYOGI PARK</div>
                {ready && memories.map((p,i) => {
                  const pos = [{top:22,left:34},{top:42,left:58},{top:28,left:76},{top:56,left:26},{top:48,left:82},{top:66,left:50},{top:36,left:14},{top:74,left:72}];
                  const pp  = pos[i % pos.length];
                  return (
                    <div key={p.id} className="pn pa" style={{position:"absolute",top:`${pp.top}%`,left:`${pp.left}%`,transform:'translate(-50%,-100%)',animationDelay:`${i*.06}s`}} onClick={()=>{setPin(p);go("detail")}}>
                      <PinShape pin={p} size={40} />
                    </div>
                  );
                })}
                <div style={{position:"absolute",top:"45%",left:"46%",width:13,height:13,borderRadius:"50%",background:"linear-gradient(135deg,#FF8A6A,#FF6B8A)",border:"3px solid white",boxShadow:"0 0 0 5px rgba(255,138,106,.18)",transform:"translate(-50%,-50%)"}}/>
              </div>
            )}
          </div>

          <div className="hd">
            <div className="lg">weav</div>
            <div className="bd">this month<b>{thisMonth}</b></div>
          </div>
          {/* 現在地ボタン */}
          <button
            className={`loc-btn ${locDenied ? 'denied' : ''}`}
            onClick={flyToCurrentLocation}
            title={locDenied ? '位置情報が許可されていません' : '現在地へ'}
          >
            {currentLocation ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B8A" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
                <circle cx="12" cy="12" r="7" opacity=".3"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#AAA" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
            )}
          </button>

          <button className="fb" onClick={() => { setStep("camera"); setNote(""); go("record"); }}>
            <svg width="22" height="22" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <div className="tb">
            <button className={`ti ${tab==="map"?"on":""}`} onClick={() => go("map","map")}>
              <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <span>map</span>
            </button>
            <button className={`ti ${tab==="log"?"on":""}`} onClick={() => go("timeline","log")}>
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>
              <span>log</span>
            </button>
          </div>
        </div>

        {/* ── CAMERA ── */}
        <div className={`s up ${screen==="record" && step==="camera" ? "on" : ""}`}>
          <button className="cx" onClick={() => { stopCamera(); go("map","map"); }}>
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="cam">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}
            />
            <div className="ch-t">いいな、を残す</div>
            <div className="xh"/>
            {cameraError && (
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:3, gap:8 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.5" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/><line x1="12" y1="11" x2="12" y2="15"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span style={{ color:'rgba(255,255,255,.4)', fontSize:13, fontFamily:'Noto Sans JP', textAlign:'center', padding:'0 40px' }}>{cameraError}</span>
              </div>
            )}
          </div>
          <div className="cc">
            <button className="sb2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button className="sh" onClick={capturePhoto} disabled={!!cameraError}/>
            <button className="sb2" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file'; input.accept = 'image/*';
              input.onchange = e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  setCapturedPhoto(ev.target.result);
                  setStep("confirm");
                  fetchLocationAndWeather();
                };
                reader.readAsDataURL(file);
              };
              input.click();
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill="rgba(255,255,255,.55)" stroke="none"/><path d="M21 15l-5-5L5 21"/></svg>
            </button>
          </div>
          <canvas ref={canvasRef} style={{ display:'none' }}/>
        </div>

        {/* ── CONFIRM ── */}
        <div className={`s ${screen==="record" && step==="confirm" ? "on" : "off"}`}>
          <button className="cx" onClick={() => { setCapturedPhoto(null); setStep("camera"); }}>
            <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
          </button>
          <div className="cp">
            {capturedPhoto
              ? <img src={capturedPhoto} alt="preview" />
              : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#8DD9A8,#66C88A)' }}/>
            }
            <div className="cf"/>
          </div>
          <div className="cfm">
            <div className="cm">
              <div className="cmi">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                {locating ? '…' : currentArea}
              </div>
              <div className="cmi">
                <WIcon type={currentWeather.weather} size={12}/>
                {locating ? '…' : `${currentWeather.temp}°C`}
              </div>
              <div className="cmi">{todayStr}</div>
            </div>
            <textarea
              className="inp"
              placeholder="ひとこと添える（なくてもOK）"
              rows={2}
              maxLength={100}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <div className="ht">{note.length}/100</div>
            <button className="sv" onClick={saveMemory} disabled={saving || locating}>
              {saving ? '保存中…' : '残す'}
            </button>
          </div>
        </div>

        {/* ── TOAST ── */}
        <div className={`to ${toast ? "show" : ""}`}>
          <svg className="tc" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20"/><path d="M12 20l5 5L28 14"/></svg>
          <div style={{ font:"500 15px/1 'Noto Sans JP',sans-serif", color:"#1A1A1A" }}>残した</div>
          <div style={{ font:"400 11px/1 'Noto Sans JP',sans-serif", color:"#AAA" }}>
            {currentArea} · {todayStr}
          </div>
        </div>

        {/* ── DETAIL ── */}
        <div className={`s up ${screen==="detail" ? "on" : ""}`}>
          {pin && <>
            <button className="cx" onClick={() => go("map","map")}>
              <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="dp" style={{ background: pin.grad }}>
              {pin.photoUrl
                ? <img src={pin.photoUrl} alt="" />
                : <svg viewBox="0 0 375 400"><rect width="375" height="400" fill={pin.color}/><circle cx="95" cy="130" r="55" fill="rgba(255,255,255,.12)"/><circle cx="290" cy="95" r="40" fill="rgba(255,255,255,.08)"/><circle cx="200" cy="260" r="70" fill="rgba(255,255,255,.07)"/><PhotoSvg type={pin.photo} color={pin.color} size={120}/></svg>
              }
            </div>
            <div className="db">
              <div className="dh"/>
              {pin.text
                ? <div className="dt">{pin.text}</div>
                : <div className="de">言葉はなくても。</div>
              }
              <div className="mgg">
                <div className="mc">
                  <div className="ml">date</div>
                  <div className="mv">{fmtDate(pin.date)} <span style={{fontSize:12,fontWeight:400,color:"#AAA"}}>{pin.time}</span></div>
                </div>
                <div className="mc">
                  <div className="ml">weather</div>
                  <div className="mv" style={{display:"flex",alignItems:"center",gap:6}}>
                    <WIcon type={pin.weather} size={16} color="#888"/> {pin.temp}°C
                  </div>
                </div>
              </div>
              {/* Mini map */}
              <div className="mm">
                {MAPBOX_TOKEN && pin.lat && pin.lng ? (
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+ff6b8a(${pin.lng},${pin.lat})/${pin.lng},${pin.lat},14,0/332x100@2x?access_token=${MAPBOX_TOKEN}`}
                    alt="map"
                  />
                ) : (
                  <div className="mm-fake">
                    <div className="mg" style={{opacity:.04}}/>
                    <div className="mp"/>
                  </div>
                )}
                <div className="ma">{pin.area}</div>
              </div>
            </div>
          </>}
        </div>

        {/* ── TIMELINE ── */}
        <div className={`s ${screen==="timeline" ? "on" : "off"}`}>
          <div className="scr">
            <div className="th">
              <div className="tt">log</div>
              <div className="tn">{memories.length} pins</div>
            </div>
            <div className="fl">
              {[{k:"all",l:"all"},{k:"sunny",l:"clear"},{k:"cloudy",l:"cloud"},{k:"rainy",l:"rain"}].map(f => (
                <button key={f.k} className={`ch ${filter===f.k?"on":""}`} onClick={() => setFilter(f.k)}>
                  {f.k !== "all" && <WIcon type={f.k} size={12} color={filter===f.k?"white":"#888"}/>}
                  {f.l}
                </button>
              ))}
            </div>
            <div className="ss">
              <div className="sc"><div className="sn">{thisMonth}</div><div className="sl">THIS MONTH</div></div>
              <div className="sc"><div className="sn">{areas}</div><div className="sl">AREAS</div></div>
              <div className="sc"><div className="sn">{clearPct}%</div><div className="sl">CLEAR</div></div>
            </div>
            <div className="cs">
              {fl.map((p, i) => (
                <div key={p.id} className="cd" style={{animationDelay:`${i*.05}s`}} onClick={() => { setPin(p); go("detail"); }}>
                  <div className="cph">
                    {p.photoUrl
                      ? <img src={p.photoUrl} alt="" />
                      : <PinShape pin={p} size={64} />
                    }
                  </div>
                  <div className="cbo">
                    {p.text
                      ? <div className="ctx">{p.text}</div>
                      : <div className="cem">no caption</div>
                    }
                    <div className="cme">
                      <span style={{display:"flex",alignItems:"center",gap:3}}>
                        <WIcon type={p.weather} size={10} color="#AAA"/> {p.temp}°
                      </span>
                      <span>{p.area}</span>
                      <span>{ago(p.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="tb">
            <button className={`ti ${tab==="map"?"on":""}`} onClick={() => go("map","map")}>
              <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <span>map</span>
            </button>
            <button className={`ti ${tab==="log"?"on":""}`} onClick={() => go("timeline","log")}>
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>
              <span>log</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
