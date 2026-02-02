
import re

# Read file
file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# Path calculated by script
socket_path_d = "M -300 0 L -77.25 0 A 16.0 16.0 0 0 1 -62.17 21.33 A 32.0 32.0 0 0 0 -21.33 62.17 A 16.0 16.0 0 0 1 0 77.25 L 0 300"
# For the mask, we need to CLOSE the shape to form the CARD BODY.
# The path above traces the Top-Right edge (Top -> Notch -> Right).
# To fill the card (keep the body visible), we need to go:
# Start (-300, 0) -> Path -> (0, 300) -> (0, 1000) -> (-1000, 1000) -> (-1000, 0) -> Start.
# Note: The coordinates are relative to Top-Right (0,0). Left is negative X. Down is positive Y.
# So Card Body is mostly in X < 0, Y > 0.
# Left Bottom is (-W, H).
mask_path_d = socket_path_d + " L 0 1000 L -1000 1000 L -1000 0 Z"

svg_defs = f"""
<!-- Injected SVG Definitions for Tangent Socket v2.287 -->
<div style="height: 0; width: 0; position: absolute; visibility: hidden;">
    <svg width="0" height="0">
        <defs>
            <symbol id="socket-geometry-v3" viewBox="0 0 100 100" overflow="visible">
                <path d="{socket_path_d}" 
                      fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" />
            </symbol>
            
            <mask id="liquid-socket-mask-v3">
                <!-- White = Visible. We draw the Card Body in White. -->
                <path d="{mask_path_d}" fill="white" />
            </mask>
        </defs>
    </svg>
</div>
"""

# Replace old defs or insert new
if '<!-- Injected SVG Definitions for Liquid Socket -->' in content:
    # Remove old block roughly or just replace
    # It's safer to just inject the new one and use new IDs.
    pass

# We will inject after body start
content = content.replace('<body class="bg-slate-950 font-sans text-slate-300 antialiased selection:bg-blue-500/30">', 
                          '<body class="bg-slate-950 font-sans text-slate-300 antialiased selection:bg-blue-500/30">\n' + svg_defs)

def get_tangent_card_html(title, subtitle, color_name, color_500, color_400, icon_svg):
    return f"""{title}
                <!-- v2.287: Applied "Tangent Socket" aesthetic -->
                <div class="relative group h-full"> 
                    
                    <!-- 1. Background Layer (Masked) -->
                    <div class="absolute inset-0 z-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md rounded-[2rem]"
                         style="mask: url(#liquid-socket-mask-v3); -webkit-mask: url(#liquid-socket-mask-v3);">
                    </div>

                    <!-- 2. Border Overlay (SVG) -->
                    <svg class="absolute inset-0 w-full h-full pointer-events-none z-10 text-white/20">
                         <!-- Use the symbol for top-right -->
                         <use href="#socket-geometry-v3" x="100%" y="0" class="text-white/20" />
                    </svg>
                    <!-- Backing Div for Standard Borders (Left, Bottom) -->
                    <div class="absolute inset-0 z-10 rounded-[2rem] border-l border-b border-t-0 border-r-0 border-white/20 pointer-events-none"></div>
                    <!-- Top Border Segment (Left of socket start: -77.25px = -4.8rem approx) -->
                    <!-- Inset right-20 (5rem) covers it? -->
                    <div class="absolute top-0 left-0 right-[5rem] h-[1px] bg-white/20 z-10"></div> 
                    <!-- Right Border Segment (Below socket end: 77.25px = 4.8rem) -->
                    <div class="absolute bottom-0 right-0 top-[5rem] w-[1px] bg-white/20 z-10"></div>


                    <!-- 3. Floating Button (Nested in the socket) -->
                    <div class="absolute top-2 right-2 w-12 h-12 rounded-full {color_500}/10 border border-{color_name}-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.2)] z-20 group-hover:scale-105 transition-transform duration-300 backdrop-blur-md">
                        {icon_svg}
                    </div>

                    <!-- 4. Card Content -->
                    <div class="relative h-full p-4 lg:p-8 flex flex-col z-10">
                        
                        <!-- Header -->
                        <div class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-16">
                            <h3 class="text-sm font-normal text-white tracking-wide">{title.replace('<!-- ', '').replace(' -->', '').replace('Card ', '').split(': ')[1]}</h3>
                            <p class="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                        </div>
                        <div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">"""

