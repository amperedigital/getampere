
import re

# Read file
file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# Define the markers for strict splitting
card_markers = [
    '<!-- Card 1: Front Door Agent -->',
    '<!-- Card 2: Demo Guide -->',
    '<!-- Card 3: Onboarding Coach -->',
    '<!-- Card 4: Technical Specialist -->',
    '<!-- Card 5: Sales Advisor -->',
    '<!-- Card 6: Booking Agent -->',
]

# Replacement Headers (New Outer + Icon + New Inner + Header + Grid Start)
replacements = {
    0: """<!-- Card 1: Front Door Agent -->
                <!-- v2.283: Notch Cutout Style -->
                <div class="relative group h-full"> 
                    <div class="absolute -top-1 -right-1 w-14 h-14 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)] z-20 group-hover:scale-105 transition-transform duration-300 backdrop-blur-sm">
                        <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                    </div>
                    <div class="h-full border border-white/10 p-4 lg:p-8 rounded-2xl rounded-tr-[5rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md flex flex-col overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:from-white/15 hover:to-white/5 transition-all duration-500">
                        <div class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-12">
                            <h3 class="text-sm font-normal text-white tracking-wide">Front Door Agent</h3>
                            <p class="text-xs text-slate-500 mt-0.5">Reception & Routing</p>
                        </div>
                        <div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">""",
    1: """<!-- Card 2: Demo Guide -->
                <!-- v2.283: Notch Cutout Style -->
                <div class="relative group h-full"> 
                    <div class="absolute -top-1 -right-1 w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] z-20 group-hover:scale-105 transition-transform duration-300 backdrop-blur-sm">
                        <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div class="h-full border border-white/10 p-4 lg:p-8 rounded-2xl rounded-tr-[5rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md flex flex-col overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:from-white/15 hover:to-white/5 transition-all duration-500">
                        <div class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-12">
                            <h3 class="text-sm font-normal text-white tracking-wide">Demo Guide</h3>
                            <p class="text-xs text-slate-500 mt-0.5">Feature Walkthroughs</p>
                        </div>
                        <div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">""",
    2: """<!-- Card 3: Onboarding Coach -->
                <!-- v2.283: Notch Cutout Style -->
                <div class="relative group h-full"> 
                    <div class="absolute -top-1 -right-1 w-14 h-14 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.2)] z-20 group-hover:scale-105 transition-transform duration-300 backdrop-blur-sm">
                        <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <div class="h-full border border-white/10 p-4 lg:p-8 rounded-2xl rounded-tr-[5rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md flex flex-col overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:from-white/15 hover:to-white/5 transition-all duration-500">
                        <div class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-12">
                            <h3 class="text-sm font-normal text-white tracking-wide">Onboarding</h3>
                            <p class="text-xs text-slate-500 mt-0.5">Setup Assistance</p>
                        </div>
                        <div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">""",
    3: """<!-- Card 4: Technical Specialist -->
                <!-- v2.283: Notch Cutout Style -->
                <div class="relative group h-full"> 
                    <div class="absolute -top-1 -right-1 w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)] z-20 group-hover:scale-105 transition-transform duration-300 backdrop-blur-sm">
                        <svg class="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    </div>
                    <div class="h-full border border-white/10 p-4 lg:p-8 rounded-2xl rounded-tr-[5rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md flex flex-col overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:from-white/15 hover:to-white/5 transition-all duration-500">
                        <div class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-12">
                            <h3 class="text-sm font-normal text-white tracking-wide">Tech Specialist</h3>
                            <p class="text-xs text-slate-500 mt-0.5">Deep Support</p>
                        </div>
                        <div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">""",
    4: """<!-- Card 5: Sales Advisor -->
                <!-- v2.283: Notch Cutout Style -->
                <div class="relative group h-full"> 
                    <div class="absolute -top-1 -right-1 w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.2)] z-20 group-hover:scale-105 transition-transform duration-300 backdrop-blur-sm">
                        <svg class="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </div>
                    <div class="h-full border border-white/10 p-4 lg:p-8 rounded-2xl rounded-tr-[5rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md flex flex-col overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:from-white/15 hover:to-white/5 transition-all duration-500">
                        <div class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-12">
                            <h3 class="text-sm font-normal text-white tracking-wide">Sales Advisor</h3>
                            <p class="text-xs text-slate-500 mt-0.5">Revenue & Plans</p>
                        </div>
                        <div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">""",
    5: """<!-- Card 6: Booking Agent -->
                <!-- v2.283: Notch Cutout Style -->
                <div class="relative group h-full"> 
                    <div class="absolute -top-1 -right-1 w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)] z-20 group-hover:scale-105 transition-transform duration-300 backdrop-blur-sm">
                         <svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <div class="h-full border border-white/10 p-4 lg:p-8 rounded-2xl rounded-tr-[5rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md flex flex-col overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:from-white/15 hover:to-white/5 transition-all duration-500">
                        <div class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-12">
                            <h3 class="text-sm font-normal text-white tracking-wide">Booking Agent</h3>
                            <p class="text-xs text-slate-500 mt-0.5">Scheduling</p>
                        </div>
                        <div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">"""
}

