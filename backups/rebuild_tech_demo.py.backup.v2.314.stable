import re

# "Cascading Socket v15.3" (Glass Aesthetic Update)
# 1. Monotone Buttons (No color backgrounds).
# 2. Gradient Ring Border (Highligts Top-Left and Bottom-Right).
# 3. Monochrome Icons (White/Slate).

def generate_card_html(card, index):
    c_color = card.get('color', 'blue')
    c_500 = card.get('c500', 'bg-blue-500')
    uid = f"card-{index}"
    
    rows_html = ""
    for r in card['rows']:
        label, val, width, color = r
        rows_html += f"""
                        <div class="text-slate-400 flex items-center">{label}</div>
                        <div class="text-white text-right font-mono">{val}</div>
                        <div class="flex items-center"><div class="h-1 w-full bg-slate-800 rounded-full overflow-hidden"><div class="h-full bg-{color.split('-')[0]}-{color.split('-')[1]} w-[{width}%]"></div></div></div>"""
    
    stroke_style = "stroke: rgba(255,255,255,0.2); stroke-width: 1px;"
    
    # SVG processing: Remove original text-{color}-400 and replace with text-white/90
    icon_svg = card['svg']
    icon_svg = re.sub(r'text-[a-z]+-\d+', 'text-white/90', icon_svg)

    return f"""                <!-- Card: {card['title']} -->
                <div class="relative group h-full socket-card-container"> 
                    
                    <!-- SVG SHELL v15.2 (Single Path via JS) -->
                    <svg class="absolute inset-0 w-full h-full z-0 pointer-events-none text-slate-300" overflow="visible">
                        <defs>
                            <linearGradient id="grad-{uid}" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="rgba(255,255,255,0.1)" />
                                <stop offset="50%" stop-color="rgba(255,255,255,0.05)" />
                                <stop offset="100%" stop-color="transparent" />
                            </linearGradient>
                        </defs>
                        
                        <!-- The Single Path -->
                        <path class="socket-path" 
                              fill="url(#grad-{uid})" 
                              style="{stroke_style}; transition: none !important;" 
                              vector-effect="non-scaling-stroke"
                              stroke-linecap="round" 
                              stroke-linejoin="round" />
                    </svg>
                    
                    <!-- Backdrop Blur (Polygon Clip) -->
                    <div class="absolute inset-0 z-[-1] backdrop-blur-md rounded-[2rem]"
                         style="clip-path: polygon(
                             0 0, 
                             calc(100% - 96px) 0,
                             100% 96px,
                             100% 100%, 
                             0 100%
                         );">
                    </div>

                    <!-- Button (Glass Monotone) v15.5 Rendering Fix -->
                    <!-- Changes: Thicker stroke (1.5px) for stability, Geometric Precision, TranslateZ for isolated compositing -->
                    <div class="absolute top-0 right-0 w-14 h-14 z-20 group-hover:scale-110 transition-transform duration-300 ease-out flex items-center justify-center">
                        
                        <!-- Layer 1: Glass Background -->
                        <!-- mask-image forces the blur to respect the radius perfectly on all engines -->
                        <div class="absolute inset-0 rounded-full bg-white/10 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden"
                             style="-webkit-mask-image: -webkit-radial-gradient(white, black); transform: translateZ(0);"></div>
                        
                        <!-- Layer 2: Vector Border (SVG) -->
                        <!-- Stroke increased to 1.5px for better anti-aliasing channel utilization -->
                        <svg class="absolute inset-0 w-full h-full rounded-full pointer-events-none" viewBox="0 0 56 56" shape-rendering="geometricPrecision">
                            <defs>
                                <linearGradient id="glass-border-grad-{index}" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="rgba(255,255,255,0.7)" />
                                    <stop offset="35%" stop-color="rgba(255,255,255,0.1)" />
                                    <stop offset="65%" stop-color="rgba(255,255,255,0.1)" />
                                    <stop offset="100%" stop-color="rgba(255,255,255,0.7)" />
                                </linearGradient>
                            </defs>
                            <!-- r=27.25 to account for 1.5px stroke width (1.5/2 = 0.75 inset) -->
                            <circle cx="28" cy="28" r="27.25" stroke="url(#glass-border-grad-{index})" stroke-width="1.5" fill="none" class="opacity-100" />
                        </svg>

                        <!-- Layer 3: Icon -->
                        <!-- Promoted to distinct layer to preventing scaling jitter -->
                        <div class="relative z-30" style="transform: translateZ(1px);">
                             {icon_svg}
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="relative h-full p-4 lg:p-8 flex flex-col z-10 pointer-events-none">
                        <div class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-16">
                            <h3 class="text-sm font-normal text-white tracking-wide">{card['title']}</h3>
                            <p class="text-xs text-slate-500 mt-0.5">{card['subtitle']}</p>
                        </div>
                        <div class="grid grid-cols-3 gap-y-3 gap-x-4 text-[10px] w-full">
                            <div class="text-slate-600 uppercase tracking-wider text-[8px] col-span-1">Metric</div>
                            <div class="text-slate-600 uppercase tracking-wider text-[8px] col-span-2 text-right">Data</div>
                            {rows_html}
                        </div>
                    </div>
                </div>"""

