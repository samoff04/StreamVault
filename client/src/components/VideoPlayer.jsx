import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward } from 'lucide-react';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const VideoPlayer = forwardRef(({ src, hlsSrc, onTimeUpdate, onReady, chapters = [] }, ref) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [quality, setQuality] = useState('Auto');
  const [showSettings, setShowSettings] = useState(false);
  const [levels, setLevels] = useState([]);
  const [showControls, setShowControls] = useState(true);
  const controlsTimer = useRef(null);

  useImperativeHandle(ref, () => ({
    seekTo: (t) => { if (videoRef.current) videoRef.current.currentTime = t; },
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    setPlaying: (val) => val ? videoRef.current?.play() : videoRef.current?.pause(),
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const streamSrc = hlsSrc || src;
    if (!streamSrc) return;

    if (Hls.isSupported() && (streamSrc.includes('.m3u8') || hlsSrc)) {
      const hls = new Hls({ startLevel: -1, autoLevelEnabled: true });
      hlsRef.current = hls;
      hls.loadSource(streamSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setLevels(data.levels.map((l, i) => ({ index: i, height: l.height })));
        onReady?.();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamSrc;
    } else {
      video.src = src;
    }

    return () => { hlsRef.current?.destroy(); };
  }, [src, hlsSrc]);

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    playing ? video.pause() : video.play();
  };

  const handleProgress = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * duration;
  };

  const setQualityLevel = (idx) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = idx;
    setQuality(idx === -1 ? 'Auto' : `${levels[idx]?.height}p`);
    setShowSettings(false);
  };

  const currentChapter = chapters.findLast?.((c) => c.timestamp <= currentTime) || chapters[0];

  return (
    <div
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          setCurrentTime(e.target.currentTime);
          onTimeUpdate?.(e.target.currentTime);
        }}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onVolumeChange={(e) => { setVolume(e.target.volume); setMuted(e.target.muted); }}
        playsInline
      />

      {/* Chapter label */}
      {currentChapter && (
        <div className="absolute top-4 left-4 glass px-3 py-1 rounded-full text-xs text-white/80">
          {currentChapter.title}
        </div>
      )}

      {/* Controls overlay */}
      <div className={`player-controls absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent
        flex flex-col justify-end p-4 transition-opacity duration-300 ${showControls || !playing ? 'opacity-100' : 'opacity-0'}`}>

        {/* Progress bar */}
        <div className="relative mb-3">
          {/* Chapter markers */}
          {chapters.map((ch, i) => (
            <div key={i}
              className="absolute top-0 w-0.5 h-full bg-brand-400 z-10 opacity-70"
              style={{ left: `${(ch.timestamp / duration) * 100}%` }}
              title={ch.title}
            />
          ))}
          <div
            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer hover:h-2.5 transition-all"
            onClick={handleProgress}
          >
            <div
              className="h-full bg-brand-500 rounded-full relative"
              style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-3">
          <button onClick={() => { videoRef.current.currentTime -= 10; }} className="text-white/80 hover:text-white">
            <SkipBack size={18} />
          </button>
          <button onClick={togglePlay} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white">
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button onClick={() => { videoRef.current.currentTime += 10; }} className="text-white/80 hover:text-white">
            <SkipForward size={18} />
          </button>

          <span className="text-white/70 text-xs font-mono ml-1">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-3">
            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={() => { videoRef.current.muted = !muted; }} className="text-white/80 hover:text-white">
                {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                onChange={(e) => { videoRef.current.volume = e.target.value; }}
                className="w-16 accent-brand-500" />
            </div>

            {/* Quality */}
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1 text-white/80 hover:text-white text-xs">
                <Settings size={15} /> {quality}
              </button>
              {showSettings && (
                <div className="absolute bottom-8 right-0 card p-2 min-w-[100px] z-50">
                  <button onClick={() => setQualityLevel(-1)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-700 rounded text-gray-300">
                    Auto
                  </button>
                  {levels.map((l, i) => (
                    <button key={i} onClick={() => setQualityLevel(i)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-700 rounded text-gray-300">
                      {l.height}p
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => videoRef.current?.requestFullscreen()} className="text-white/80 hover:text-white">
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;