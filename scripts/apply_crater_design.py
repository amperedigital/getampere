
import re

# Read file
file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# Define the markers
card_markers = [
    '<!-- Card 1: Front Door Agent -->',
    '<!-- Card 2: Demo Guide -->',
    '<!-- Card 3: Onboarding Coach -->',
    '<!-- Card 4: Technical Specialist -->',
    '<!-- Card 5: Sales Advisor -->',
    '<!-- Card 6: Booking Agent -->',
]

def get_socket_html(title, subtitle, color_name, color_500, color_400, icon_svg):
    # Geometry Constants
    # Button: 3rem (w-12)
    # Button Inset: 0.5rem (top-2 right-2)
    # Button Center: 2rem from top/right (1.5 radius + 0.5 inset)
    # Gap: 0.6rem
    # Hole Calcium: 1.5 (btn rad) + 0.6 (gap) = 2.1rem.
    
    # CSS Mask
    # We use Calc for position: (100% - 2rem) 2rem
    mask_style = "mask-image: radial-gradient(circle at calc(100% - 2rem) 2rem, transparent 2.1rem, black 2.15rem); -webkit-mask-image: radial-gradient(circle at calc(100% - 2rem) 2rem, transparent 2.1rem, black 2.15rem);"
    
    return f"""{title}
                <!-- v2.285: Applied "Crater Socket" aesthetic -->
                <div class="relative group h-full"> 
                    <!-- 1. The Floating Action Button (Nest in the crater) -->
                    <div class="absolute top-2 right-2 w-12 h-12 rounded-full {color_500}/10 border border-{color_name}-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.2)] z-20 group-hover:scale-105 transition-transform duration-300 backdrop-blur-md">
                        {icon_svg}
                    </div>
                    
                    <!-- 2. The Border Ring (Defines the crater edge) -->
                    <!-- Sized 5x5 rem to capture the 2.1rem radius fully -->
                    <svg class="absolute top-0 right-0 w-[5rem] h-[5rem] pointer-events-none z-10 text-white/10" viewBox="0 0 80 80">
                         <!-- Center (2rem, 2rem) = (32px, 32px) -->
                         <!-- Radius 2.1rem = 33.6px -->
                         <circle cx="32" cy="32" r="33.6" fill="none" stroke="currentColor" stroke-width="1.2" />
                    </svg>

                    <!-- 3. The Card Body (Masked) -->
                    <div class="h-full border border-white/10 p-4 lg:p-8 rounded-[2rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md flex flex-col overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:from-white/15 hover:to-white/5 transition-all duration-500"
                         style="{mask_style}">
                        
                        <!-- Header with spacer for the hole -->
                        <!-- The hole is top-right. We need to insure title doesn't hit it. -->
                        <div class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-16">
                            <h3 class="text-sm font-normal text-white tracking-wide">{title.replace('<!-- ', '').replace(' -->', '').replace('Card ', '').split(': ')[1]}</h3>
                            <p class="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                        </div>
                        <div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">"""

# Define content for each card
cards_data = [
    {
        'marker': '<!-- Card 1: Front Door Agent -->',
        'subtitle': 'Reception & Routing',
        'color': 'blue',
        'c500': 'bg-blue-500',
        'c400': 'text-blue-400',
        'svg': '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>'
    },
    {
        'marker': '<!-- Card 2: Demo Guide -->',
        'subtitle': 'Feature Walkthroughs',
        'color': 'emerald',
        'c500': 'bg-emerald-500',
        'c400': 'text-emerald-400',
        'svg': '<svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    },
    {
        'marker': '<!-- Card 3: Onboarding Coach -->',
        'subtitle': 'Setup Assistance',
        'color': 'purple',
        'c500': 'bg-purple-500',
        'c400': 'text-purple-400',
        'svg': '<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    },
    {
        'marker': '<!-- Card 4: Technical Specialist -->',
        'subtitle': 'Deep Support',
        'color': 'amber',
        'c500': 'bg-amber-500',
        'c400': 'text-amber-400',
        'svg': '<svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>'
    },
    {
        'marker': '<!-- Card 5: Sales Advisor -->',
        'subtitle': 'Revenue & Plans',
        'color': 'rose',
        'c500': 'bg-rose-500',
        'c400': 'text-rose-400',
        'svg': '<svg class="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>'
    },
    {
        'marker': '<!-- Card 6: Booking Agent -->',
        'subtitle': 'Scheduling',
        'color': 'cyan',
        'c500': 'bg-cyan-500',
        'c400': 'text-cyan-400',
        'svg': '<svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>'
    }
]

# Generate Replacements
replacements = {}
for i, card in enumerate(cards_data):
    replacements[i] = get_socket_html(
        card['marker'], 
        card['subtitle'], 
        card['color'], 
        card['c500'], 
        card['c400'], 
        card['svg']
    )

output_buffer = ""
last_idx = 0

# Check structure of current file
# v2.284 has `mask-image: radial-gradient` and button `absolute top-0 right-0`.
# We want to replace it.
# The `grid_tag` is constant.

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
    block_end = -1
    
    if i < len(cards_data) - 1:
        next_marker_start = content.find(cards_data[i+1]['marker'])
        block_end = next_marker_start
    else:
        # Last card
        boundary_seq = '                    </div>\n                </div>'
        boundary_idx = content.find(boundary_seq, content_start) # Look for newline before
        if boundary_idx == -1:
             # Try without the newline if formatted differently
             boundary_seq = '</div>\n                </div>'
             boundary_idx = content.find(boundary_seq, content_start)
        
        block_end = boundary_idx + len(boundary_seq)

    card_body = content[content_start:block_end]
    
    # We need to maintain the body closing divs.
    # The body content (extracted) includes the Grid contents + Closing Div for Grid + Closing Div for Wrapper.
    # Wait, the previous update (v2.284) did NOT add extra divs?
    # I did: `if is_v283: output_buffer += card_body else output_buffer += card_body + "</div>"`
    # But `is_v283` checked for `rounded-tr-[5rem]`. v2.284 does NOT have that class?
    # v2.284 has `w-[4.3rem]`.
    # Let's check `is_v284`.
    
    is_v284 = 'mask-image:' in content
    
    # In v2.284, the structure opens 3 divs (Relative, Button-ignore, SVG-ignore, Masked).
    # So effectively 2 main wrappers (Relative, Masked).
    # The Body Closes `grid`, `masked`, `relative`?
    # No.
    # The HTML I injected:
    # <div relative>
    #    <btn>
    #    <svg>
    #    <div masked>
    #       <header>
    #       <Grid>
    # So `Grid` closes. `Masked` closes. `Relative` closes.
    # So 3 closing divs needed.
    # If the file is v2.284, the body ALREADY HAS 3 closing divs.
    # Because I updated the file to include them (via the script logic).
    
    output_buffer += card_body
    
    last_idx = block_end

output_buffer += content[last_idx:]

with open(file_path, 'w') as f:
    f.write(output_buffer)

print("Applied Crater Socket Design v2.285.")