# Data
cards_data = [
    {
        'title': 'Front Door Agent', 
        'subtitle': 'Reception & Routing', 
        'color': 'blue', 
        'c500': 'bg-blue-500', 
        'svg': '<svg class="w-6 h-6 text-white/90" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path fill="currentColor" d="M26 22a3.86 3.86 0 0 0-2 .57l-3.09-3.1a6 6 0 0 0 0-6.94L24 9.43a3.86 3.86 0 0 0 2 .57a4 4 0 1 0-4-4a3.86 3.86 0 0 0 .57 2l-3.1 3.09a6 6 0 0 0-6.94 0L9.43 8A3.86 3.86 0 0 0 10 6a4 4 0 1 0-4 4a3.86 3.86 0 0 0 2-.57l3.09 3.1a6 6 0 0 0 0 6.94L8 22.57A3.86 3.86 0 0 0 6 22a4 4 0 1 0 4 4a3.86 3.86 0 0 0-.57-2l3.1-3.09a6 6 0 0 0 6.94 0l3.1 3.09a3.86 3.86 0 0 0-.57 2a4 4 0 1 0 4-4Zm0-18a2 2 0 1 1-2 2a2 2 0 0 1 2-2ZM4 6a2 2 0 1 1 2 2a2 2 0 0 1-2-2Zm2 22a2 2 0 1 1 2-2a2 2 0 0 1-2 2Zm10-8a4 4 0 1 1 4-4a4 4 0 0 1-4 4Zm10 8a2 2 0 1 1 2-2a2 2 0 0 1-2 2Z"></path></svg>',
        'rows': [ ('Visitors', '1,428', '85', 'blue-500'), ('Active', '342', '60', 'blue-400'), ('Bounce', '12%', '12', 'red-400'), ('Routed', '89%', '89', 'emerald-500'), ('Avg Time', '4.2s', '40', 'blue-300'), ('Auth', '99.9%', '99', 'indigo-400') ]
    },
    {
        'title': 'Demo Guide', 
        'subtitle': 'Feature Walkthroughs', 
        'color': 'emerald', 
        'c500': 'bg-emerald-500', 
        'svg': '<svg class="w-6 h-6 text-white/90" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path fill="currentColor" d="M19 27H5V13h4v-2H5c-1.1 0-2 .9-2 2v6H0v2h3v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4h-2v4z"></path><path fill="currentColor" d="M11 19h10v2H11zm0-4h10v2H11zm0-4h10v2H11z"></path><path fill="currentColor" d="M29 11V5c0-1.1-.9-2-2-2H13c-1.1 0-2 .9-2 2v4h2V5h14v14h-4v2h4c1.1 0 2-.9 2-2v-6h3v-2h-3z"></path></svg>',
        'rows': [ ('Sessions', '892', '75', 'emerald-500'), ('Completion', '76%', '76', 'emerald-400'), ('Drop-off', '8%', '8', 'red-400'), ('Click-thru', '45%', '45', 'cyan-400'), ('Avg Dur', '5m 20s', '55', 'teal-400'), ('Rating', '4.8/5', '96', 'yellow-400') ]
    },
    {
        'title': 'Onboarding Coach', 
        'subtitle': 'Setup Assistance', 
        'color': 'purple', 
        'c500': 'bg-purple-500', 
        'svg': '<svg class="w-6 h-6 text-white/90" viewBox="0 0 76.12 75.56" fill="currentColor"><path d="M25.23,12.62C25.23,5.66,19.57,0,12.62,0S0,5.66,0,12.62s5.66,12.62,12.62,12.62,12.62-5.66,12.62-12.62Zm-20.73,0c0-4.48,3.64-8.12,8.12-8.12s8.12,3.64,8.12,8.12-3.64,8.12-8.12,8.12-8.12-3.64-8.12-8.12Zm10.37,31.02v16.43c0,2.54,2.07,4.6,4.6,4.6h19.67c1.24,0,2.25,1.01,2.25,2.25s-1.01,2.25-2.25,2.25H19.47c-5.02,0-9.1-4.08-9.1-9.1v-27.75c0-1.24,1.01-2.25,2.25-2.25s2.25,1.01,2.25,2.25v3.51c0,2.54,2.07,4.6,4.6,4.6h19.67c1.24,0,2.25,1.01,2.25,2.25s-1.01,2.25-2.25,2.25H19.47c-1.69,0-3.25-.49-4.6-1.29Zm38,7.68h14.62c4.76,0,8.64-3.87,8.64-8.64s-3.87-8.63-8.64-8.63h-14.62c-4.76,0-8.64,3.87-8.64,8.63s3.87,8.64,8.64,8.64Zm0-12.77h14.62c2.28,0,4.14,1.85,4.14,4.13s-1.85,4.14-4.14,4.14h-14.62c-2.28,0-4.14-1.85-4.14-4.14s1.85-4.13,4.14-4.13Zm14.62,19.74h-14.62c-4.76,0-8.64,3.87-8.64,8.63s3.87,8.64,8.64,8.64h14.62c4.76,0,8.64-3.87,8.64-8.64s-3.87-8.63-8.64-8.63Zm0,12.77h-14.62c-2.28,0-4.14-1.85-4.14-4.14s1.85-4.13,4.14-4.13h14.62c2.28,0,4.14,1.85,4.14,4.13s-1.85,4.14-4.14,4.14Z"/></svg>',
        'rows': [ ('New Users', '156', '45', 'purple-500'), ('Profiles', '92%', '92', 'purple-400'), ('Guides', '3.5', '35', 'indigo-400'), ('Verified', '100%', '100', 'green-400'), ('Stuck', '2.1%', '2', 'red-400'), ('Success', '98%', '98', 'pink-300') ]
    },
    {
        'title': 'Technical Specialist', 
        'subtitle': 'Deep Support', 
        'color': 'amber', 
        'c500': 'bg-amber-500', 
        'svg': '<svg class="w-6 h-6 text-white/90" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path fill="currentColor" d="M11 11v10h10V11Zm8 8h-6v-6h6Z"></path><path fill="currentColor" d="M30 13v-2h-4V8a2 2 0 0 0-2-2h-3V2h-2v4h-6V2h-2v4H8a2 2 0 0 0-2 2v3H2v2h4v6H2v2h4v3a2 2 0 0 0 2 2h3v4h2v-4h6v4h2v-4h3a2 2 0 0 0 2-2v-3h4v-2h-4v-6Zm-6 11H8V8h16Z"></path></svg>',
        'rows': [ ('Tickets', '42', '20', 'amber-500'), ('Resolved', '38', '90', 'yellow-400'), ('AI Res', '85%', '85', 'yellow-300'), ('Escalated', '3', '3', 'red-400'), ('Avg TTR', '2.4m', '10', 'red-400'), ('CSAT', '4.9', '98', 'green-500') ]
    }, 
    {
        'title': 'Sales Advisor', 
        'subtitle': 'Revenue & Plans', 
        'color': 'rose', 
        'c500': 'bg-rose-500', 
        'svg': '<svg class="w-6 h-6 text-white/90" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><circle cx="14" cy="14" r="2" fill="currentColor"></circle><path fill="currentColor" d="M20 30a.997.997 0 0 1-.707-.293L8.586 19A2.013 2.013 0 0 1 8 17.586V10a2.002 2.002 0 0 1 2-2h7.586A1.986 1.986 0 0 1 19 8.586l10.707 10.707a1 1 0 0 1 0 1.414l-9 9A.997.997 0 0 1 20 30ZM10 10v7.586l10 10L27.586 20l-10-10Z"></path><path fill="currentColor" d="M12 30H4a2.002 2.002 0 0 1-2-2V4a2.002 2.002 0 0 1 2-2h24a2.002 2.002 0 0 1 2 2v8h-2V4H4v24h8Z"></path></svg>',
        'rows': [ ('Leads', '89', '50', 'rose-500'), ('Qualified', '45', '55', 'rose-400'), ('Conv Rate', '18%', '20', 'rose-300'), ('Pipeline', '$450k', '80', 'green-400'), ('Queries', '312', '75', 'rose-200'), ('Upsells', '12', '30', 'amber-500') ]
    },
    {
        'title': 'Booking Agent', 
        'subtitle': 'Scheduling', 
        'color': 'cyan', 
        'c500': 'bg-cyan-500', 
        'svg': '<svg class="w-6 h-6 text-white/90" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 32"><path fill="currentColor" d="m20.413 14.584l-7.997-7.997a2.002 2.002 0 0 0-2.832 0l-7.997 7.997a2.002 2.002 0 0 0 0 2.832l3.291 3.292L3 22.585L4.414 24l1.879-1.878l3.291 3.291a2.002 2.002 0 0 0 2.832 0l2.256-2.256l-1.416-1.415l-2.258 2.257l-7.997-7.997l7.997-8.001l8.001 8.001L17.5 17.5l1.415 1.415l1.498-1.499a2.002 2.002 0 0 0 0-2.832Z"></path><path fill="currentColor" d="m30.413 14.584l-3.291-3.292L29 9.415L27.586 8l-1.878 1.878l-3.292-3.291a2.002 2.002 0 0 0-2.832 0l-2.256 2.256l1.415 1.414l2.255-2.256l8.001 8.001l-8.001 7.997l-7.997-7.997l1.5-1.501l-1.416-1.416l-1.498 1.499a2.002 2.002 0 0 0 0 2.832l7.997 7.997a2.002 2.002 0 0 0 2.832 0l7.997-7.997a2.002 2.002 0 0 0 0-2.832Z"></path></svg>',
        'rows': [ ('Requests', '215', '65', 'cyan-500'), ('Booked', '142', '70', 'cyan-400'), ('Resched', '18', '15', 'amber-400'), ('No-show', '4%', '4', 'red-400'), ('Utilization', '82%', '82', 'teal-400'), ('Sync', '0.2s', '95', 'cyan-200') ]
    }
]