# Process each card
new_content = content
offset = 0

# We process backwards to avoid index shifts? No, the markers are unique.
# But we need to close the divs.
# To close the divs safely, we need to know where each card ENDS.
# Since we know the cards come one after another, Card 1 ends before "<!-- Card 2".
# Card 6 ends before the end of the container.

# Let's split the file by markers to process blocks.
parts = []
# Find all start indices
indices = []
for m in card_markers:
    idx = content.find(m)
    if idx == -1: raise Exception(f"Missing marker {m}")
    indices.append(idx)

# Special handling for End of Card 6
# We need to find the specific closing div structure after Card 6.
# It ends with `                    </div>` (Grid close) then `                </div>` (Card close).
# We can just look for the `</div>` that closes the grid container `<!-- End Master Container -->` ? No.

# Let's rebuild the file piece by piece.
# Part 0: Start of file to Card 1
final_output = content[:indices[0]]

for i, marker in enumerate(card_markers):
    start_idx = indices[i]
    
    # Determine end of this card block
    if i < len(card_markers) - 1:
        end_idx = indices[i+1]
    else:
        # For the last card, we need to find its end.
        # We know the card html ends with `</div>` indented.
        # Let's look for the closing of the grid container: `</div><!-- End Master Container -->` is WRONG.
        # The container is `<div ... class="grid ...">`.
        # The cards are inside.
        # Look for `</div>` followed by `</div>` followed by `</div><!-- End Master Container -->`?
        
        # In tech-demo.html lines 630+:
        #                 </div>
        #             </div>
        #         </div>
        #     </div>
        #     <!-- End Master Container -->
        
        # So look for the `            </div>` that precedes the container close.
        # Or safer: Find `            </div>` (12 spaces) followed by `        </div>` (8 spaces).
        
        # Let's finding the container end comment:
        container_end = content.find('</div><!-- End Master Container -->')
        # Backtrack to find the last card closing div?
        # The structure is:
        # <Grid Container>
        #    ...
        #    <Card 6> ... </Card 6>
        # </Grid Container>
        
        # So the `</div>` closing the Grid Container is immediately before `</div><!-- End Master Container -->`?
        # Actually `</div><!-- End Master Container -->` likely closes the Flex container.
        
        # Let's just use a loose search for the last closing div of the card grid.
        # The 6th card is the last thing.
        # Iterate forward from start_idx until we hit `            </div>` (indentation 12) ?
        
        # Hack: The file content is static enough.
        # Let's assume the block ends at the grid container closing.
        end_idx = content.find('            </div>', start_idx + 1000) # Jump ahead
        # This is risky.
        
        # Helper: Regex to find the <div class="grid grid-cols-3... starting matching string.
        pass

# Actually, we can just perform the header swap using `replace()` since the replacement strings are unique enough?
# No, we need to inject the extra `</div>` at the end of each card.
# This requires knowing where the end is.

# Let's use the valid "Grid Start" tag to identify the swap point.
# And use the NEXT MARKER to identify the end point.

