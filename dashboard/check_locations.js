
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve('c:/Users/Nigeram Ventures/Desktop/FLEETGUARDIAN/dashboard/.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envConfig = {}
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
        envConfig[key.trim()] = value.trim()
    }
})

const supabaseUrl = envConfig.VITE_SUPABASE_URL
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLocations() {
    const { data: vehicles } = await supabase.from('vehicles').select('*')

    if (!vehicles) return

    console.log('Vehicles found:', vehicles.length)

    for (const v of vehicles) {
        const { data: loc } = await supabase.from('locations')
            .select('lat, lng, created_at')
            .eq('vehicle_id', v.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        console.log(`Vehicle: ${v.plate_number} (${v.id})`)
        if (loc) {
            console.log(`  Location: [${loc.lat}, ${loc.lng}] @ ${loc.created_at}`)
        } else {
            console.log(`  Location: Not found`)
        }
    }
}

checkLocations()
