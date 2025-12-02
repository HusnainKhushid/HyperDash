import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// --- Components ---

const HomeApp = ({ gesture, setContext, onNavigate }) => {
  const [selectedOption, setSelectedOption] = useState(1);
  const options = [
    { id: 1, label: "Maps", app: 'maps' },
    { id: 2, label: "Call", app: 'call' },
    { id: 3, label: "Music", app: 'music' },
    { id: 4, label: "Climate", app: 'climate' }
  ];

  useEffect(() => {
    setContext('navigation'); // Keep context as 'navigation' for selection mode
  }, [setContext]);

  useEffect(() => {
    if (gesture === 'one') setSelectedOption(1);
    if (gesture === 'two') setSelectedOption(2);
    if (gesture === 'three') setSelectedOption(3);
    if (gesture === 'four') setSelectedOption(4);
    if (gesture === 'palm') {
      const targetApp = options.find(o => o.id === selectedOption).app;
      console.log(`Home: Opening ${targetApp}`);
      onNavigate(targetApp);
    }
  }, [gesture, selectedOption, onNavigate]);

  return (
    <div className="app-page home">
      <h1>Home Menu</h1>
      <div className="options-grid">
        {options.map(opt => (
          <div key={opt.id} className={`option-card ${selectedOption === opt.id ? 'selected' : ''}`}>
            <span className="option-number">{opt.id}</span>
            <span className="option-label">{opt.label}</span>
          </div>
        ))}
      </div>
      <div className="instructions">
        <p>1-4 to Select, Palm to Open</p>
      </div>
    </div>
  );
};

const MusicApp = ({ gesture, setContext }) => {
  const [view, setView] = useState('playlist'); // 'playlist' or 'player'
  const [selectedPlaylist, setSelectedPlaylist] = useState(1);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const playlists = [
    { id: 1, name: "Top Hits" },
    { id: 2, name: "Chill Vibes" },
    { id: 3, name: "Workout" },
    { id: 4, name: "Classics" }
  ];

  const songs = ["Song A", "Song B", "Song C", "Song D"];

  useEffect(() => {
    // Update context whenever view changes
    if (view === 'playlist') {
      setContext('music_playlist');
    } else {
      setContext('music_player');
    }
  }, [view, setContext]);

  useEffect(() => {
    if (view === 'playlist') {
      if (gesture === 'one') setSelectedPlaylist(1);
      if (gesture === 'two') setSelectedPlaylist(2);
      if (gesture === 'three') setSelectedPlaylist(3);
      if (gesture === 'four') setSelectedPlaylist(4);
      if (gesture === 'palm') {
        setView('player');
        setIsPlaying(true);
      }
    } else {
      // Player View
      if (gesture === 'swipe_left') {
        setCurrentSongIndex(prev => Math.max(0, prev - 1));
      }
      if (gesture === 'swipe_right') {
        setCurrentSongIndex(prev => Math.min(songs.length - 1, prev + 1));
      }
      if (gesture === 'palm') setIsPlaying(false); // Stop
      if (gesture === 'fist') setIsPlaying(true);  // Play
    }
  }, [gesture, view]);

  return (
    <div className="app-page music">
      <h1>Music</h1>
      {view === 'playlist' ? (
        <div className="playlist-view">
          <h2>Select Playlist</h2>
          <div className="options-grid">
            {playlists.map(pl => (
              <div key={pl.id} className={`option-card ${selectedPlaylist === pl.id ? 'selected' : ''}`}>
                <span className="option-number">{pl.id}</span>
                <span className="option-label">{pl.name}</span>
              </div>
            ))}
          </div>
          <p>1-4 to Select, Palm to Play</p>
        </div>
      ) : (
        <div className="player-view">
          <h2>Now Playing</h2>
          <div className="album-art">🎵</div>
          <div className="song-info">
            <h3>{songs[currentSongIndex]}</h3>
            <p>{playlists.find(p => p.id === selectedPlaylist).name}</p>
          </div>
          <div className="controls">
            <span className={!isPlaying ? 'active' : ''}>⏸ Paused (Palm)</span>
            <span className={isPlaying ? 'active' : ''}>▶ Playing (Fist)</span>
          </div>
          <p>Swipe L/R for songs</p>
          <button onClick={() => setView('playlist')} className="back-btn">Back to Playlists</button>
        </div>
      )}
    </div>
  );
};

