import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// --- Components ---

const NavigationApp = ({ gesture }) => {
  const [selectedOption, setSelectedOption] = useState(1);
  const options = [
    { id: 1, label: "Home" },
    { id: 2, label: "Work" },
    { id: 3, label: "Recent" },
    { id: 4, label: "Search" }
  ];

  useEffect(() => {
    if (gesture === 'one') setSelectedOption(1);
    if (gesture === 'two') setSelectedOption(2);
    if (gesture === 'three') setSelectedOption(3);
    if (gesture === 'four') setSelectedOption(4);
    if (gesture === 'palm') {
      console.log(`Navigation: Selected ${options.find(o => o.id === selectedOption).label}`);
      alert(`Navigating to ${options.find(o => o.id === selectedOption).label}`);
    }
  }, [gesture, selectedOption]);

  return (
    <div className="app-page navigation">
      <h1>Navigation</h1>
      <div className="options-grid">
        {options.map(opt => (
          <div key={opt.id} className={`option-card ${selectedOption === opt.id ? 'selected' : ''}`}>
            <span className="option-number">{opt.id}</span>
            <span className="option-label">{opt.label}</span>
          </div>
        ))}
      </div>
      <div className="instructions">
        <p>Use 1, 2, 3, 4 to select. Palm to click.</p>
      </div>
    </div>
  );
};

const MusicApp = ({ gesture }) => {
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

const MapsApp = ({ gesture }) => {
  const [selectedLocator, setSelectedLocator] = useState(1);
  const locators = [
    { id: 1, label: "Gas Station" },
    { id: 2, label: "Restaurant" },
    { id: 3, label: "Hospital" },
    { id: 4, label: "Parking" }
  ];

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

const ClimateApp = ({ gesture }) => {
  const [temp, setTemp] = useState(22);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (gesture === 'swipe_left') setTemp(t => Math.max(16, t - 1));
    if (gesture === 'swipe_right') setTemp(t => Math.min(30, t + 1));
    if (gesture === 'palm') setAuto(a => !a);
  }, [gesture]);

  return (
    <div className="app-page climate">
      <h1>Climate Control</h1>
      <div className="climate-display">
        <div className="temp-control">
          <span className="temp-val">{temp}°C</span>
          <span className="temp-label">Swipe L/R to adjust</span>
        </div>
        <div className={`auto-toggle ${auto ? 'active' : ''}`}>
          <span>AUTO MODE</span>
          <span className="status">{auto ? 'ON' : 'OFF'}</span>
          <span className="hint">(Palm to toggle)</span>
        </div>
      </div>
    </div>
  );
};

const CallApp = ({ gesture }) => {
  const [view, setView] = useState('list'); // 'list' or 'incall'
  const [contacts, setContacts] = useState(["Mom", "Dad", "Boss", "Pizza Place", "Emergency"]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCall, setActiveCall] = useState(null);

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
        <div className="contact-list">
          <h2>Recents</h2>
          <div className="list-container">
            {contacts.map((c, i) => (
              <div key={c} className={`contact-item ${i === selectedIndex ? 'selected' : ''}`}>
                {c}
              </div>
            ))}
          </div>
          <p>Swipe L/R to scroll, 'Call' gesture to dial</p>
        </div>
      ) : (
        <div className="incall-view">
          <div className="avatar">👤</div>
          <h2>{activeCall}</h2>
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
    switch (activeApp) {
      case 'navigation': return <NavigationApp gesture={lastGesture} />;
      case 'music': return <MusicApp gesture={lastGesture} />;
      case 'maps': return <MapsApp gesture={lastGesture} />;
      case 'climate': return <ClimateApp gesture={lastGesture} />;
      case 'call': return <CallApp gesture={lastGesture} />;
      default: return <NavigationApp gesture={lastGesture} />;
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
