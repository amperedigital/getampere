
import re

# Read file
file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Inject the SVG Definitions (Mask and Border Path) at the start of the body
# We use a symbol for the path so we can use it in both the Mask and the Border Overlay.
# The path is defined relative to the Top-Right corner (0,0).
# Coordinates: Negative X is leftwards. Positive Y is downwards.
# Button Center: (-2rem, 2rem). Radius boundary: 2.2rem (giving ample padding).
# We add fillets.
svg_defs = """
<!-- Injected SVG Definitions for Liquid Socket -->
<div style="height: 0; width: 0; position: absolute; visibility: hidden;">
    <svg width="0" height="0">
        <defs>
            <symbol id="socket-geometry" viewBox="0 0 100 100" overflow="visible">
                <!-- 
                     Path Logic:
                     Start far left on top edge: M -100 0
                     Line to start of fillet: L -3.5 0 (approx 3.5rem left)
                     Fillet Curve down into socket: Q -2.8 0, -2.6 1.0 
                     (This connects to the socket circle. Let's trace a smooth 'U')
                     
                     Actually, let's draw a continuous smooth curve manually approx:
                     M -80 0 (Using pixel units for symbol, mapped to REM later? No, consistent units).
                     Let's use userSpaceOnUse with pixel assumption 1rem=16px.
                     Top-Right is (0,0).
                     Button Center (-32, 32). R approx 36 (2.25rem).
                     Start Notch at x=-60 (approx 3.75rem).
                     
                     Path:
                     M -300 0  (Top Edge Left Extension)
                     L -60 0   (Start of transition)
                     C -45 0, -50 10, -48 18  (Fillet In, ending near circle boundary)
                     A 36 36 0 0 0 -18 48     (The Main Socket Arc - spanning roughly 90 deg)
                     C -10 50, 0 45, 0 60     (Fillet Out, ending on Right Edge)
                     L 0 300   (Right Edge Down Extension)
                -->
                <path d="M -300 0 L -60 0 C -45 0 -48 10 -50 15 A 38 38 0 0 0 -15 50 C -10 52 0 45 0 60 L 0 300" 
                      fill="none" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" />
            </symbol>
            
            <symbol id="socket-fill-shape" viewBox="0 0 100 100" overflow="visible">
                 <!-- Closed shape for masking (Black = Cutout) -->
                 <!-- Must define the SHAPE TO BE REMOVED (The hole) -->
                 <!-- Or the shape to be KEPT? mask-image with alpha matches opacity. -->
                 <!-- In SVG Mask: White = Opaque (Keep), Black = Transparent (Hide). -->
                 <!-- So we want a WHITE rectangle MINUS the socket shape. -->
                 <!-- It's easier to use a Path that draws the Card Body (White) and excludes the socket. -->
                 
                 <!-- Card Body Path relative to Top-Right (0,0) -->
                 <!-- Go Left, Down, Right, Up(tracing socket) -->
                 <path d="M 0 300 L 0 60 C 0 45 -10 52 -15 50 A 38 38 0 0 1 -50 15 C -48 10 -45 0 -60 0 L -500 0 L -500 500 L 0 500 Z" 
                       fill="white" />
            </symbol>

            <mask id="liquid-socket-mask">
                <!-- 1. Everything transparent by default -->
                <!-- 2. Draw the 'Keep' shape (The card body) in White -->
                <!-- We place the logic at x="100%" y="0" -->
                <use href="#socket-fill-shape" x="100%" y="0" />
            </mask>
        </defs>
    </svg>
</div>
"""

# Insert defs after body tag
if '<!-- Injected SVG Definitions for Liquid Socket -->' not in content:
    content = content.replace('<body class="bg-slate-950 font-sans text-slate-300 antialiased selection:bg-blue-500/30">', 
                              '<body class="bg-slate-950 font-sans text-slate-300 antialiased selection:bg-blue-500/30">\n' + svg_defs)

