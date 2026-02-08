import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Truck, Monitor, Cpu } from 'lucide-react'
import { motion } from 'framer-motion'

function Home() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-[#020408] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center z-10 mb-16"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-white/5 rounded-3xl border border-white/10 shadow-2xl">
                        <Shield className="text-blue-500" size={64} />
                    </div>
                </div>
                <h1 className="text-6xl font-black tracking-tighter title-font mb-4">
                    FLEET<span className="text-blue-500">GUARDIAN</span>
                </h1>
                <p className="text-slate-500 uppercase tracking-[0.4em] text-xs font-black">Tactical Asset Management & Real-time Telemetry</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl z-10">
                <RoleCard
                    icon={<Monitor className="text-blue-500" size={32} />}
                    title="Command Dashboard"
                    description="Tactical overview, fleet mapping, and remote asset control center."
                    color="blue"
                    onClick={() => navigate('/dashboard')}
                />
                <RoleCard
                    icon={<Truck className="text-emerald-500" size={32} />}
                    title="Terminal Device"
                    description="Vehicle-mounted interface for real-time telemetry and optical uplink."
                    color="emerald"
                    onClick={() => navigate('/device')}
                />
            </div>

            <div className="mt-20 text-[10px] text-slate-700 font-mono tracking-widest uppercase flex items-center gap-4">
                <span>Unified_Node_v2.0</span>
                <div className="w-1 h-1 bg-slate-800 rounded-full" />
                <span>Secure_Uplink_Active</span>
            </div>
        </div>
    )
}

function RoleCard({ icon, title, description, color, onClick }) {
    const colorMap = {
        blue: 'border-blue-500/20 hover:border-blue-500/50 bg-blue-500/[0.02]',
        emerald: 'border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-500/[0.02]'
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`glass p-10 rounded-[40px] border text-left flex flex-col gap-6 transition-all group ${colorMap[color]}`}
        >
            <div className={`p-4 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <h3 className="text-2xl font-black title-font mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                Enter Terminal <div className="w-12 h-px bg-current opacity-20" />
            </div>
        </motion.button>
    )
}

export default Home
