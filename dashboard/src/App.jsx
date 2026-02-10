import React, { useState, useEffect } from 'react'
import { LayoutDashboard, Map as MapIcon, Shield, Truck, AlertCircle, Settings, Bell, Search, User, Target, Activity, Cpu, Database, Cloud, Plus, Trash2, X, Package, DollarSign } from 'lucide-react'
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
    const [rides, setRides] = useState([])
    const [history, setHistory] = useState([])
    const [dailyRides, setDailyRides] = useState([])
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ online: 0, moving: 0, alert: 0 })
    const [showAddVehicle, setShowAddVehicle] = useState(false)
    const [newVehicle, setNewVehicle] = useState({ license_plate: '', driver_name: '' })
    const [selectedVehicle, setSelectedVehicle] = useState(null)

    // Fetch initial data
    const fetchInitialData = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const { data: vData } = await supabase.from('vehicles').select('*')
        const { data: rData } = await supabase.from('rides').select('*').eq('status', 'ongoing')
        const { data: hData } = await supabase.from('rides').select('*').eq('status', 'completed').order('completed_at', { ascending: false }).limit(20)

        // Fetch all rides from today
        const { data: dData } = await supabase.from('rides')
            .select('*')
            .gte('created_at', todayISO)
            .order('created_at', { ascending: false })

        if (vData) {
            const enriched = await Promise.all(vData.map(async (v) => {
                const { data: loc } = await supabase.from('locations')
                    .select('*')
                    .eq('vehicle_id', v.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                const activeRide = rData?.find(r => r.vehicle_id === v.id)

                return {
                    ...v,
                    lat: loc?.lat || 6.45,
                    lng: loc?.lng || 3.4,
                    speed: loc?.speed || 0,
                    activeRide: activeRide
                }
            }))
            setVehicles(enriched)
            setRides(rData || [])
            setHistory(hData || [])
            setDailyRides(dData || [])

            const revenue = (dData || []).reduce((acc, r) => acc + (r.price || 0), 0)
            updateStats(enriched, dData?.length || 0, revenue)
        }

        const { data: eData } = await supabase.from('events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
        if (eData) {
            setNotifications(eData.map(e => ({ id: e.id, msg: `${e.event_type}: ${e.vehicle_id}`, time: e.created_at })))
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchInitialData()

        const locSub = supabase.channel('locations-all').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations' }, payload => {
            setVehicles(current => {
                const next = current.map(v => v.id === payload.new.vehicle_id ? { ...v, lat: payload.new.lat, lng: payload.new.lng, speed: payload.new.speed } : v)
                updateStats(next)
                return next
            })
        }).subscribe()

        const rideSub = supabase.channel('rides-all').on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
            fetchInitialData()
        }).subscribe()

        return () => {
            supabase.removeChannel(locSub)
            supabase.removeChannel(rideSub)
        }
    }, [])

    const updateStats = (vList, dailyCount = 0, revenue = 0) => {
        setStats({
            online: vList.length,
            moving: vList.filter(v => v.activeRide).length,
            alert: vList.filter(v => v.status === 'sos').length,
            dailyItems: dailyCount,
            revenue: revenue,
            sync: 100
        })
    }

    const handleAddVehicle = async () => {
        if (!newVehicle.license_plate) return
        const { error } = await supabase.from('vehicles').insert({
            license_plate: newVehicle.license_plate.toUpperCase(),
            driver_name: newVehicle.driver_name,
            status: 'offline'
        })
        if (!error) {
            setShowAddVehicle(false)
            setNewVehicle({ license_plate: '', driver_name: '' })
            fetchInitialData()
        }
    }

    const [searchQuery, setSearchQuery] = useState('')

    const filteredVehicles = vehicles.filter(v =>
        v.license_plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.driver_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredRides = rides.filter(r =>
        r.items.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.dropoff_location.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalRevenue = [...rides, ...history].reduce((acc, r) => acc + (r.price || 0), 0)

    return (
        <div className="flex bg-[#020408] text-slate-200 min-h-screen selection:bg-blue-500/30 font-sans overflow-hidden">
            <aside className="w-[280px] bg-[#05070a] border-r border-white/5 flex flex-col fixed h-full z-20 shadow-2xl">
                <div className="p-8 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                        <Truck className="text-amber-500" size={24} />
                    </div>
                    <div>
                        <h1 className="title-font font-black text-xl tracking-tighter leading-none uppercase">Logistics<span className="text-amber-500">G</span></h1>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] mt-1 pr-1">Delivery_Overwatch</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    <NavItem icon={<MapIcon size={18} />} label="Live Map" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
                    <NavItem icon={<Package size={18} />} label="Active Rides" active={activeTab === 'rides'} onClick={() => setActiveTab('rides')} badge={rides.length > 0 ? rides.length.toString() : null} />
                    <NavItem icon={<Truck size={18} />} label="Drivers" active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} />
                    <NavItem icon={<AlertCircle size={18} />} label="Incidents" active={activeTab === 'incidents'} onClick={() => setActiveTab('incidents')} />
                </nav>

                <div className="p-6 border-t border-white/5 bg-black/40">
                    <button onClick={() => setShowAddVehicle(true)} className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-600/20">
                        <Plus size={16} /> Register Driver
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-[280px] p-10 overflow-y-auto custom-scrollbar h-screen relative">
                <header className="flex justify-between items-end mb-12">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.5em]">Logistics_Active // Command_Center</p>
                        </div>
                        <h2 className="title-font text-5xl font-black tracking-tighter text-white uppercase">Fleet Overwatch</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="glass px-6 py-4 rounded-3xl flex items-center gap-4 border-white/5 bg-[#0a0d14]/50">
                            <Search size={20} className="text-slate-600" />
                            <input
                                type="text"
                                placeholder="SEARCH DATA..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs w-full font-bold uppercase tracking-widest text-amber-400"
                            />
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                            <User size={28} className="text-amber-500" />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-4 gap-6 mb-10">
                    <StatCard icon={<Truck className="text-amber-500" />} label="Active Drivers" value={stats.online} trend="Nodes Ready" />
                    <StatCard icon={<Activity className="text-emerald-500" />} label="On-Ride" value={stats.moving} trend="Deliveries in progress" />
                    <StatCard icon={<Package className="text-blue-500" />} label="Today's Items" value={stats.dailyItems} trend="Logistics throughput" />
                    <StatCard icon={<DollarSign className="text-emerald-400" />} label="Today's Revenue" value={`$${stats.revenue}`} trend="Fleet Value Today" />
                </div>

                {activeTab === 'live' && (
                    <div className="h-[700px] glass rounded-[40px] relative overflow-hidden border-white/5 shadow-3xl">
                        <MapContainer center={[6.52, 3.37]} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                            {filteredVehicles.map((v) => (
                                <Marker key={v.id} position={[v.lat, v.lng]}>
                                    <Popup className="tactical-popup">
                                        <div className="bg-[#0a0d12] text-white p-4 rounded-xl border border-white/10 min-w-[240px]">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="font-black text-lg text-amber-400">{v.license_plate}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase">{v.driver_name}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${v.activeRide ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                                    {v.activeRide ? 'ON-RIDE' : 'IDLE'}
                                                </span>
                                            </div>
                                            {v.activeRide && (
                                                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                                    <div className="flex items-center gap-2"><Package size={12} className="text-amber-500" /><span className="text-xs font-bold">{v.activeRide.items}</span></div>
                                                    <div className="flex items-center gap-2"><Target size={12} className="text-amber-500" /><span className="text-xs text-slate-400">{v.activeRide.dropoff_location}</span></div>
                                                    <div className="mt-2 text-amber-500 font-bold text-sm">$ {v.activeRide.price}</div>
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                )}

                {activeTab === 'rides' && (
                    <div className="space-y-12">
                        <section>
                            <h3 className="text-xl font-black text-amber-500 uppercase tracking-widest mb-6 px-1">Active Deliveries</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRides.map(r => (
                                    <div key={r.id} className="glass p-8 rounded-[40px] border-white/5 relative group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                                                <Package className="text-amber-500" size={32} />
                                            </div>
                                            <div className="text-amber-500 font-black text-xl">$ {r.price}</div>
                                        </div>
                                        <h4 className="text-2xl font-black text-white">{r.items}</h4>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">Track ID: {r.id.split('-')[0]}</p>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-1 h-1 rounded-full bg-slate-600 mt-1.5" />
                                                <div><p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Pickup</p><p className="text-xs text-slate-300">{r.pickup_location}</p></div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="w-1 h-1 rounded-full bg-amber-500 mt-1.5" />
                                                <div><p className="text-[8px] text-amber-500 font-black uppercase tracking-widest">Drop-off</p><p className="text-xs text-slate-300">{r.dropoff_location}</p></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredRides.length === 0 && <div className="col-span-full py-10 text-center text-slate-600 uppercase font-black text-xs tracking-widest">No active deliveries match query</div>}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-black text-emerald-500 uppercase tracking-widest mb-6 px-1">Today's Total Summary</h3>
                            <div className="glass rounded-[32px] overflow-hidden border-white/5 mb-12">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Driver</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {dailyRides.length > 0 ? dailyRides.map(r => {
                                            const driver = vehicles.find(v => v.id === r.vehicle_id);
                                            return (
                                                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4"><p className="text-sm font-bold text-white">{r.items}</p><p className="text-[10px] text-slate-500 uppercase">{r.dropoff_location}</p></td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${r.status === 'ongoing' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                            {r.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4"><p className="text-xs text-slate-400">{driver?.driver_name || 'Unknown'}</p></td>
                                                    <td className="px-6 py-4"><p className="text-sm font-black text-emerald-400">${r.price}</p></td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-slate-600 uppercase font-black text-[10px] tracking-widest">No deliveries recorded today</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xl font-black text-slate-500 uppercase tracking-widest mb-6 px-1">Recent History</h3>
                            <div className="glass rounded-[32px] overflow-hidden border-white/5">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Item</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Destination</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Price</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {history.filter(h => h.items.toLowerCase().includes(searchQuery.toLowerCase())).map(h => (
                                            <tr key={h.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4"><p className="text-sm font-bold text-white">{h.items}</p></td>
                                                <td className="px-6 py-4"><p className="text-xs text-slate-400">{h.dropoff_location}</p></td>
                                                <td className="px-6 py-4"><p className="text-sm font-black text-amber-500">${h.price}</p></td>
                                                <td className="px-6 py-4"><p className="text-[10px] text-slate-500 uppercase">{new Date(h.completed_at).toLocaleDateString()}</p></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'drivers' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVehicles.map(v => (
                            <div key={v.id} className="glass p-8 rounded-[40px] border-white/5 relative group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                                        <User className="text-amber-500" size={32} />
                                    </div>
                                    <div className="text-emerald-500 font-black text-xs uppercase">SECURE</div>
                                </div>
                                <h4 className="text-2xl font-black text-white">{v.driver_name || 'System Operator'}</h4>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6">Plate: {v.license_plate}</p>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-[10px] text-slate-500 font-black uppercase">Status</span>
                                        <span className={`text-[10px] font-black uppercase ${v.activeRide ? 'text-emerald-500' : 'text-slate-500'}`}>{v.activeRide ? 'ON-RIDE' : 'IDLE'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-[10px] text-slate-500 font-black uppercase">Recent Activity</span>
                                        <span className="text-[10px] text-slate-300 font-black uppercase">{new Date(v.last_seen || Date.now()).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <AnimatePresence>
                {showAddVehicle && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="glass w-full max-w-md p-10 rounded-[40px] border-white/10 relative">
                            <button onClick={() => setShowAddVehicle(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24} /></button>
                            <h3 className="text-3xl font-black title-font mb-8 uppercase px-2">Register Driver</h3>
                            <div className="space-y-6">
                                <input value={newVehicle.license_plate} onChange={e => setNewVehicle({ ...newVehicle, license_plate: e.target.value })} type="text" placeholder="PLATE NUMBER" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono outline-none" />
                                <input value={newVehicle.driver_name} onChange={e => setNewVehicle({ ...newVehicle, driver_name: e.target.value })} type="text" placeholder="DRIVER NAME" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none" />
                                <button onClick={handleAddVehicle} className="w-full py-5 bg-amber-600 text-white font-black rounded-2xl shadow-2xl shadow-amber-600/20 uppercase tracking-widest text-xs mt-4">Confirm Registration</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    )
}

function NavItem({ icon, label, active, onClick, badge }) {
    return (
        <div onClick={onClick} className={`flex items-center justify-between px-6 py-4 rounded-3xl cursor-pointer transition-all duration-300 group relative ${active ? 'bg-amber-600 text-white shadow-2xl shadow-amber-600/30' : 'text-slate-600 hover:bg-white/5 hover:text-slate-200'}`}>
            <div className="flex items-center gap-4">
                <span className={active ? 'text-white' : 'group-hover:text-amber-400'}>{icon}</span>
                <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {badge && <span className="bg-amber-500 text-black text-[9px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 shadow-lg animate-pulse">{badge}</span>}
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
            <p className={`text-[9px] font-black uppercase mt-4 ${alert ? 'text-rose-400' : 'text-amber-500'}`}>{trend}</p>
        </div>
    )
}

export default App
