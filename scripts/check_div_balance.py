
import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# I suspect `apply_math_socket.py` failed to remove an old closing div block because `ending_seq` mismatch?
# NO.
# Look at Card 4 output above:
# CSAT row.
# </div> (Closes grid item?) No, Grid Item doesn't have closing div? 
# "grid grid-cols-3" -> Items are `<div>...</div>`.
# The grep output shows `...</div></div></div> </div>`
# Wait.
# `...w-[98%]"></div></div></div>` -> These close the Progress Bars.
# THEN: `</div>` (Closes Grid Container?)
# THEN: `</div>` (Closes Content Wrapper?)
# THEN: `</div>` (Closes Card Group?)

# The Validation error was Line 615: `</div><!-- Card 5...`
# If we have 3 closing divs, that IS valid.
# UNLESS `Card 5` is INSIDE `Card 4`?
# Did I fail to close `Card 4` properly?
# Or did I close it, but the Validate Tool sees EXTRA closing tags?

# "Unexpected closing tag" usually means:
# <body>
#   <div>
#     ...
#   </div>
#   </div> <-- Unexpected.
# </body>

# This happens if I have `</div>` at root level.
# Card 4 closes with `</div>`.
# If `Card 5` starts effectively at root level, that's fine.
# But if `Card 5` marker is PRECEDED by an extra `</div>`?

# Let's count divs in the file programmatically to find the "Water Level".
level = 0
lines = content.splitlines()
for i, line in enumerate(lines):
    # Split by tags to be robust
    tags = re.findall(r'</?div[^>]*>', line)
    for tag in tags:
        if '</div>' in tag:
            level -= 1
        elif '<div' in tag:
            if '/>' not in tag: # Self closing? Divs aren't self closing usually.
                level += 1
    
    if level < 0:
        print(f"Level went negative at line {i+1}: {line.strip()}")
        # This confirms "Unexpected closing tag"
        break

# This script will identify exactly where the structure breaks.