# JS Script for Path Generation
# This script finds all .socket-path elements, measures their container, 
# and sets the d string.
# Updated to use ResizeObserver and NO transitions.
js_script = """
<script>
    (function() {
        // v15.2 Socket Logic (Resize Safe)
        const updateSocketPath = (container) => {
            const svg = container.querySelector('svg');
            const path = container.querySelector('.socket-path');
            if (!svg || !path) return;
            
            const w = container.clientWidth;
            const h = container.clientHeight;
            
            // If measurements are 0 (e.g. detached), skip
            if (w === 0 || h === 0) return;

            const S = 0.5;
            // Bezier delta constants
            // Note: Middle curve inverted (V->H)
            const c_cp1_x = 33.11 * S; const c_cp1_y = 0 * S;
            const c_cp2_x = 59.94 * S; const c_cp2_y = 26.84 * S;
            const c_end_x = 59.94 * S; const c_end_y = 59.94 * S;
            const l_short = 10.9 * S; 
            
            // Corner Radius (for standard corners)
            const r = 32; // 2rem
            
            // Construct d string (Clockwise)
            // Start Top-Left (actually after top-left corner)
            let d = `M ${r} 0`;
            
            const socketW = 95.36;
            
            // Line to start of socket
            d += ` L ${w - socketW} 0`;
            
            // 1. Curve Down/Right (First Step - Top) - H->V Convex
            d += ` c ${c_cp1_x} ${c_cp1_y}, ${c_cp2_x} ${c_cp2_y}, ${c_end_x} ${c_end_y}`;
            
            // 2. Line Down (Vertical)
            d += ` l 0 ${l_short}`;
            
            // 3. Curve Down/Right (Middle Step) - V->H Concave/Inverted
            // INVERTED: Swap X and Y coordinates relative to step start
            d += ` c ${c_cp1_y} ${c_cp1_x}, ${c_cp2_y} ${c_cp2_x}, ${c_end_y} ${c_end_x}`;
            
            // 4. Line Right (Horizontal)
            d += ` l ${l_short} 0`;
            
            // 5. Curve Down/Right (Bottom Step) - H->V Convex
            d += ` c ${c_cp1_x} ${c_cp1_y}, ${c_cp2_x} ${c_cp2_y}, ${c_end_x} ${c_end_y}`;
            
            // Now we are at (w, socketH).
            // Line Down to Bottom-Right Corner start
            d += ` L ${w} ${h - r}`;
            
            // Bottom-Right Corner
            d += ` a ${r} ${r} 0 0 1 -${r} ${r}`; // Sweep 1 for clockwise
            
            // Bottom Edge
            d += ` L ${r} ${h}`;
            
            // Bottom-Left Corner
            d += ` a ${r} ${r} 0 0 1 -${r} -${r}`;
            
            // Left Edge
            d += ` L 0 ${r}`;
            
            // Top-Left Corner
            d += ` a ${r} ${r} 0 0 1 ${r} -${r}`;
            
            d += ' Z';
            
            path.setAttribute('d', d);
        };

        // ResizeObserver implementation
        const ro = new ResizeObserver(entries => {
            for (let entry of entries) {
                // entry.target is the container
                updateSocketPath(entry.target);
            }
        });
        
        // Init Loop
        const containers = document.querySelectorAll('.socket-card-container');
        containers.forEach(c => {
            updateSocketPath(c);
            ro.observe(c);
        });

    })();
</script>
"""

# Script Execution
grid_content = ""
for idx, c in enumerate(cards_data):
    grid_content += generate_card_html(c, idx) + "\n"

# Read File
file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    full_text = f.read()

# Replace Grid
start_m = '<!-- Card: Front Door Agent -->' 
if start_m not in full_text: start_m = '<!-- Card 1: Front Door Agent -->'

end_m = '<!-- Init Script -->'

start_idx = full_text.find(start_m)
end_idx = full_text.find(end_m)

if start_idx == -1 or end_idx == -1:
    raise Exception(f"Markers not found: {start_idx}, {end_idx}")

inner_block = full_text[start_idx:end_idx]
cutoff = len(inner_block)
for _ in range(3):
    pos = inner_block.rfind('</div>', 0, cutoff)
    if pos == -1: raise Exception("Could not find closing divs")
    cutoff = pos

new_inner = grid_content + "\n            " + inner_block[cutoff:]
# Append JS
new_inner += js_script

new_full = full_text[:start_idx] + new_inner + full_text[end_idx:]

with open(file_path, 'w') as f:
    f.write(new_full)

print("Applied 'Glass Aesthetic v15.3' (Monotone + Gradient Borders).")
