
import re

# Line 482 is `</div>`.
# Context:
# Line 479: `...w-[96%]"></div></div></div>` (Progress Bar closed)
# Line 480: `</div>` (Closes Grid?)
# Line 481: `</div>` (Closes Wrapper?)
# Line 482: `</div>` (Closes Group?)
# Line 483: `</div>` (EXTRA?)

# This confirms that somewhere around Card 3, we have 4 closing divs instead of 3.
# `apply_math_socket.py` loop:
# It appends `</div>\n </div>\n </div>`.
# But `card_body` might contain an OLD closing div if I failed to strip it?
# In `apply_math_socket.py`:
# `boundary_idx = content.find(ending_seq, content_start)`
# If `ending_seq` matched, it uses the START of `ending_seq`.
# `ending_seq` was `</div>...` (2 divs).
# But if the file had 3 divs?
# The 3rd div would be left hanging? No.
# If I extract up to `boundary_idx`, I exclude 2 divs.
# I append 3 divs.
# Net change: +1 Closing Div.

# WHY did I assume `ending_seq` had only 2 divs?
# My script: `ending_seq = '                    </div>\n                </div>'`
# AND I also checked for `</div>\n                </div>`.
# BUT v2.286 had *3* closing divs.
# So I effectively kept the 3rd closing div in the body?
# Or I replaced 2 with 3?
# Yes, I replaced 2 with 3.
# Result: 3 (New) + 1 (Old Remnant) = 4 Closing Divs.

# Correct Fix:
# I need to consume ALL 3 closing divs from the old file.
# The correct `ending_seq` for v2.286 (which `apply_math_socket.py` was reading) should ideally consume the whole block.

# Since I ran `apply_math_socket.py` and it created this mess, I should fix it by running a cleanup script.
# The cleanup script should go through key points (before each Card Marker) and ensure there are exactly 3 closing divs closing the previous card (which is inside a grid/group).
# wait.
# Before Card 2 marker -> Close Card 1.
# Before Card 3 marker -> Close Card 2.
# ...

# We can search for the markers.
# Look at the preceding lines.
# If we see 4 `</div>` lines, remove one.

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
# We will iterate and look for Card markers.
# When we find one, we look back at the buffer `new_lines`.
# If the last N lines are just `</div>` (ignoring whitespace), we count them.
# If > 3, we remove the extras.

markers = [
    '<!-- Card 1: Front Door Agent -->', # Start path. No closing divs before this (except grid/header?)
    '<!-- Card 2: Demo Guide -->',
    '<!-- Card 3: Onboarding Coach -->',
    '<!-- Card 4: Technical Specialist -->',
    '<!-- Card 5: Sales Advisor -->',
    '<!-- Card 6: Booking Agent -->',
    '<!-- Init Script -->' # To catch the end of Card 6
]

# We need to target the PREDECESSOR of these markers.
# Exclude Card 1 (Start).
target_markers = markers[1:]

for line in lines:
    new_lines.append(line)
    
    # Check if this line contains a marker
    if any(m in line for m in target_markers):
        # Scan backward in new_lines
        idx = len(new_lines) - 2 # Skip current marker line
        closing_div_indices = []
        
        while idx >= 0:
            l = new_lines[idx].strip()
            if l == '</div>':
                closing_div_indices.append(idx)
            elif l == '':
                pass # Skip empty
            else:
                break # Hit content
            idx -= 1
        
        # We expect 3 `</div>`s.
        if len(closing_div_indices) > 3:
            # We have extras. Remove them.
            # We want to keep the indices CLOSER to the content (higher up)?
            # Or closer to the marker?
            # It doesn't matter, they are just `</div>`.
            # Example: found 4 indices. Remove 1.
            to_remove = len(closing_div_indices) - 3
            print(f"Fixing {to_remove} extra divs before {line.strip()}")
            
            # Remove from `new_lines`.
            # We must remove carefully to not break indices.
            # closing_div_indices are sorted descending (idx decreases).
            # So `closing_div_indices[0]` is the one closest to the marker (bottom).
            # Remove the top ones (furthest from marker)?
            # Let's remove the ones closest to the marker (bottom).
            
            for k in range(to_remove):
                pop_idx = closing_div_indices[k]
                new_lines.pop(pop_idx)

# Join and write
with open(file_path, 'w') as f:
    f.write(''.join(new_lines))

print("Fixed unbalanced divs.")
