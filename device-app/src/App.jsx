import React, { useState, useEffect, useRef } from 'react'
import { MapPin, Camera, Mic, Wifi, Battery, Shield, AlertTriangle, Play, Square, RefreshCcw, Target, Activity, Settings, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './supabase'

function App() {
    const [location, setLocation] = useState({ lat: 0, lng: 0, speed: 0, heading: 0 })
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [deviceStatus, setDeviceStatus] = useState('IDLE')
    const [logs, setLogs] = useState([])
    const [vehicleId, setVehicleId] = useState(localStorage.getItem('vehicle_id') || '')
    const [plateNumber, setPlateNumber] = useState(localStorage.getItem('plate_number') || '')
    const [showCamera, setShowCamera] = useState(false)
    const [batteryLevel, setBatteryLevel] = useState(100)
    const videoRef = useRef(null)

    const addLog = (msg) => {
        setLogs(prev => [msg, ...prev].slice(0, 8))
    }

    // Effect for Battery (Simulation)
    useEffect(() => {
        const interval = setInterval(() => {
            setBatteryLevel(prev => Math.max(0, prev - 1))
        }, 600000)
        return () => clearInterval(interval)
    }, [])

    // Effect for Online Status
    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); addLog('NETWORK: RESTORED'); }
        const handleOffline = () => { setIsOnline(false); addLog('NETWORK: OFFLINE'); }
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    // Real-time Command Listener
    useEffect(() => {
        if (!vehicleId) return

        const channel = supabase
            .channel(`commands:${vehicleId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'events',
                filter: `vehicle_id=eq.${vehicleId}`
            }, payload => {
                if (payload.new.event_type === 'CAPTURE_REQUEST') {
                    addLog('COMMAND: REMOTE_CAPTURE_INIT')
                    takeSnapshot()
                } else if (payload.new.event_type === 'START_LIVE_FEED') {
                    addLog('COMMAND: START_STREAM')
                    startCamera()
                } else if (payload.new.event_type === 'STOP_LIVE_FEED') {
                    addLog('COMMAND: STOP_STREAM')
                    stopCamera()
                }
            })
            .subscribe()

        return () => supabase.removeChannel(channel)
    }, [vehicleId])

    const [isTracking, setIsTracking] = useState(false)

    // GPS Heartbeat
    useEffect(() => {
        if (!vehicleId || !isTracking) return;

        const updateLocation = async (pos) => {
            const { latitude: lat, longitude: lng, speed, heading } = pos.coords
            const currentSpeed = (speed || 0) * 3.6
            setLocation({ lat, lng, speed: currentSpeed, heading: heading || 0 })

            try {
                const { error } = await supabase.from('locations').insert({
                    vehicle_id: vehicleId,
                    lat,
                    lng,
                    speed: currentSpeed,
                    heading: heading || 0
                })
                if (error) throw error;

                // Also update vehicle status
                await supabase.from('vehicles').update({
                    last_seen: new Date().toISOString(),
                    status: currentSpeed > 5 ? 'moving' : 'active'
                }).eq('id', vehicleId)

            } catch (err) {
                console.error('GPS_UPLOAD_FAILED', err)
            }
        }

        const watchId = navigator.geolocation.watchPosition(
            updateLocation,
            (err) => addLog(`GPS_ERROR: ${err.message}`),
            { enableHighAccuracy: true, maximumAge: 10000 }
        )

        return () => navigator.geolocation.clearWatch(watchId)
    }, [vehicleId, isTracking])

    const connectTerminal = async (plate) => {
        if (!plate) return
        try {
            setDeviceStatus('CONNECTING')
            let { data, error } = await supabase
                .from('vehicles')
                .select('id')
                .eq('plate_number', plate.toUpperCase())
                .single()

            if (error && error.code !== 'PGRST116') throw error

            if (!data) {
                addLog(`SYSTEM: REGISTERING_${plate.toUpperCase()}`)
                const { data: newVal, error: insError } = await supabase
                    .from('vehicles')
                    .insert({
                        plate_number: plate.toUpperCase(),
                        status: 'online',
                        driver_name: 'DEVICE_USER'
                    })
                    .select()
                    .single()
                if (insError) throw insError
                data = newVal
            }

            setVehicleId(data.id)
            setPlateNumber(plate.toUpperCase())
            localStorage.setItem('vehicle_id', data.id)
            localStorage.setItem('plate_number', plate.toUpperCase())
            addLog(`SYNC: TERMINAL_LINKED_${plate.toUpperCase()}`)
            setDeviceStatus('IDLE')
        } catch (err) {
            addLog(`AUTH_ERROR: ${err.message}`)
            setDeviceStatus('ERROR')
        }
    }

    // Camera Management
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: true
            })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setShowCamera(true)
                addLog('CAMERA: ACTIVE')
                broadcastStream()
            }
        } catch (err) {
            addLog(`CAM_ERROR: ${err.message}`)
        }
    }

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop())
            setShowCamera(false)
            addLog('CAMERA: STOPPED')
            if (streamInterval.current) {
                if (streamInterval.current.mediaRecorder) {
                    streamInterval.current.mediaRecorder.stop()
                }
                clearInterval(streamInterval.current)
                streamInterval.current = null
            }
        }
    }

    const streamInterval = useRef(null)
    const broadcastStream = () => {
        if (streamInterval.current) return

        const channel = supabase.channel('tactical-stream')
        channel.subscribe()

        streamInterval.current = setInterval(() => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                const canvas = document.createElement('canvas')
                canvas.width = 320 // Small resolution for speed
                canvas.height = 240
                const ctx = canvas.getContext('2d')
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

                channel.send({
                    type: 'broadcast',
                    event: 'frame',
                    payload: {
                        vId: vehicleId,
                        image: canvas.toDataURL('image/jpeg', 0.1) // Low quality
                    }
                })
            }
        }, 600)

        // Audio Relay
        const mediaRecorder = new MediaRecorder(videoRef.current.srcObject)
        mediaRecorder.ondataavailable = async (e) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                channel.send({
                    type: 'broadcast',
                    event: 'audio',
                    payload: {
                        vId: vehicleId,
                        audio: reader.result
                    }
                })
            }
            reader.readAsDataURL(e.data)
        }
        mediaRecorder.start(1000) // 1 second chunks
        streamInterval.current.mediaRecorder = mediaRecorder
    }

    const takeSnapshot = async () => {
        if (!videoRef.current) {
            // If camera isn't active, try to start it briefly
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
                const video = document.createElement('video')
                video.srcObject = stream
                await video.play()

                const canvas = document.createElement('canvas')
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                const ctx = canvas.getContext('2d')
                ctx.drawImage(video, 0, 0)

                stream.getTracks().forEach(t => t.stop())
                uploadMedia(canvas)
            } catch (err) {
                addLog(`SNAP_ERROR: ${err.message}`)
            }
            return
        }

        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(videoRef.current, 0, 0)
        uploadMedia(canvas)
    }

    const uploadMedia = async (canvas) => {
        addLog('UPLOADING: SNAPSHOT...')
        canvas.toBlob(async (blob) => {
            const fileName = `${vehicleId}/${Date.now()}.jpg`
            try {
                // Upload to Storage (Assuming 'media' bucket exists)
                const { error: storageError } = await supabase.storage
                    .from('media')
                    .upload(fileName, blob)

                if (storageError) throw storageError

                const { data: { publicUrl } } = supabase.storage
                    .from('media')
                    .getPublicUrl(fileName)

                // Insert into media table
                await supabase.from('media').insert({
                    vehicle_id: vehicleId,
                    type: 'image',
                    url: publicUrl,
                    trigger_type: 'manual'
                })

                addLog('UPLOAD: SUCCESS')
            } catch (err) {
                addLog(`UPLOAD_ERROR: ${err.message}`)
            }
        }, 'image/jpeg', 0.8)
    }

    const handleSOS = async () => {
        if (!vehicleId) return
        setDeviceStatus('SOS_ACTIVE')
        addLog('EVENT: SOS_SIGNAL_SENT')

        await supabase.from('events').insert({
            vehicle_id: vehicleId,
            event_type: 'SOS',
            meta: { lat: location.lat, lng: location.lng, time: new Date().toISOString() }
        })

        await supabase.from('vehicles').update({ status: 'sos' }).eq('id', vehicleId)

        setTimeout(() => setDeviceStatus('IDLE'), 10000)
    }

    return (
        <div className="flex flex-col h-screen p-4 gap-4 overflow-hidden bg-[#020408] text-slate-100 selection:bg-emerald-500/30">
            {/* Header / HUD */}
            <header className="flex justify-between items-center glass p-4 rounded-3xl border-white/5 shadow-2xl shadow-emerald-950/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                        <Shield className="text-emerald-500" size={20} />
                    </div>
                    <div>
                        <h1 className="title-font font-black text-lg tracking-tighter uppercase leading-tight">
                            Fleet<span className="text-emerald-500">Guardian</span>
                        </h1>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest">
                                {vehicleId ? plateNumber : 'Active System'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center">
                        <Wifi className={isOnline ? "text-emerald-500" : "text-rose-500"} size={18} />
                        <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">Net</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <Battery className={batteryLevel > 20 ? "text-emerald-500" : "text-rose-500"} size={18} />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[6px] font-black text-black">{batteryLevel}</span>
                            </div>
                        </div>
                        <span className="text-[8px] text-slate-500 font-bold uppercase mt-1">Pwr</span>
                    </div>
                </div>
            </header>

            {!vehicleId ? (
                <main className="flex-1 glass flex flex-col justify-center items-center p-8 gap-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-xl shadow-emerald-500/10 group-hover:scale-110 transition-transform duration-500">
                        <Activity className="text-emerald-500" size={48} />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="title-font text-3xl font-black text-white px-2">System Required</h2>
                        <p className="text-slate-400 text-sm max-w-[240px] mx-auto leading-relaxed">Assign this terminal to a fleet vehicle to begin telemetry synchronization.</p>
                    </div>
                    <div className="w-full max-w-sm space-y-4">
                        <input
                            type="text"
                            placeholder="PLATE_NUMBER (e.g. FG-101)"
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-center font-mono text-emerald-400 outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all placeholder:text-slate-700 shadow-inner"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') connectTerminal(e.target.value)
                            }}
                        />
                        <button
                            className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
                            onClick={() => {
                                const input = document.querySelector('input')
                                connectTerminal(input.value)
                            }}
                        >
                            Connect Terminal
                        </button>
                    </div>
                </main>
            ) : (
                <>
                    <div className="flex-1 flex flex-col gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 glass p-6 flex flex-col justify-center items-center text-center relative overflow-hidden group shadow-2xl shadow-black/50"
                        >
                            {/* ... (existing visualization code) ... */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/20 animate-[scan_4s_linear_infinite]" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
                            </div>

                            {showCamera ? (
                                <div className="absolute inset-0 z-10 bg-black overflow-hidden">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-90 scale-105" />
                                    <div className="absolute inset-x-8 inset-y-12 border border-emerald-500/30 pointer-events-none rounded-xl">
                                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-emerald-500" />
                                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-emerald-500" />
                                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-emerald-500" />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-emerald-500" />
                                        <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded-md">
                                            <span className="text-[8px] font-black tracking-widest text-emerald-500 uppercase">REC_LIVE</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative z-0">
                                    <div className="mb-8 relative transition-transform duration-700 hover:scale-105">
                                        <div className="w-52 h-52 rounded-full border-2 border-emerald-500/5 flex items-center justify-center relative">
                                            <div className="w-44 h-44 rounded-full border border-emerald-500/10 flex items-center justify-center bg-emerald-500/[0.02]">
                                                <div className="w-36 h-36 rounded-full border-2 border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]">
                                                    <MapPin className={`${isTracking ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-slate-700"}`} size={56} />
                                                </div>
                                            </div>
                                            {isTracking && <div className="absolute inset-0 border-t-2 border-l-2 border-emerald-500/40 rounded-full animate-spin [animation-duration:8s]" />}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h2 className="text-6xl font-black title-font text-white flex items-baseline justify-center gap-2">
                                            {location.speed.toFixed(0)}
                                            <span className="text-xs font-black text-slate-500 tracking-[0.3em] uppercase">KM/H</span>
                                        </h2>
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                {location.lat.toFixed(6)}°N
                                            </span>
                                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                {location.lng.toFixed(6)}°E
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-center">
                                        <button
                                            onClick={() => setIsTracking(!isTracking)}
                                            className={`px-6 py-3 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${isTracking ? 'bg-emerald-500 text-black border-transparent shadow-lg shadow-emerald-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                                        >
                                            {isTracking ? 'UPLINK ACTIVE' : 'START UPLINK'}
                                        </button>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-4 w-72 mx-auto">
                                        <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                                            <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1 text-left px-1">Compass</p>
                                            <p className="text-sm text-slate-200 font-black">{location.heading.toFixed(0)}° {getHeadingName(location.heading)}</p>
                                        </div>
                                        <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                                            <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1 text-left px-1">Status</p>
                                            <p className="text-sm text-emerald-400 font-black uppercase text-center">{deviceStatus}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={showCamera ? stopCamera : startCamera}
                                className={`glass group relative p-6 flex flex-col items-center gap-3 active:scale-[0.97] transition-all overflow-hidden ${showCamera ? 'bg-emerald-500/20 border-emerald-500/50' : 'hover:bg-white/5'}`}
                            >
                                <div className={`p-3 rounded-2xl ${showCamera ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'} transition-colors`}>
                                    {showCamera ? <Square size={24} /> : <Camera size={24} />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{showCamera ? 'Abort Feed' : 'Optical Link'}</span>
                            </button>

                            <button
                                onClick={takeSnapshot}
                                className="glass group p-6 flex flex-col items-center gap-3 hover:bg-white/5 active:scale-[0.97] transition-all"
                            >
                                <div className="p-3 rounded-2xl bg-slate-800 text-slate-400 group-hover:text-emerald-400 transition-colors">
                                    <Target size={24} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Capture</span>
                            </button>
                        </div>

                        <button
                            onClick={handleSOS}
                            disabled={deviceStatus === 'SOS_ACTIVE'}
                            className={`p-6 rounded-3xl flex items-center justify-center gap-4 transition-all relative overflow-hidden group ${deviceStatus === 'SOS_ACTIVE' ? 'bg-rose-600 text-white' : 'bg-rose-950/20 border border-rose-500/30 text-rose-500 active:scale-[0.98]'}`}
                        >
                            {deviceStatus === 'SOS_ACTIVE' && (
                                <div className="absolute inset-0 bg-rose-500 opacity-20 animate-pulse" />
                            )}
                            <AlertTriangle className={`${deviceStatus === 'SOS_ACTIVE' ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} size={28} />
                            <span className="text-xl font-black title-font tracking-[0.2em] uppercase">Emergency SOS</span>
                        </button>
                    </div>

                    <div className="glass p-4 rounded-3xl bg-black/40 border-white/5 backdrop-blur-2xl">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telemetry Output</span>
                            <span className="text-[8px] font-mono text-emerald-500 animate-pulse">STREAM_LIVE</span>
                        </div>
                        <div className="space-y-1.5 max-h-[80px] overflow-hidden">
                            {logs.map((log, i) => (
                                <div key={i} className="flex items-start gap-4 text-[9px] font-mono leading-none">
                                    <span className="text-emerald-500/30 shrink-0">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                                    <span className={`${log.includes('ERROR') ? 'text-rose-400' : log.includes('EVENT') ? 'text-blue-400' : 'text-slate-400'} uppercase tracking-tighter line-clamp-1`}>{log}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scan {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
            ` }} />
        </div>
    )
}

function getHeadingName(degree) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return directions[Math.round(degree / 45) % 8]
}

export default App
