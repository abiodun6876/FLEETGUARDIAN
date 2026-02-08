import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Map as MapIcon, Shield, Truck, AlertCircle, History, Settings, Bell, Search, User, Target, Activity, Cpu, Database, Cloud, Plus, Camera, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { supabase } from '../supabase'

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function Dashboard() {
    const [activeTab, setActiveTab] = useState('live')
    const [vehicles, setVehicles] = useState([])
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ online: 0, moving: 0, alert: 0 })
    const [showAddVehicle, setShowAddVehicle] = useState(false)
    const [newVehicle, setNewVehicle] = useState({ license_plate: '', vehicle_name: '' })
    const [selectedVehicle, setSelectedVehicle] = useState(null)
    const [telemetry, setTelemetry] = useState([])
    const [media, setMedia] = useState([])
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: vData } = await supabase.from('vehicles').select('*')
            if (vData) {
                const enriched = await Promise.all(vData.map(async (v) => {
                    const { data: loc } = await supabase.from('locations')
                        .select('*')
                        .eq('vehicle_id', v.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()
                    return { ...v, ...(loc || { lat: 6.45, lng: 3.4, speed: 0 }) }
                }))
                setVehicles(enriched)
                updateStats(enriched)
            }

            // Fetch recent alerts
            const { data: eData } = await supabase.from('events')
                .select('*')
                .eq('event_type', 'SOS')
                .order('created_at', { ascending: false })
                .limit(5)
            if (eData) {
                setNotifications(eData.map(e => ({ id: e.id, msg: `SOS ALERT: ${e.vehicle_id}`, time: e.created_at })))
            }
            setLoading(false)
        }

        const fetchMedia = async () => {
            const { data } = await supabase.from('media').select('*').order('created_at', { ascending: false }).limit(20)
            if (data) setMedia(data)
        }

        fetchInitialData()
        fetchMedia()

        // Realtime Subscriptions
        const locSub = supabase
            .channel('locations-all')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations' }, payload => {
                setVehicles(current => {
                    const next = current.map(v =>
                        v.id === payload.new.vehicle_id
                            ? { ...v, lat: payload.new.lat, lng: payload.new.lng, speed: payload.new.speed }
                            : v
                    )
                    updateStats(next)
                    return next
                })
            })
            .subscribe()

        const eventSub = supabase
            .channel('events-all')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, payload => {
                if (payload.new.event_type === 'SOS') {
                    setNotifications(prev => [{ id: payload.new.id, msg: `SOS ALERT: ${payload.new.vehicle_id}`, time: payload.new.created_at }, ...prev])
                    setVehicles(current => current.map(v =>
                        v.id === payload.new.vehicle_id ? { ...v, status: 'sos' } : v
                    ))
                }
            })
            .subscribe()

        const vehicleSub = supabase
            .channel('vehicles-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => {
                fetchInitialData() // Refresh on structural changes
            })
            .subscribe()

        const mediaSub = supabase
            .channel('media-all')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'media' }, payload => {
                setMedia(prev => [payload.new, ...prev].slice(0, 20))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(locSub)
            supabase.removeChannel(eventSub)
            supabase.removeChannel(vehicleSub)
            supabase.removeChannel(mediaSub)
        }
    }, [])

    const updateStats = (vList) => {
        setStats({
            online: vList.length,
            moving: vList.filter(v => v.speed > 5).length,
            alert: vList.filter(v => v.status === 'sos').length,
            sync: 100
        })
    }

    const requestCapture = async (vId) => {
        const vehicle = vehicles.find(v => v.id === vId)
        await supabase.from('events').insert({
            vehicle_id: vId,
            organization_id: vehicle?.organization_id,
            branch_id: vehicle?.branch_id,
            event_type: 'CAPTURE_REQUEST',
            meta: { requested_by: 'COMMANDER_ALPHA' }
        })
        alert('Capture Command Broadcasted')
    }

    const acknowledgeSOS = async (vId) => {
        await supabase.from('vehicles').update({ status: 'active' }).eq('id', vId)
        setNotifications(prev => prev.filter(n => !n.msg.includes(vId)))
    }

    const handleAddVehicle = async () => {
        if (!newVehicle.plate_number) return
        const { error } = await supabase.from('vehicles').insert({
            license_plate: newVehicle.license_plate.toUpperCase(),
            vehicle_name: newVehicle.vehicle_name,
            status: 'active'
        })
        if (!error) {
            setShowAddVehicle(false)
            setNewVehicle({ license_plate: '', vehicle_name: '' })
        }
    }

    const deleteVehicle = async (vId) => {
        if (window.confirm('Decommission this asset?')) {
            await supabase.from('vehicles').delete().eq('id', vId)
        }
    }

    const fetchTelemetry = async (vId) => {
        const { data } = await supabase.from('locations')
            .select('*')
            .eq('vehicle_id', vId)
            .order('created_at', { ascending: false })
            .limit(20)
        setTelemetry(data || [])
        setActiveTab('history')
    }

    return (
        <div className="flex bg-[#020408] text-slate-200 min-h-screen selection:bg-blue-500/30 font-sans overflow-hidden">
            {/* Sidebar */}
            <AnimatePresence>
                {(isSidebarOpen || window.innerWidth > 1024) && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={`w-[280px] bg-[#05070a] border-r border-white/5 flex flex-col fixed h-full z-[60] shadow-2xl overflow-hidden lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
                    >
                        <div className="p-8 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                                    <Shield className="text-blue-500" size={24} />
                                </div>
                                <div>
                                    <h1 className="title-font font-black text-xl tracking-tighter leading-none uppercase text-white">Fleet<span className="text-blue-500">G</span></h1>
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mt-1 pr-1">Tactical_Overwatch</p>
                                </div>
                            </div>
                            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white/40 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                            <NavItem icon={<MapIcon size={18} />} label="Live Tactical" active={activeTab === 'live'} onClick={() => { setActiveTab('live'); setIsSidebarOpen(false); }} />
                            <NavItem icon={<Truck size={18} />} label="Fleet Assets" active={activeTab === 'vehicles'} onClick={() => { setActiveTab('vehicles'); setIsSidebarOpen(false); }} />
                            <NavItem icon={<History size={18} />} label="Telemetry" active={activeTab === 'history'} onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} />
                            <NavItem icon={<AlertCircle size={18} />} label="Alert Matrix" active={activeTab === 'incidents'} onClick={() => { setActiveTab('incidents'); setIsSidebarOpen(false); }} badge={notifications.length > 0 ? notifications.length.toString() : null} />
                            <NavItem icon={<Camera size={18} />} label="Media Console" active={activeTab === 'media'} onClick={() => { setActiveTab('media'); setIsSidebarOpen(false); }} />
                        </nav>

                        <div className="p-6 border-t border-white/5 bg-black/40">
                            <button
                                onClick={() => { setShowAddVehicle(true); setIsSidebarOpen(false); }}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                            >
                                <Plus size={16} /> Add New Asset
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Backdrop for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Operational Hub */}
            <main className="flex-1 lg:ml-[280px] p-4 md:p-10 overflow-y-auto custom-scrollbar h-screen relative">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
                    <div className="space-y-1 w-full flex justify-between items-end md:block">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.5em]">System_Nominal // Node_Sigma</p>
                            </div>
                            <h2 className="title-font text-3xl md:text-5xl font-black tracking-tighter text-white uppercase">Operations</h2>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-4 glass rounded-2xl text-blue-500 border-blue-500/20"
                        >
                            <LayoutDashboard size={24} />
                        </button>
                    </div>
                    <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                        <div className="glass px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl flex items-center gap-4 border-white/5 bg-[#0a0d14]/50 flex-1 md:flex-none">
                            <Search size={18} className="text-slate-600" />
                            <input type="text" placeholder="QUERY..." className="bg-transparent border-none outline-none text-[10px] md:text-xs w-full font-bold uppercase tracking-widest text-blue-400" />
                        </div>
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <User size={24} className="text-blue-500" />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                    <StatCard icon={<Truck className="text-blue-500" />} label="Assets" value={stats.online} trend="Active Nodes" />
                    <StatCard icon={<Activity className="text-emerald-500" />} label="Engagement" value={stats.moving} trend="Units in motion" />
                    <StatCard icon={<AlertCircle className="text-rose-500" />} label="Threats" value={stats.alert} trend="Priority Alerts" alert={stats.alert > 0} />
                    <StatCard icon={<Cloud className="text-blue-400" />} label="Latency" value="1.2" suffix="ms" trend="Sync Nominal" />
                </div>

                {activeTab === 'live' && (
                    <div className="grid grid-cols-12 gap-4 md:gap-8 h-auto lg:h-[700px]">
                        <div className="col-span-12 xl:col-span-8 glass rounded-3xl md:rounded-[40px] relative overflow-hidden border-white/5 shadow-3xl h-[400px] md:h-full">
                            <MapContainer center={[6.52, 3.37]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                {vehicles.map(v => (
                                    <Marker key={v.id} position={[v.lat, v.lng]}>
                                        <Popup className="tactical-popup">
                                            <div className="bg-[#0a0d12] text-white p-4 rounded-xl border border-white/10 min-w-[200px]">
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="font-black text-lg text-blue-400">{v.license_plate}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${v.status === 'moving' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                        {v.status}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                    <button onClick={() => requestCapture(v.id)} className="p-2 bg-blue-600/20 text-blue-400 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase border border-blue-500/20">
                                                        <Camera size={14} /> Snap
                                                    </button>
                                                    <button onClick={() => fetchTelemetry(v.id)} className="p-2 bg-white/5 text-white rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase border border-white/5">
                                                        <History size={14} /> Logs
                                                    </button>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                        <div className="col-span-12 xl:col-span-4 glass rounded-3xl md:rounded-[40px] border-white/5 shadow-3xl overflow-hidden flex flex-col h-[500px] lg:h-full">
                            <div className="p-6 md:p-8 border-b border-white/5 bg-white/[0.02]">
                                <h3 className="font-black title-font text-xl md:text-2xl tracking-tighter">TACTICAL_FEED</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                {vehicles.map(v => (
                                    <VehicleItem key={v.id} vehicle={v} onSelect={() => setSelectedVehicle(v)} onCapture={() => requestCapture(v.id)} onLogs={() => fetchTelemetry(v.id)} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'vehicles' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {vehicles.map(v => (
                            <div key={v.id} className="glass p-6 md:p-8 rounded-3xl md:rounded-[40px] border-white/5 relative group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                                        <Truck className="text-blue-500" size={28} />
                                    </div>
                                    <button onClick={() => deleteVehicle(v.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                                <h4 className="text-xl md:text-2xl font-black text-white px-1">{v.license_plate}</h4>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 px-1">{v.vehicle_name || 'System Operator'}</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase py-3 border-b border-white/5">
                                        <span className="text-slate-600">ID</span>
                                        <span className="text-slate-400 font-mono">{v.id.split('-')[0]}...</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase py-3 border-b border-white/5">
                                        <span className="text-slate-600">Status</span>
                                        <span className={v.status === 'sos' ? 'text-rose-500' : 'text-blue-500'}>{v.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="glass rounded-3xl md:rounded-[40px] border-white/5 overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <th className="p-4 md:p-6">Timestamp</th>
                                    <th className="p-4 md:p-6">Velocity</th>
                                    <th className="p-4 md:p-6">Coordinates</th>
                                    <th className="p-4 md:p-6">Event</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px] font-bold text-slate-300">
                                {telemetry.length > 0 ? telemetry.map((t, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                        <td className="p-4 md:p-6 text-slate-500 shrink-0">{new Date(t.created_at).toLocaleString()}</td>
                                        <td className="p-4 md:p-6"><span className="text-blue-500 font-black">{t.speed.toFixed(1)}</span> KM/H</td>
                                        <td className="p-4 md:p-6 font-mono text-slate-400">{t.lat.toFixed(4)}, {t.lng.toFixed(4)}</td>
                                        <td className="p-4 md:p-6"><span className="px-2 py-1 bg-white/5 rounded text-[8px] uppercase">Telemetry</span></td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" className="p-12 text-center text-slate-600 uppercase font-black tracking-widest">Select a vehicle to view tactical logs</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'incidents' && (
                    <div className="space-y-4">
                        {notifications.map(n => (
                            <div key={n.id} className="glass p-6 md:p-8 rounded-3xl md:rounded-[40px] border-rose-500/20 flex flex-col md:flex-row items-start md:items-center justify-between bg-rose-500/[0.02] gap-6">
                                <div className="flex items-center gap-6 md:gap-8">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/40 animate-pulse shrink-0">
                                        <AlertCircle size={28} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg md:text-xl font-black text-white">{n.msg}</h4>
                                        <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mt-1 pr-1">{new Date(n.time).toLocaleString()}</p>
                                    </div>
                                </div>
                                <button onClick={() => acknowledgeSOS(n.msg.replace('SOS ALERT: ', ''))} className="w-full md:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black rounded-xl md:rounded-2xl uppercase tracking-widest transition-all">
                                    Acknowledge Signal
                                </button>
                            </div>
                        ))}
                        {notifications.length === 0 && <div className="text-center py-20 text-slate-600 uppercase font-black tracking-widest">No active threats detected</div>}
                    </div>
                )}
                {activeTab === 'media' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {media.map(m => (
                            <div key={m.id} className="glass overflow-hidden group rounded-3xl md:rounded-[40px] border-white/5">
                                <div className="aspect-video relative overflow-hidden">
                                    <img src={m.url} alt="Tactical Capture" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="p-6">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{vehicles.find(v => v.id === m.vehicle_id)?.license_plate || 'Unknown Asset'}</p>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{new Date(m.created_at).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                        {media.length === 0 && <div className="col-span-full py-20 text-center text-slate-600 uppercase font-black tracking-widest">No tactical captures available</div>}
                    </div>
                )}
            </main>

            {/* Modals */}
            <AnimatePresence>
                {showAddVehicle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass w-full max-w-md p-10 rounded-[40px] border-white/10 relative">
                            <button onClick={() => setShowAddVehicle(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24} /></button>
                            <h3 className="text-3xl font-black title-font mb-8 uppercase px-2">Register Asset</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4">Plate Identifier</label>
                                    <input value={newVehicle.license_plate} onChange={e => setNewVehicle({ ...newVehicle, license_plate: e.target.value })} type="text" placeholder="FG-000" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-blue-400 font-mono outline-none focus:border-blue-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4">Operator Name</label>
                                    <input value={newVehicle.vehicle_name} onChange={e => setNewVehicle({ ...newVehicle, vehicle_name: e.target.value })} type="text" placeholder="COMMANDER NAME" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-slate-200 outline-none focus:border-blue-500/50" />
                                </div>
                                <button onClick={handleAddVehicle} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/20 uppercase tracking-widest text-xs mt-4">Confirm Deployment</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function NavItem({ icon, label, active, onClick, badge }) {
    return (
        <div onClick={onClick} className={`flex items-center justify-between px-6 py-4 rounded-3xl cursor-pointer transition-all duration-300 group relative ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-600 hover:bg-white/5 hover:text-slate-200'}`}>
            <div className="flex items-center gap-4">
                <span className={active ? 'text-white' : 'group-hover:text-blue-400'}>{icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {badge && <span className="bg-rose-600 text-white text-[9px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 shadow-lg animate-pulse">{badge}</span>}
        </div>
    )
}

function StatCard({ icon, label, value, trend, suffix = '', alert }) {
    return (
        <div className={`glass p-8 rounded-[40px] border border-white/5 relative overflow-hidden group shadow-2xl transition-all ${alert ? 'bg-rose-500/[0.03]' : ''}`}>
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${alert ? 'bg-rose-500/10' : 'bg-white/5'}`}>{icon}</div>
                {alert && <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />}
            </div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none mb-2">{label}</p>
            <div className="flex items-baseline gap-1">
                <h4 className="text-4xl font-black text-white">{value}</h4>
                {suffix && <span className="text-xs font-black text-slate-500">{suffix}</span>}
            </div>
            <p className={`text-[9px] font-black uppercase mt-4 ${alert ? 'text-rose-400' : 'text-blue-500'}`}>{trend}</p>
        </div>
    )
}

function VehicleItem({ vehicle, onCapture, onLogs }) {
    return (
        <div className={`p-6 rounded-[32px] border border-transparent transition-all group ${vehicle.status === 'sos' ? 'bg-rose-500/5 hover:border-rose-500/20' : 'hover:bg-blue-500/[0.04] hover:border-white/5'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${vehicle.status === 'moving' ? 'bg-emerald-500' : vehicle.status === 'sos' ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`} />
                    <div>
                        <p className="text-base font-black text-white tracking-tight">{vehicle.license_plate}</p>
                        <p className="text-[8px] text-slate-600 font-extrabold uppercase tracking-widest">{vehicle.vehicle_name || 'Operator'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-lg font-black text-white">{vehicle.speed.toFixed(0)} <span className="text-[9px] text-slate-600">KM/H</span></p>
                </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onCapture} className="flex-1 py-2 bg-blue-600/20 text-blue-400 text-[8px] font-black uppercase rounded-xl border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all">Capture</button>
                <button onClick={onLogs} className="flex-1 py-2 bg-white/5 text-slate-400 text-[8px] font-black uppercase rounded-xl border border-white/5 hover:text-white transition-all">Logs</button>
            </div>
        </div>
    )
}

export default Dashboard
