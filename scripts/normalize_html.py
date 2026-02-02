
import re

# Clean script didn't trigger for Card 5 / 6?
# Output said: "Fixing 4 extra divs before <!-- Init Script -->" (This handles Card 6 end).
# But Line 615 (Card 5 Marker) still has unexpected closing tag?

# Reason:
# `fix_div_count.py` checks `l == '</div>'`.
# BUT Line 615 is: `                </div><!-- Card 5: Sales Advisor -->`
# This line is NOT `</div>`. It has content.
# My script skipped it because `else: break`.
# So it didn't see the closing div on that line.

# AND it didn't strip nearby divs because it assumed content was hit.

# Refined Fix:
# 1. Normalize the file: Split `</div><!--` into `</div>\n<!--`.
# 2. Re-run `fix_div_count.py`.

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# Split combined lines
content = content.replace('</div><!--', '</div>\n<!--')

with open(file_path, 'w') as f:
    f.write(content)

print("Normalized structure.")