output_buffer = ""
last_idx = 0

for i, marker in enumerate(card_markers):
    # Get current block start
    curr_start = content.find(marker)
    
    # Append everything before this card (unchanged)
    # If i=0, appends preamble. If i>0, appends whitespace b/w cards.
    output_buffer += content[last_idx:curr_start]
    
    # Get replacement header
    new_header = replacements[i]
    
    # Find where the old header ENDS (Grid Start)
    grid_tag = '<div class="grid grid-cols-3 gap-y-2 gap-x-2 text-[10px] font-mono w-full">'
    grid_start = content.find(grid_tag, curr_start)
    
    if grid_start == -1: raise Exception("Grid start not found")
    
    # Append the NEW header (which includes the card start)
    output_buffer += new_header
    
    # Now we need to append the grid CONTENT.
    # From (grid_start + len(grid_tag)) up to the End of the Card.
    
    content_start = grid_start + len(grid_tag)
    
    # Find End of Card
    if i < len(card_markers) - 1:
        next_marker_start = content.find(card_markers[i+1])
        # The card ends before the next marker.
        # Usually overlap is whitespace.
        # We need to capture the `</div>` and `</div>` closing the old structure.
        # Old: <Wrapper> <Grid>...</Grid> </Wrapper>
        # So we include everything up to next_marker_start.
        # But we need to inject an EXTRA </div> before next_marker_start.
        
        # Let's scan backwards from next_marker_start to find the last printable char?
        # No, just append `</div>` at the end of the block.
        
        block_end = next_marker_start
        
        # Append the grid content + closing tags of the old block
        card_body = content[content_start:block_end]
        
        # Replace the LAST `</div>` with `</div></div>` ???
        # The regex for the last div in the string: `</div>\s*$`
        
        # We can just append `</div>` to the string?
        # The existing string ends with `                </div>\n\n` (whitespace).
        # We want to insert a div before the newline?
        
        # Find width of indentation of the closing div.
        # It's usually `                </div>`.
        # We want to add `                </div>` (Inner closed) `            </div>` (Outer closed).
        
        # Let's splice it:
        # Find the last `</div>` instance in `card_body`.
        last_div_idx = card_body.rfind('</div>')
        
        # Verify it's the wrapper closer.
        # card_body ends with `</div>` (wrapper) then whitespace.
        
        # We want to insert another `</div>` after it.
        # `card_body` = "... </div>\n\n"
        # `new_body` = "... </div>\n                </div>\n\n"
        
        # Let's just replace the last `</div>` with `</div></div>`?
        # Indentation will be ugly but valid.
        
        new_card_body = card_body[:last_div_idx+6] + "</div>" + card_body[last_div_idx+6:]
        output_buffer += new_card_body
        
        last_idx = block_end

    else:
        # Last card (Card 6)
        # It ends at... 
        # We need to find the `</div>` that corresponds to the wrapper.
        # In the original file:
        # `                        <div class="text-white text-right">0.2s</div>`
        # `                        <div class="flex items-center"><div ...></div></div>`
        # `                    </div>` (Grid close)
        # `                </div>` (Wrapper close)
        # `            </div>` (Container close - maybe)
        
        # Search for Grid Close `                    </div>`
        # Then Wrapper Close `                </div>`
        
        # Start searching from content_start
        # It's risky.
        # Let's assume it spans until `            </div>` (12 spaces) which starts the container close sequence?
        
        # Find the sequence: `                    </div>\n                </div>`
        boundary_seq = '\n                    </div>\n                </div>'
        boundary_idx = content.find(boundary_seq, content_start)
        
        if boundary_idx == -1: raise Exception("Last card boundary not found")
        
        block_end = boundary_idx + len(boundary_seq)
        
        card_body = content[content_start:block_end]
        
        # Append extra div
        output_buffer += card_body + "</div>"
        
        last_idx = block_end

# Append remainder of file
output_buffer += content[last_idx:]

# Write back
with open(file_path, 'w') as f:
    f.write(output_buffer)

print("Successfully applied Notch Design to all 6 cards.")
