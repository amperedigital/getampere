
import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# The error: Unexpected closing tags.
# Likely my parsing logic for the "last card" failed to bite enough closing divs.
# I assumed the file ended with 3 closing divs from `cards_data[-1]`.
# But `last_idx` pointer handling might have left some old footer divs.

# Let's clean up the area after the last card.
# The structure should be:
# ... Last Card ...
# </div> </div> </div> (Closed Last Card)
# 
# </div> (Columns?) </div> (Container?) </div> (Section?)

# We can search for the "Init Script" and delete everything between the last card and it, then rebuild the closing divs?
# Safer: Just find duplicate closing divs.

# Let's look at where the last card is.
# Markers are robust.
last_marker = '<!-- Card 6: Booking Agent -->'
start_idx = content.find(last_marker)

# Find the end of this card block.
# We generated it with:
# output_buffer += '</div>\n                    </div>\n                </div>'
# So the Last Card IS closed properly.

# The issue is what comes AFTER it.
# In the loop: `last_idx` was set.
# `output_buffer += content[last_idx:]`
# If `last_idx` didn't skip the OLD closing divs, we duplicated them.

# In `apply_math_socket.py`:
# `last_idx = boundary_idx + len(ending_seq)`
# depending on what `ending_seq` matched.

# To fix: Remove excess `</div>` tags before `<script`.
# We know the structure:
# Grid Container > Card > Divs.
# The Cards are usually in a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.
# So we need closing divs for THAT grid and its parent containers.

# Let's count open divs from the start to `Start of Cards`.
# Then count how many we need at the end.
# But regex parsing HTML is fragile.

# SIMPLER FIX:
# Use `python3 scripts/safe_replace_html.py` on the WHOLE grid section? No, too big.
# Just scan backwards from `<script` and match closing tags to the indentation? No.

# Let's simply remove the DUPLICATE closing block.
# The file likely has:
# ...
# </div>
# </div>
# </div>
# </div> <-- Duplicate start
# </div>
# ...

# Read the tail.
tail_chunk = content[start_idx:]
# Find `<script`.
script_idx = tail_chunk.find('<script')
if script_idx == -1: 
    print("Script tag not found")
    exit(1)

div_section = tail_chunk[:script_idx]
# Count `</div>`
close_count = div_section.count('</div>')
print(f"Found {close_count} closing divs in the last chunk.")

# We expect: 
# 3 for the Card itself (masked, relative, etc) - which I added.
# Then X for the outer containers.
# The outer containers are:
# 1. Grid (cols-3)
# 2. Section/Container?

# Use grep to see the start of the file structure?
# <main>
#   <section>
#     <div container>
#       <div grid>

# So 4 closing tags needed after the last card? No, the Card closes itself.
# So just Grid, Container, Section, Main?
# Usually 3-4.

# If we have too many, the validator complains.
# "Unexpected closing tag" means we have MORE closing than opening.

# Let's look at the file end again using tool.
pass
