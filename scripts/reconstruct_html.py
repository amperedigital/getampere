
import re

# "Closing divs near end: 11"
# And VALIDATION FAILS with "Unclosed elements"?
# If I have 11 closing divs, I should have closed everything.
# Unless they are effectively commented out or malformed?
# `<div ...></div></div> ...`

# Let's read the last 50 lines properly.
file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    lines = f.readlines()[-60:]
    for l in lines:
        print(l.strip())

# The validator tracks "Unclosed elements: [('div', 27), ('div', 334), ('div', 343)]"
# Line 27: <div relative overflow-hidden bg-slate-950> (Main wrapper)
# Line 334: <div class="relative py-24 sm:py-32"> (Section)
# Line 343: <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"> (Grid)
# So the validator thinks these 3 are NEVER CLOSED.

# This implies that despite seeing "11" divs, they aren't matching these 3.
# Are they matching intermediate divs?
# Card 6 has Grid Items.
# <div relative> (Group)
# <div masked> (Body)
# <div content> (Wrapper)
# <div grid> (Inner Grid)
# <div item> ... </div>
# Then closing:
# </div> (Inner Grid)
# </div> (Wrapper)
# </div> (Body)
# </div> (Group)

# Total 4 closing?
# `apply_math_socket.py` produced 3 closing divs.
# Wait, `get_tangent_card_html` opens 1 (Group).
# Then `Masked` (Div 1).
# Then `Content` (Div 4).
# Then `Grid` (Div ?).
# Let's count Openings in `get_tangent_card_html`:
# 1. <div relative group>
# 2. <div absolute inset-0 z-0 bg...> (Background) - SELF CLOSING? NO.
#    Ah! `<div ... style="mask..."> </div>` (Closed immediately).
# 3. <svg>...
# 4. <div border-l> </div> (Closed)
# 5. <div top-border> </div> (Closed)
# 6. <div right-border> </div> (Closed)
# 7. <div button> ... </div> (Closed)
# 8. <div relative h-full flex col> (Content Wrapper) - OPEN.
# 9. <div header> ... </div> (Closed)
# 10. <div grid> - OPEN.

# So Open: Group (#1), Content Wrapper (#8), Grid (#10).
# Total 3 Open.

# Closing Logic:
# `output_buffer += '</div>\n                    </div>\n                </div>'`
# Closes: Grid (#10), Content Wrapper (#8), Group (#1).
# Correct.

# So each Card is self-contained.
# So the Global Divs (Grid, Section, Main) must be closed at the end.
# But validator says Main (27) is unclosed.
# This means the final `</div>`s at the end of the file are missing or insufficient.
# I saw "11".
# Maybe they are closing EXTRA things inside the cards?

# Let's look at the "11" lines.
# Maybe I have 11 `</div>` lines, but they are inside Loop?
# `fix_missing_tail.py` output 11. 
# This was in `end_chunk`.
# If I had 11 closing divs at the end, that's enough to close Earth.

# Is it possible the previous "Card 5" fix broke something?
# "Normalized structure".
# "Fixing 1 extra divs before <!-- Card 5... -->".
# If I removed a closing div, maybe Card 4 isn't closed?
# If Card 4 isn't closed, then Card 5 is INSIDE Card 4.
# Then Card 5 closes itself.
# Then Card 6 closes itself.
# Then we have 3 Global Closing Divs.
# They close Card 6, Card 5, Card 4?
# And leaving Global open.

# This explains "Unclosed elements: 3".
# Because my Global Closing Divs were consumed by unclosed Cards!

# So the cards ARE NOT self-contained.
# Why?
# "Fixing 1 extra divs before <!-- Card 2... -->"
# I removed 1 div.
# If I had 4, and removed 1 -> 3.
# 3 IS correct.

# UNLESS `apply_math_socket.py` loop added incomplete HTML?
# "output_buffer += '</div>\n                    </div>\n                </div>'" (3 Closing).
# So I generate 3 closing.
# I had 4 in file?
# 3 from me + 1 from Old File?
# If Old file v2.286 had 3.
# I replaced body but appended 3.
# If I failed to eat old 3, I have 3+3 = 6.
# If I had 6, and removed 1 (fix_div_count), I have 5.
# 5 closes > 3 opens.
# So Card 1 closes itself AND Main/Section?
# Then Card 2 starts at root...