cards_data = [
    {'marker': '<!-- Card 1: Front Door Agent -->', 'subtitle': 'Reception & Routing', 'color': 'blue', 'c500': 'bg-blue-500', 'c400': 'text-blue-400', 'svg': '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>'},
    {'marker': '<!-- Card 2: Demo Guide -->', 'subtitle': 'Feature Walkthroughs', 'color': 'emerald', 'c500': 'bg-emerald-500', 'c400': 'text-emerald-400', 'svg': '<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'},
    {'marker': '<!-- Card 3: Onboarding Coach -->', 'subtitle': 'Setup Assistance', 'color': 'purple', 'c500': 'bg-purple-500', 'c400': 'text-purple-400', 'svg': '<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'},
    {'marker': '<!-- Card 4: Technical Specialist -->', 'subtitle': 'Deep Support', 'color': 'amber', 'c500': 'bg-amber-500', 'c400': 'text-amber-400', 'svg': '<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>'},
    {'marker': '<!-- Card 5: Sales Advisor -->', 'subtitle': 'Revenue & Plans', 'color': 'rose', 'c500': 'bg-rose-500', 'c400': 'text-rose-400', 'svg': '<svg class="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>'},
    {'marker': '<!-- Card 6: Booking Agent -->', 'subtitle': 'Scheduling', 'color': 'cyan', 'c500': 'bg-cyan-500', 'c400': 'text-cyan-400', 'svg': '<svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>'}
]


replacements = {}
for i, card in enumerate(cards_data):
    replacements[i] = get_tangent_card_html(card['marker'], card['subtitle'], card['color'], card['c500'], card['c400'], card['svg'])

output_buffer = ""
last_idx = 0

for i, card_data in enumerate(cards_data):
    marker = card_data['marker']
    curr_start = content.find(marker)
    if curr_start == -1: raise Exception(f"Marker not found: {marker}")
    
    output_buffer += content[last_idx:curr_start]
    new_header = replacements[i]
    
    grid_tag = '<div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">'
    grid_start = content.find(grid_tag, curr_start)
    if grid_start == -1: raise Exception("Grid start not found")
    
    output_buffer += new_header
    
    content_start = grid_start + len(grid_tag)
    
    # We must properly close the divs created in new_header
    # new_header closes with <grid> opening.
    # The Grid content from file should be preserved.
    # The file content currently (v2.286) has:
    # </div> </div> </div> (3 closes)
    
    # Let's grab the Grid Items.
    # From `content_start` to `                    </div>`.
    
    ending_seq = '                    </div>\n                </div>'
    boundary_idx = content.find(ending_seq, content_start)
    if boundary_idx == -1:
         boundary_idx = content.find('</div>\n                </div>', content_start)
    
    card_body = content[content_start:boundary_idx]
    
    output_buffer += card_body
    
    output_buffer += '</div>\n                    </div>\n                </div>'
    
    # Correct `last_idx` to skip the old footer
    # Find next marker or end.
    if i < len(cards_data) - 1:
        next_marker = content.find(cards_data[i+1]['marker'])
        last_idx = next_marker
    else:
        # For the last card, we need to skip 3 closing divs.
        last_idx = boundary_idx + len(ending_seq)
        
        # Checking if there's a 3rd div in the file we need to eat.
        # v2.286 had 3 closing divs?
        # My extractor logic in Apply v2.286 added: `</div>\n </div>\n </div>`
        # So yes.
        pass

output_buffer += content[last_idx:]

with open(file_path, 'w') as f:
    f.write(output_buffer)

print("Applied Tangent Socket Design v2.287.")