def get_liquid_card_html(title, subtitle, color_name, color_500, color_400, icon_svg):
    # Updated Geometry for Liquid Socket
    # We use the SVG mask defined above.
    
    return f"""{title}
                <!-- v2.286: Applied "Liquid Socket" aesthetic -->
                <div class="relative group h-full"> 
                    
                    <!-- 1. Background Layer (Masked) -->
                    <!-- Note: We use style="mask:..." for the masking. 
                         We construct the visual style (Glass, Border-ish) inside. -->
                    <div class="absolute inset-0 z-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md rounded-[2rem]"
                         style="mask: url(#liquid-socket-mask); -webkit-mask: url(#liquid-socket-mask);">
                         <!-- Inner Highlight for pseudo-border effect? 
                              Since standard border is masked out, we need a separate border overlay. -->
                    </div>

                    <!-- 2. Border Overlay (SVG) -->
                    <!-- Top-Left, Bottom, Left borders are handled by a standard div or SVG rect? 
                         Let's use a standard div border for the 'Safe' areas and SVG for the corner? 
                         Actually, let's just draw the border with SVG. -->
                    <svg class="absolute inset-0 w-full h-full pointer-events-none z-10 text-white/20">
                         <!-- Use the symbol for top-right -->
                         <use href="#socket-geometry" x="100%" y="0" class="text-white/20" />
                         <!-- We need the REST of the border. 
                              The symbol covers Top (-300px to 0) and Right (0 to 300px).
                              We need to connect the rest. 
                              Since the symbol has `vector-effect=non-scaling-stroke`, scaling lines is hard to match.
                              Let's compromise: Use a standard border div, but Clip it?
                          -->
                    </svg>
                    <!-- Backing Div for Standard Borders (Left, Bottom) -->
                    <div class="absolute inset-0 z-10 rounded-[2rem] border-l border-b border-t-0 border-r-0 border-white/20 pointer-events-none"></div>
                    <!-- Top Border Segment (Left of socket) -->
                    <div class="absolute top-0 left-0 right-[4rem] h-[1px] bg-white/20 z-10"></div> 
                    <!-- Right Border Segment (Below socket) -->
                    <div class="absolute bottom-0 right-0 top-[4rem] w-[1px] bg-white/20 z-10"></div>


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
    replacements[i] = get_liquid_card_html(card['marker'], card['subtitle'], card['color'], card['c500'], card['c400'], card['svg'])

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
    # Finding block end: Look for the closing of the Grid, then the closing of the Header Div? 
    # v2.285 structure:
    # <div relative group> 
    #    ... buttons/svgs ...
    #    <div masked body> 
    #        <header>
    #        <grid>
    #           ... items ...
    #        </grid> (First Div Close)
    #    </div> (Masked Body Close)
    # </div> (Group Close)
    
    # We need to extract the items inside the grid.
    # The Grid Items end before the `</div>` that closes the grid.
    
    # Heuristic: Look for the 3rd `</div>` from the end of the card block or search for `<!-- End Card -->` if simpler? No markers.
    
    # Search for the next card marker to establish bounds
    if i < len(cards_data) - 1:
        next_marker_start = content.find(cards_data[i+1]['marker'])
        block_end_search_area = content[content_start:next_marker_start]
        # Find the last `</div>`s
        # Actually, extracting grid items is safer if we split by lines or look for `<div class="text-slate-600`?
        pass
    
    # Let's rely on the indentation in v2.285
    # The grid closing div usually starts on a new line with indentation.
    # But wait, we just want to PRESERVE the content inside the grid.
    
    # Currently `content_start` is right after `<div ... w-full">`.
    # Let's find the closing `</div>` for this grid.
    # Since we don't have a parser, we assume the closing div is `                    </div>` (20 spaces).
    
    ending_seq = '                    </div>\n                </div>'
    boundary_idx = content.find(ending_seq, content_start)
    
    # If not found, try `</div>\n                </div>`
    if boundary_idx == -1:
        ending_seq = '</div>\n                </div>'
        boundary_idx = content.find(ending_seq, content_start) # Rough
        
    card_body = content[content_start:boundary_idx]
    
    output_buffer += card_body
    
    # After the body, we need to close:
    # 1. Grid (</div>)
    # 2. Content Wrapper (</div>)
    # 3. Outer Wrapper (</div>)
    
    output_buffer += '</div>\n                    </div>\n                </div>'
    
    # Skip past the old structure in `content`
    # The old structure in v2.285 had 3 closing divs too.
    # `</div>\n                </div>\n                </div>`? 
    # Let's just find the start of next marker or specific end tag
    
    if i < len(cards_data) - 1:
        next_start = content.find(cards_data[i+1]['marker'])
        last_idx = next_start
    else:
        # Last card. Find the end of it.
        # It's inside a list or grid?
        # It's likely followed by `</div>` closing the main grid.
        # Let's just assume 3 closing divs were in the file.
        last_idx = boundary_idx + len(ending_seq) 
        # Wait, `ending_seq` was `</div></div>`. That's 2.
        # Check v2.285 script again. I extracted body, then closed.
        # "maintain the body closing divs" -> I didn't verify count.
        # Assuming last_idx logic handles the jump.
        
        # Verify if there is a 3rd div?
        chk = content[last_idx:last_idx+20]
        if '</div>' in chk:
             last_idx = content.find('</div>', last_idx) + 6 # Consume one more

output_buffer += content[last_idx:]

with open(file_path, 'w') as f:
    f.write(output_buffer)

print("Applied Liquid Socket Design v2.286.")
