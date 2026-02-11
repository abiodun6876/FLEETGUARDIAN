import { useState, useEffect } from 'react'
import { X, Camera, RefreshCw } from 'lucide-react'

export default function WebcamViewer({ vehicle, onClose }) {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [streamUrl, setStreamUrl] = useState('')

    useEffect(() => {
        if (vehicle?.webcam_url) {
            // IP Webcam typically provides video at /video endpoint
            setStreamUrl(`${vehicle.webcam_url}/video`)
        }
    }, [vehicle])

    const captureSnapshot = async () => {
        try {
            // IP Webcam snapshot endpoint
            const snapshotUrl = `${vehicle.webcam_url}/shot.jpg`
            const response = await fetch(snapshotUrl)
            const blob = await response.blob()

            // Here you would upload to Supabase storage
            // For now, just download locally
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `snapshot-${vehicle.license_plate}-${Date.now()}.jpg`
            a.click()
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
            <div className="w-full max-w-5xl">
                <div className="glass rounded-[40px] border-white/10 overflow-hidden">
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-white/10">
                        <div>
                            <h3 className="text-2xl font-black text-white">{vehicle.license_plate}</h3>
                            <p className="text-sm text-slate-400">Live Camera Feed</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={captureSnapshot}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl flex items-center gap-2 text-sm font-bold transition-all"
                            >
                                <Camera size={16} />
                                Snapshot
                            </button>
                            <button
                                onClick={() => setStreamUrl(`${vehicle.webcam_url}/video?t=${Date.now()}`)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2 text-sm font-bold transition-all"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </button>
                            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Video Stream */}
                    <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-sm">Loading stream...</div>
                            </div>
                        )}
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-rose-400 text-sm text-center px-4">{error}</div>
                            </div>
                        )}
                        <img
                            src={streamUrl}
                            alt="Live webcam feed"
                            className="w-full h-full object-contain"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    </div>

                    {/* Info Footer */}
                    <div className="p-4 bg-white/5 text-xs text-slate-500 text-center">
                        Stream URL: {vehicle.webcam_url}
                    </div>
                </div>
            </div>
        </div>
    )
}