const MapsApp = ({ gesture, setContext }) => {
  const [selectedLocator, setSelectedLocator] = useState(1);
  const locators = [
    { id: 1, label: "Gas Station" },
    { id: 2, label: "Restaurant" },
    { id: 3, label: "Hospital" },
    { id: 4, label: "Parking" }
  ];

  useEffect(() => {
    setContext('maps');
  }, [setContext]);

  useEffect(() => {
    if (gesture === 'one') setSelectedLocator(1);
    if (gesture === 'two') setSelectedLocator(2);
    if (gesture === 'three') setSelectedLocator(3);
    if (gesture === 'four') setSelectedLocator(4);
    if (gesture === 'palm') {
      alert(`Starting Navigation to nearest ${locators.find(l => l.id === selectedLocator).label}`);
    }
  }, [gesture, selectedLocator]);

  return (
    <div className="app-page maps">
      <h1>Maps</h1>
      <div className="options-grid">
        {locators.map(loc => (
          <div key={loc.id} className={`option-card ${selectedLocator === loc.id ? 'selected' : ''}`}>
            <span className="option-number">{loc.id}</span>
            <span className="option-label">{loc.label}</span>
          </div>
        ))}
      </div>
      <p>1-4 to Select, Palm to Start</p>
    </div>
  );
};

const ClimateApp = ({ gesture, setContext }) => {
  const [temp, setTemp] = useState(22);
  const [fanSpeed, setFanSpeed] = useState(2);
  const [activeControl, setActiveControl] = useState('temp'); // 'temp' or 'fan'
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    setContext('climate');
  }, [setContext]);

  useEffect(() => {
    // Selection
    if (gesture === 'one') setActiveControl('temp');
    if (gesture === 'two') setActiveControl('fan');

    // Adjustment
    if (gesture === 'swipe_left') {
      if (activeControl === 'temp') setTemp(t => Math.max(16, t - 1));
      if (activeControl === 'fan') setFanSpeed(s => Math.max(1, s - 1));
    }
    if (gesture === 'swipe_right') {
      if (activeControl === 'temp') setTemp(t => Math.min(30, t + 1));
      if (activeControl === 'fan') setFanSpeed(s => Math.min(5, s + 1));
    }

    // Toggle
    if (gesture === 'palm') setAuto(a => !a);

    // Pinch Gesture (Temperature Only)
    if (gesture === 'increase_temp') {
      setTemp(t => Math.min(30, t + 1));
      setActiveControl('temp'); // Auto-select temp dial
    }
    if (gesture === 'decrease_temp') {
      setTemp(t => Math.max(16, t - 1));
      setActiveControl('temp');
    }
  }, [gesture, activeControl]);

  return (
    <div className="app-page climate">
      <h1>Climate Control</h1>
      <div className="climate-dials">
        {/* Temp Dial */}
        <div className={`dial ${activeControl === 'temp' ? 'active' : ''}`}>
          <div className="dial-label">Temperature (1)</div>
          <div className="dial-value">{temp}°C</div>
          <div className="dial-ring" style={{ '--percent': `${((temp - 16) / 14) * 100}%` }}></div>
        </div>

        {/* Fan Dial */}
        <div className={`dial ${activeControl === 'fan' ? 'active' : ''}`}>
          <div className="dial-label">Fan Speed (2)</div>
          <div className="dial-value">{fanSpeed}</div>
          <div className="dial-ring" style={{ '--percent': `${(fanSpeed / 5) * 100}%` }}></div>
        </div>
      </div>

      <div className={`auto-toggle ${auto ? 'active' : ''}`}>
        <span>AUTO MODE</span>
        <span className="status">{auto ? 'ON' : 'OFF'}</span>
        <span className="hint">(Palm)</span>
      </div>

      <p className="instructions">1/2 to Select Dial, Swipe to Adjust</p>
    </div>
  );
};