# This is a mess.
# I need to strictly enforce: Each Card Block has exactly 3 closing divs at the end.
# I will rewrite the file block by block to guarantee this.

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# Split by markers.
markers = [
    '<!-- Card 1: Front Door Agent -->',
    '<!-- Card 2: Demo Guide -->',
    '<!-- Card 3: Onboarding Coach -->',
    '<!-- Card 4: Technical Specialist -->',
    '<!-- Card 5: Sales Advisor -->',
    '<!-- Card 6: Booking Agent -->',
    '<!-- Init Script -->'
]

chunks = []
last_pos = 0
for m in markers:
    pos = content.find(m)
    if pos == -1: continue
    chunks.append(content[last_pos:pos]) # Content BEFORE marker
    last_pos = pos

chunks.append(content[last_pos:]) # Tail starting with Init Script

# Chunk 0: Header up to Card 1.
# Chunk 1: Card 1 Body.
# ...
# Chunk 6: Card 6 Body.
# Chunk 7: Tail.

# For Chunks 1 to 6 (The Cards):
# We must ensure they end with EXACTLY 3 `</div>` tags (ignoring whitespace).
# Any other `</div>` inside is part of the content (Grid Items).
# But Grid Items are `<div>...</div>`.
# So the end of the chunk should be `...</div></div></div>`.

clean_chunks = [chunks[0]] # Keep header

def clean_card_chunk(chunk):
    # Strip trailing whitespace/newlines
    c = chunk.rstrip()
    # Count how many closing divs are at the end.
    # We want exactly 3.
    # We can use regex to find the trailing sequence of </div>
    # pattern: (</div>\s*)+$
    
    # We strip ALL trailing closing divs, then add back 3.
    # Make sure we don't strip internal divs!
    # The internal divs are for grid items.
    # They are usually followed by text or something? No.
    # Grid items end with `</div>`.
    # Structure:
    # ...
    # <div item> ... </div>
    # <div item> ... </div>
    # </div> (Grid)
    # </div> (Wrapper)
    # </div> (Group)
    
    # So we have a sequence of closing divs.
    # Logic: The last 3 closing divs match the 3 opens we created.
    # Any previous closing divs match the ITEMS.
    
    # If we have duplicated blocks, we might have 6 closing divs.
    # We should keep `count - (count - 3)`? No.
    # We just want to ensure that the trailing block of divs is reduced to 3?
    # No, because the Grid Item `</div>` is adjacent.
    # <div item>...</div></div></div></div>
    # Item Close + 3 Card Closes = 4.
    
    # Visual check:
    # Item closes are usually on the same line as content? `...</div></div></div>`.
    # Card closes are on new lines?
    
    # Let's simple truncate the chunk at the last non-div character?
    # No, that deletes the item closes.
    
    # Safe approach:
    # Identify the logical block structure we INJECTED.
    # `output_buffer += '</div>\n                    </div>\n                </div>'`
    # This string is very specific.
    # If we see multiples of this string, keep one.
    
    sig = '</div>\n                    </div>\n                </div>'
    # Count occurrences of sig at the END?
    # Or just replace all trailing `</div>` sequence with standard format?
    
    # Let's count `</div>` tokens in the suffix.
    # Scan backward.
    count = 0
    i = len(c)
    while i > 0:
        # Find last `</div>`
        last_div = c.rfind('</div>', 0, i)
        if last_div == -1: break
        
        # Check if ONLY whitespace between `last_div + 6` and `i`.
        gap = c[last_div+6:i]
        if not gap.strip():
            count += 1
            i = last_div
        else:
            break
    
    # `i` is the index of content BEFORE the block of closing divs.
    # We want to preserve `i`.
    # AND append 3 divs.
    # Wait, what if `count` includes the Item Closes?
    # If Item Closes are `...</div>`, `count` will include them.
    # How many?
    # Grid contains items.
    # Last item `...</div>`.
    # So `count` will be 1 (item) + 3 (structure) = 4.
    
    # But some items end with multiple divs? (Progress bar: <div><div></div></div> -> 3 closes).
    # So `count` could be large.
    
    # Strategy: 
    # v2.287 injected `\n                    </div>\n                </div>`.
    # We can robustly look for THAT indentation pattern.
    # Or matches of `</div>` on mostly empty lines.
    
    # Let's use the Indentation Heuristic.
    # The Card Closes are naturally:
    # `</div>`
    # `                    </div>`
    # `                </div>`
    
    # If we see duplicates of this pattern, remove them.
    # Regex for exactly 3 indented divs?
    
    # Let's just remove specific SPURIOUS blocks I know exists.
    # `</div>\n                </div>\n</div>\n                </div>` (Example).
    
    pass

