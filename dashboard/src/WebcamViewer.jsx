import { useState, useEffect } from 'react'
import { X, Camera, RefreshCw, ZoomIn, ZoomOut, Settings2, Mic, MicOff, Video, VideoOff, Sun, Focus, Layers, Play, Square, Circle } from 'lucide-react'

export default function WebcamViewer({ vehicle, onClose }) {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [streamUrl, setStreamUrl] = useState('')
    const [activeControls, setActiveControls] = useState({
        zoom: 1,
        quality: 50,
        ffc: false, // Front Facing Camera
        motion_detect: false,
        isRecording: false,
        audioEnabled: false,
        torch: false,
        focusMode: 'auto'
    })
    const [statusMsg, setStatusMsg] = useState('')

    useEffect(() => {
        if (vehicle?.webcam_url) {
            setStreamUrl(`${vehicle.webcam_url}/video`)
        }
    }, [vehicle])

    const sendControl = async (endpoint, params = {}) => {
        if (!vehicle?.webcam_url) return
        try {
            const query = new URLSearchParams(params).toString()
            const url = `${vehicle.webcam_url}/${endpoint}${query ? '?' + query : ''}`
            await fetch(url, { mode: 'no-cors' }) // Use no-cors as some IP Cam apps might not have proper CORS
            return true
        } catch (err) {
            console.error('Webcam Control Error:', err)
            setStatusMsg('Control failed')
            setTimeout(() => setStatusMsg(''), 3000)
            return false
        }
    }

    const handleZoom = (val) => {
        const newZoom = Math.max(1, Math.min(10, activeControls.zoom + val))
        setActiveControls(prev => ({ ...prev, zoom: newZoom }))
        sendControl('settings/zoom', { set: newZoom })
    }

    const toggleFFC = () => {
        const newState = !activeControls.ffc
        setActiveControls(prev => ({ ...prev, ffc: newState }))
        sendControl('settings/ffc', { set: newState ? 'on' : 'off' })
    }

    const toggleMotion = () => {
        const newState = !activeControls.motion_detect
        setActiveControls(prev => ({ ...prev, motion_detect: newState }))
        sendControl('settings/motion_detect', { set: newState ? 'on' : 'off' })
    }

    const toggleRecording = () => {
        if (activeControls.isRecording) {
            sendControl('stopvideo')
            setActiveControls(prev => ({ ...prev, isRecording: false }))
            setStatusMsg('Recording stopped')
        } else {
            sendControl('startvideo', { force: 1 })
            setActiveControls(prev => ({ ...prev, isRecording: true }))
            setStatusMsg('Recording started')
        }
        setTimeout(() => setStatusMsg(''), 3000)
    }

    const handleQuality = (e) => {
        const val = e.target.value
        setActiveControls(prev => ({ ...prev, quality: val }))
        sendControl('settings/quality', { set: val })
    }

    const captureSnapshot = async () => {
        try {
            const snapshotUrl = `${vehicle.webcam_url}/shot.jpg`
            const response = await fetch(snapshotUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `snapshot-${vehicle.license_plate}-${Date.now()}.jpg`
            a.click()
            setStatusMsg('Snapshot captured')
            setTimeout(() => setStatusMsg(''), 3000)
        } catch (err) {
            setError('Failed to capture snapshot')
            setTimeout(() => setError(null), 3000)
        }
    }

    const handleImageLoad = () => {
        setIsLoading(false)
        setError(null)
    }

    const handleImageError = () => {
        setIsLoading(false)
        setError('Unable to connect to webcam. Check URL and network.')
    }

    if (!vehicle?.webcam_url) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
                <div className="glass w-full max-w-2xl p-10 rounded-[40px] border-white/10 relative text-center">
                    <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white">
                        <X size={24} />
                    </button>
                    <Camera className="mx-auto mb-4 text-slate-600" size={48} />
                    <h3 className="text-2xl font-black text-white mb-2">No Webcam Configured</h3>
                    <p className="text-slate-400">Please configure a webcam URL for this vehicle in settings.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-8">
            <div className="w-full h-full max-w-7xl flex flex-col md:flex-row gap-6">
                {/* Main Viewport */}
                <div className="flex-1 glass rounded-[40px] border-white/10 overflow-hidden flex flex-col shadow-2xl">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
                                <Video className="text-amber-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter">{vehicle.license_plate}</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live_Tactical_Feed</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {statusMsg && (
                                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase flex items-center animate-fade-in">
                                    {statusMsg}
                                </div>
                            )}
                            <button onClick={onClose} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Stream Area */}
                    <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-[#020408]">
                                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                <span className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">Acquiring Feed...</span>
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black/80">
                                <X className="text-rose-500" size={48} />
                                <div className="text-rose-400 text-xs font-black uppercase tracking-widest text-center px-4 max-w-xs">{error}</div>
                                <button onClick={() => setStreamUrl(`${vehicle.webcam_url}/video?t=${Date.now()}`)} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10 uppercase tracking-widest">Retry Connection</button>
                            </div>
                        )}
                        <img
                            src={streamUrl}
                            alt="Live webcam feed"
                            className="w-full h-full object-contain"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />

                        {/* Stream Overlays */}
                        <div className="absolute bottom-6 left-6 flex flex-col gap-4">
                            <div className="p-4 glass rounded-2xl border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">
                                Resolution: Auto_Adaptive<br />
                                Latency: {isLoading ? '---' : '< 120ms'}<br />
                                Encryption: SSL_v3_HARDENED
                            </div>

                            {/* Hidden Audio Player */}
                            {activeControls.audioEnabled && (
                                <audio
                                    autoPlay
                                    className="hidden"
                                    src={`${vehicle.webcam_url}/audio.wav`}
                                    onError={() => setStatusMsg('Audio stream failed')}
                                />
                            )}
                        </div>

                        {activeControls.isRecording && (
                            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-rose-600 rounded-lg animate-pulse shadow-lg shadow-rose-600/20">
                                <div className="w-2 h-2 bg-white rounded-full" />
                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Recording</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Control Panel */}
                <div className="w-full md:w-[320px] glass rounded-[40px] border-white/10 overflow-hidden flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-white/5 bg-white/5">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tactical_Override</h4>
                        <p className="text-lg font-black text-white uppercase tracking-tighter">Control Deck</p>
                    </div>

                    <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
                        {/* Zoom Control */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Optical Zoom</label>
                                <span className="text-[10px] font-black text-amber-500 uppercase">{activeControls.zoom.toFixed(1)}x</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleZoom(-1)} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all"><ZoomOut size={16} /></button>
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
                                    <div className="absolute left-0 top-0 h-full bg-amber-500 transition-all duration-300" style={{ width: `${(activeControls.zoom - 1) * 11}%` }} />
                                </div>
                                <button onClick={() => handleZoom(1)} className="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all"><ZoomIn size={16} /></button>
                            </div>
                        </div>

                        {/* Stream Controls */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Primary Operations</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={captureSnapshot} className="p-4 glass hover:bg-white/10 text-slate-300 hover:text-amber-500 rounded-2xl flex flex-col items-center gap-2 transition-all group">
                                    <Camera size={20} className="group-hover:scale-110 transition-transform" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Capture</span>
                                </button>
                                <button
                                    onClick={toggleRecording}
                                    className={`p-4 glass rounded-2xl flex flex-col items-center gap-2 transition-all group ${activeControls.isRecording ? 'bg-rose-500/20 text-rose-500 border-rose-500/20' : 'text-slate-300 hover:text-rose-500'}`}
                                >
                                    {activeControls.isRecording ? <Square size={20} /> : <Circle size={20} fill="currentColor" className="group-hover:scale-110 transition-transform" />}
                                    <span className="text-[8px] font-black uppercase tracking-widest">{activeControls.isRecording ? 'Stop Rec' : 'Record'}</span>
                                </button>
                                <button
                                    onClick={toggleFFC}
                                    className={`p-4 glass rounded-2xl flex flex-col items-center gap-2 transition-all group ${activeControls.ffc ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' : 'text-slate-300 hover:text-amber-500'}`}
                                >
                                    <RefreshCw size={20} className={activeControls.ffc ? 'rotate-180' : ''} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Flip Cam</span>
                                </button>
                                <button
                                    onClick={toggleMotion}
                                    className={`p-4 glass rounded-2xl flex flex-col items-center gap-2 transition-all group ${activeControls.motion_detect ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : 'text-slate-300 hover:text-emerald-500'}`}
                                >
                                    <Activity size={20} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Motion</span>
                                </button>
                            </div>
                        </div>

                        {/* Audio & Advanced */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Sensor Subsystems</label>
                            <div className="space-y-3">
                                <div className="p-4 glass rounded-2xl flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${activeControls.audioEnabled ? 'bg-blue-500/20 border-blue-500/40' : 'bg-white/5 border-white/10'}`}>
                                            {activeControls.audioEnabled ? <Mic className="text-blue-400" size={14} /> : <MicOff className="text-slate-500" size={14} />}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${activeControls.audioEnabled ? 'text-blue-400' : 'text-slate-400'}`}>Listen Stream</span>
                                    </div>
                                    <button
                                        onClick={() => setActiveControls(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }))}
                                        className={`w-10 h-6 rounded-full relative p-1 transition-all border ${activeControls.audioEnabled ? 'bg-blue-600 border-blue-400' : 'bg-white/5 border-white/10'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full transition-all ${activeControls.audioEnabled ? 'bg-white ml-auto' : 'bg-slate-500'}`} />
                                    </button>
                                </div>
                                <div className="p-4 glass rounded-2xl flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-rose-500/10 rounded-lg flex items-center justify-center border border-rose-500/20">
                                            <Layers className="text-rose-400" size={14} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Two-Way Audio</span>
                                    </div>
                                    <button onClick={() => setStatusMsg('Requires native app link')} className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Setup</button>
                                </div>
                                <div className="p-4 glass rounded-2xl flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                                            <Focus className="text-emerald-400" size={14} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auto Focus</span>
                                    </div>
                                    <button onClick={() => sendControl('focus')} className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all">Trigger</button>
                                </div>
                            </div>
                        </div>

                        {/* Stream Resolution */}
                        <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-amber-500/70 uppercase tracking-widest">Transmission Quality</label>
                                <span className="text-[10px] font-black text-amber-500 uppercase">{activeControls.quality}%</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={activeControls.quality}
                                onChange={handleQuality}
                                className="w-full accent-amber-500 bg-white/5 h-1.5 rounded-full outline-none"
                            />
                            <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter text-center">Caution: Higher quality requires > 5Mbps bandwidth</p>
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/5 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex-1 truncate">Origin: {vehicle.webcam_url}</span>
                        <Settings2 size={12} className="text-slate-700" />
                    </div>
                </div>
            </div>
        </div>
    )
}

