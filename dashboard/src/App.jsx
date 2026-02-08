import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Map as MapIcon, Shield, Truck, AlertCircle, Settings, Bell, Search, User, Target, Activity, Cpu, Database, Cloud, Plus, Trash2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { supabase } from './supabase'

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function App() {
    const [activeTab, setActiveTab] = useState('live')
    const [vehicles, setVehicles] = useState([])
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ online: 0, moving: 0, alert: 0 })
    const [showAddVehicle, setShowAddVehicle] = useState(false)
    const [newVehicle, setNewVehicle] = useState({ plate_number: '', driver_name: '' })
    const [selectedVehicle, setSelectedVehicle] = useState(null)

    // Fetch initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: vData } = await supabase.from('vehicles').select('*')
            if (vData) {
                const validVehicles = vData.filter(v => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.id));
                const enriched = await Promise.all(validVehicles.map(async (v) => {
                    const { data: loc } = await supabase.from('locations')
                        .select('*')
                        .eq('vehicle_id', v.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle()
                    return {
                        ...v,
                        lat: loc?.lat || 6.45,
                        lng: loc?.lng || 3.4,
                        speed: loc?.speed || 0
                    }
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

        fetchInitialData()

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

        return () => {
            supabase.removeChannel(locSub)
            supabase.removeChannel(eventSub)
            supabase.removeChannel(vehicleSub)
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

    const isUUID = (str) => {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(str);
    }

    const acknowledgeSOS = async (fullMsg) => {
        // Correctly extract UUID from string like "SOS ALERT: 5c8becdf..."
        const parts = fullMsg.split(': ');
        const vId = parts.length > 1 ? parts[1].trim() : null;

        if (vId && isUUID(vId)) {
            await supabase.from('vehicles').update({
                status: 'online',
                organization_id: '87cc6b87-b93a-40ef-8ad0-0340f5ff8321',
                branch_id: 'b5e731df-b8cb-4073-a865-df7602b51a9d'
            }).eq('id', vId)
            setNotifications(prev => prev.filter(n => !n.msg.includes(vId)))
        } else {
            console.warn('SYSTEM_ERROR: Malformed SOS message, cannot acknowledge', fullMsg);
            setNotifications(prev => prev.filter(n => n.msg !== fullMsg));
        }
    }

    const handleAddVehicle = async () => {
        if (!newVehicle.plate_number) return
        const { data, error } = await supabase.from('vehicles').insert({
            plate_number: newVehicle.plate_number.toUpperCase(),
            driver_name: newVehicle.driver_name,
            status: 'offline',
            organization_id: '87cc6b87-b93a-40ef-8ad0-0340f5ff8321',
            branch_id: 'b5e731df-b8cb-4073-a865-df7602b51a9d'
        }).select()

        if (error) {
            console.error('Registration Error:', error)
            alert(`Fleet Registration Failed: ${error.message}`)
        } else {
            setShowAddVehicle(false)
            setNewVehicle({ plate_number: '', driver_name: '' })
        }
    }

    const deleteVehicle = async (vId) => {
        if (window.confirm('Decommission this asset?')) {
            await supabase.from('vehicles').delete().eq('id', vId)
        }
    }

    return (
        <div className="flex bg-[#020408] text-slate-200 min-h-screen selection:bg-blue-500/30 font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-[280px] bg-[#05070a] border-r border-white/5 flex flex-col fixed h-full z-20 shadow-2xl overflow-hidden">
                <div className="p-8 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
                        <Shield className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <h1 className="title-font font-black text-xl tracking-tighter leading-none uppercase">Fleet<span className="text-blue-500">G</span></h1>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mt-1 pr-1">Tactical_Overwatch</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <NavItem icon={<MapIcon size={18} />} label="Live Tactical" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
                    <NavItem icon={<Truck size={18} />} label="Fleet Assets" active={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')} />
                    <NavItem icon={<AlertCircle size={18} />} label="Alert Matrix" active={activeTab === 'incidents'} onClick={() => setActiveTab('incidents')} badge={notifications.length > 0 ? notifications.length.toString() : null} />
                </nav>

                <div className="p-6 border-t border-white/5 bg-black/40">
                    <button
                        onClick={() => setShowAddVehicle(true)}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20"
                    >
                        <Plus size={16} /> Add New Asset
                    </button>
                </div>
            </aside>

            {/* Main Operational Hub */}
            <main className="flex-1 ml-[280px] p-10 overflow-y-auto custom-scrollbar h-screen relative">
                <header className="flex justify-between items-end mb-12">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.5em]">System_Nominal // Node_Sigma</p>
                        </div>
                        <h2 className="title-font text-5xl font-black tracking-tighter text-white uppercase">Operations</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="glass px-6 py-4 rounded-3xl flex items-center gap-4 border-white/5 bg-[#0a0d14]/50">
                            <Search size={20} className="text-slate-600" />
                            <input type="text" placeholder="UUID_QUERY..." className="bg-transparent border-none outline-none text-xs w-full font-bold uppercase tracking-widest text-blue-400" />
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                            <User size={28} className="text-blue-500" />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-4 gap-6 mb-10">
                    <StatCard icon={<Truck className="text-blue-500" />} label="Assets" value={stats.online} trend="Active Nodes" />
                    <StatCard icon={<Activity className="text-emerald-500" />} label="Engagement" value={stats.moving} trend="Units in motion" />
                    <StatCard icon={<AlertCircle className="text-rose-500" />} label="Threats" value={stats.alert} trend="Priority Alerts" alert={stats.alert > 0} />
                    <StatCard icon={<Cloud className="text-blue-400" />} label="Uplink" value="SECURE" trend="Encrypted" />
                </div>

                {activeTab === 'live' && (
                    <div className="h-[700px] glass rounded-[40px] relative overflow-hidden border-white/5 shadow-3xl">
                        <MapContainer center={[6.52, 3.37]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

                            {vehicles.map((v, i, arr) => {
                                // Jitter logic for overlapping vehicles
                                const sameLoc = arr.filter(ov => Math.abs(ov.lat - v.lat) < 0.00001 && Math.abs(ov.lng - v.lng) < 0.00001);
                                let position = [v.lat, v.lng];

                                if (sameLoc.length > 1) {
                                    const idx = sameLoc.findIndex(ov => ov.id === v.id);
                                    const angle = (idx / sameLoc.length) * Math.PI * 2;
                                    const radius = 0.0003; // ~30m separation
                                    position = [v.lat + Math.cos(angle) * radius, v.lng + Math.sin(angle) * radius];
                                }

                                return (
                                    <Marker key={v.id} position={position}>
                                        <Popup className="tactical-popup">
                                            <div className="bg-[#0a0d12] text-white p-4 rounded-xl border border-white/10 min-w-[200px]">
                                                <div className="flex justify-between items-start mb-4">
                                                    <p className="font-black text-lg text-blue-400">{v.plate_number}</p>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${v.status === 'moving' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                        {v.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )
                            })}

                            <MapController selectedVehicle={selectedVehicle ? vehicles.find(v => v.id === selectedVehicle.id) : null} />
                        </MapContainer>
                    </div>
                )}

                {
                    activeTab === 'vehicles' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {vehicles.map(v => (
                                <div key={v.id} className="glass p-8 rounded-[40px] border-white/5 relative group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                                            <Truck className="text-blue-500" size={32} />
                                        </div>
                                        <button onClick={() => deleteVehicle(v.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    <h4 className="text-2xl font-black text-white px-1">{v.plate_number}</h4>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 px-1">{v.driver_name || 'System Operator'}</p>
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
                    )
                }

                {
                    activeTab === 'incidents' && (
                        <div className="space-y-4">
                            {notifications.map(n => (
                                <div key={n.id} className="glass p-8 rounded-[40px] border-rose-500/20 flex items-center justify-between bg-rose-500/[0.02]">
                                    <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/40 animate-pulse">
                                            <AlertCircle size={32} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-white">{n.msg}</h4>
                                            <p className="text-[10px] font-black text-rose-300 uppercase tracking-widest mt-1 pr-1">{new Date(n.time).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => acknowledgeSOS(n.msg)} className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest transition-all">
                                        Acknowledge Signal
                                    </button>
                                </div>
                            ))}
                            {notifications.length === 0 && <div className="text-center py-20 text-slate-600 uppercase font-black tracking-widest">No active threats detected</div>}
                        </div>
                    )
                }
            </main >

            {/* Modals */}
            < AnimatePresence >
                {showAddVehicle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass w-full max-w-md p-10 rounded-[40px] border-white/10 relative">
                            <button onClick={() => setShowAddVehicle(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24} /></button>
                            <h3 className="text-3xl font-black title-font mb-8 uppercase px-2">Register Asset</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4">Plate Identifier</label>
                                    <input value={newVehicle.plate_number} onChange={e => setNewVehicle({ ...newVehicle, plate_number: e.target.value })} type="text" placeholder="FG-000" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-blue-400 font-mono outline-none focus:border-blue-500/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-4">Operator Name</label>
                                    <input value={newVehicle.driver_name} onChange={e => setNewVehicle({ ...newVehicle, driver_name: e.target.value })} type="text" placeholder="COMMANDER NAME" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-slate-200 outline-none focus:border-blue-500/50" />
                                </div>
                                <button onClick={handleAddVehicle} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-600/20 uppercase tracking-widest text-xs mt-4">Confirm Deployment</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </div >
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

function MapController({ selectedVehicle }) {
    const map = useMap()
    useEffect(() => {
        if (selectedVehicle) {
            map.flyTo([selectedVehicle.lat, selectedVehicle.lng], 16, { animate: true })
        }
    }, [selectedVehicle?.lat, selectedVehicle?.lng]) // Only re-center when coordinates change
    return null
}

export default App