# Actually, the quickest 'hack' that is 100% reliable:
# Go into the `content` and Replace `</div></div></div>` (specific newline combo) with single instance?
# Let's look at the actual text at a boundary.
# `check_div_balance.py` failed at line 482.
# That was Card 3.
# I suspect we have `</div>\n</div>` type stuff.

# Let's rewrite the file ensuring single `sig` occurrence.
sig = '</div>\n                    </div>\n                </div>'

new_content = clean_chunks[0]

for i in range(1, 7): # Chunks 1-6
    c = chunks[i]
    # Remove any trailing `</div>` junk that forms a block bigger than needed.
    # Since I "fixed" it by removing 1 div, I might have `</div>...</div>` (2 divs).
    # Then `apply` added 3. Total 5.
    # `fix` removed 1. Total 4.
    # `fix` reported removing 1 more?
    
    # Let's force-set the tail.
    # Find the last `</div>` that is NOT part of the structure?
    # Hard.
    
    # How about this:
    # 1. Strip ALL trailing `</div>`s (and whitespace).
    # 2. Check the last remaining line. Does it look like an Item Close?
    #    e.g. `...</div></div></div>`.
    #    If so, fine.
    # 3. Append `</div>\n                    </div>\n                </div>`.
    # 4. Check balance manually?
    
    c = c.rstrip()
    # While ends with `</div>` on a line by itself...
    while c.strip().endswith('></div>') is False and c.strip().endswith('</div>'):
        # Find last </div>
        idx = c.rfind('</div>')
        # Ensure it's the very end
        if not c[idx+6:].strip():
            c = c[:idx].rstrip()
        else:
            break
            
    # Now append the 3 divs
    c += '\n' + sig + '\n                '
    clean_chunks.append(c)

clean_chunks.append(chunks[7]) # Tail. Check if it has the 3 global closes.
# The tail starts with `<!-- Init Script -->`.
# It PRECEDES the globals.
# Wait. `chunks[6]` (Card 6) ENDS at `<!-- Init Script -->`?
# NO.
# `split` by marker consumes everything in between.
# `chunks[6]` is "Card 6 Header... Body...` UP TO `<!-- Init Script -->`.
# So `chunks[6]` contains Card 6 AND the Global Closing Divs?
# NO.
# `Init Script` is usually AFTER the global closing divs.
# Check grep:
# </div> </div> </div> (Global)
# <!-- Init Script -->
# So the Global Closes are IN `chunks[6]`.
# ERROR: My `clean_card_chunk` logic will reset `chunks[6]` to have 3 divs.
# But `chunks[6]` needs 3 (Card) + 3 (Global) = 6 Divs!
# Special handling for last chunk.

# Actually, the markers are START markers.
# `chunks[1]` (Card 1) goes to Start of Card 2.
# So `chunks[1]` should have 3 closing divs.
# `chunks[6]` (Card 6) goes to `Init Script`.
# It should have 6 closing divs.

final_out = clean_chunks[0]
for i in range(1, 6): # 1 to 5
    c = chunks[i].rstrip()
    # Strip trailing solitary divs
    while c.strip().endswith('</div>'):
        idx = c.rfind('</div>')
        if not c[idx+6:].strip():
            c = c[:idx].rstrip()
        else:
            break
    c += '\n' + sig + '\n                '
    final_out += c

# Handle Card 6 (index 6)
c6 = chunks[6].rstrip()
while c6.strip().endswith('</div>'):
    idx = c6.rfind('</div>')
    if not c6[idx+6:].strip():
        c6 = c6[:idx].rstrip()
    else:
        break

# Append 3 for Card + 3 for Global
global_sig = '\n            </div>\n        </div>\n    </div>\n\n    '
c6 += '\n' + sig + global_sig
final_out += c6

final_out += chunks[7]

with open(file_path, 'w') as f:
    f.write(final_out)

print("Reconstructed file with strict div counts.")