const CallApp = ({ gesture, setContext }) => {
  const [view, setView] = useState('list'); // 'list' or 'incall'
  const [contacts, setContacts] = useState([
    { name: "Mom", number: "555-0101", color: "#FF6B6B" },
    { name: "Dad", number: "555-0102", color: "#4ECDC4" },
    { name: "Boss", number: "555-0103", color: "#45B7D1" },
    { name: "Pizza", number: "555-0104", color: "#FFA07A" },
    { name: "Emergency", number: "911", color: "#FF0000" }
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    if (view === 'list') {
      setContext('call_list');
    } else {
      setContext('call_incall');
    }
  }, [view, setContext]);

  useEffect(() => {
    if (view === 'list') {
      if (gesture === 'swipe_left') setSelectedIndex(i => Math.max(0, i - 1));
      if (gesture === 'swipe_right') setSelectedIndex(i => Math.min(contacts.length - 1, i + 1));
      if (gesture === 'call') {
        setActiveCall(contacts[selectedIndex]);
        setView('incall');
      }
    } else {
      // In Call
      if (gesture === 'call') {
        setActiveCall(null);
        setView('list');
      }
    }
  }, [gesture, view, selectedIndex, contacts]);

  return (
    <div className="app-page call">
      <h1>Phone</h1>
      {view === 'list' ? (
        <div className="contact-carousel">
          <div className="cards-container" style={{ transform: `translateX(-${selectedIndex * 100}%)` }}>
            {contacts.map((c, i) => (
              <div key={i} className={`contact-card ${i === selectedIndex ? 'active' : ''}`} style={{ backgroundColor: c.color }}>
                <div className="avatar">👤</div>
                <h2>{c.name}</h2>
                <p>{c.number}</p>
              </div>
            ))}
          </div>
          <div className="carousel-dots">
            {contacts.map((_, i) => (
              <span key={i} className={`dot ${i === selectedIndex ? 'active' : ''}`} />
            ))}
          </div>
          <p className="instructions">Swipe to Browse, 'Call' gesture to Dial</p>
        </div>
      ) : (
        <div className="incall-view">
          <div className="avatar">👤</div>
          <h2>{activeCall.name}</h2>
          <p>00:12</p>
          <div className="call-actions">
            <div className="hangup-btn">
              Make 'Call' gesture to Hang Up
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
// --- Main App ---

function App() {
  const [activeApp, setActiveApp] = useState('navigation');
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastGesture, setLastGesture] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket('ws://127.0.0.1:8000/ws/gestures');

    ws.current.onopen = () => {
      setConnectionStatus('Connected');
      console.log('WebSocket Connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const gesture = data.gesture;
      console.log('Received Gesture:', gesture);
      setLastGesture(gesture);

      // Clear gesture after a short delay to allow re-triggering same gesture logic if needed
      // But for React state updates, we usually want to react to the change.
      // We pass it down.
      setTimeout(() => setLastGesture(null), 500);
    };

    ws.current.onclose = () => setConnectionStatus('Disconnected');

    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const renderActiveApp = () => {
    let context = 'navigation';

    // Determine context based on app state
    // Note: We need to pass this up or determine it here.
    // Ideally, the sub-components should tell us, or we infer it.
    // For simplicity, we can infer it if we lift state up, but state is inside components.
    // Let's modify components to accept a 'setContext' callback or similar?
    // Or just use a simpler mapping for now.

    // Actually, the components manage their own view state (playlist vs player).
    // We need to know that state to set the correct context.
    // Let's lift the 'view' state up to App for Music and Call.

    return (
      <>
        {activeApp === 'navigation' && <HomeApp gesture={lastGesture} setContext={(c) => sendContext(c)} onNavigate={setActiveApp} />}
        {activeApp === 'music' && <MusicApp gesture={lastGesture} setContext={(c) => sendContext(c)} />}
        {activeApp === 'maps' && <MapsApp gesture={lastGesture} setContext={(c) => sendContext(c)} />}
        {activeApp === 'climate' && <ClimateApp gesture={lastGesture} setContext={(c) => sendContext(c)} />}
        {activeApp === 'call' && <CallApp gesture={lastGesture} setContext={(c) => sendContext(c)} />}
      </>
    );
  };

  const sendContext = (context) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ context }));
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className={`nav-item ${activeApp === 'navigation' ? 'active' : ''}`} onClick={() => setActiveApp('navigation')}>🧭 Nav</div>
        <div className={`nav-item ${activeApp === 'music' ? 'active' : ''}`} onClick={() => setActiveApp('music')}>🎵 Music</div>
        <div className={`nav-item ${activeApp === 'maps' ? 'active' : ''}`} onClick={() => setActiveApp('maps')}>🗺️ Maps</div>
        <div className={`nav-item ${activeApp === 'climate' ? 'active' : ''}`} onClick={() => setActiveApp('climate')}>❄️ Climate</div>
        <div className={`nav-item ${activeApp === 'call' ? 'active' : ''}`} onClick={() => setActiveApp('call')}>📞 Call</div>
      </div>

      <div className="main-content">
        <div className="status-bar">
          <span>Status: {connectionStatus}</span>
          <span>Last Gesture: {lastGesture || '-'}</span>
        </div>
        <div className="app-view">
          {renderActiveApp()}
        </div>
      </div>
    </div>
  );
}

export default App;
