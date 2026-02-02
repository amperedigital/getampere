
import re

# New Error: "Mismatched </body>. Unclosed elements".
# This means I removed TOO MANY closing divs.
# `fix_div_count.py` Logic: "If > 3, remove extras".
# "Fixing 1 extra divs before <!-- Card 2... -->".
# This implies there were 4. I removed 1.
# Result: 3 closing divs.

# Why is it now complaining about Unclosed elements?
# "Unclosed elements: [('div', 27), ('div', 334), ('div', 343)]"
# Line 27: <div class="bg-slate-950 font-sans text-slate-300 antialiased selection:bg-blue-500/30"> (Wait, 27 is Main wrapper?)
# 334: Grid Container?
# 343: Grid?

# If I have unclosed elements, I am missing closing divs at the VERY END.
# Did `fix_div_count.py` run on the TAIL?
# "Fixing 4 extra divs before <!-- Init Script -->" (Previous run).
# "Fixing 1 extra divs before..." in THIS run.
# It did NOT report fixing tail.
# Maybe because I normalized lines and it saw correct count?

# Let's check the tail count again.
# We need Closing Divs for Grid, Container, Main.
# AND Closing Divs for Card 6.
# Card 6 closes with 3 divs in `apply_math_socket.py`.
# Then we need 3 global closes.
# Total 6?
# Or does the file separate them?
# `...</div></div></div>` (Card 6)
# `...</div></div></div>` (Global)

# Let's count how many CLOSING divs are before `<!-- Init Script -->`.
file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

m = '<!-- Init Script -->'
idx = content.find(m)
end_chunk = content[idx-500:idx]
cnt = end_chunk.count('</div>')
print(f"Closing divs near end: {cnt}")

# We absolutely need to close the Global Containers.
# If `fix_div_count` removed them because it thought they belonged to Card 6?
# No, `fix_div_count` searches backwards from Marker.
# If Marker is `Init Script`, it scans up.
# If it sees 6 consecutive `</div>` lines?
# It reduces them to 3.
# ERROR: If Card 6 + Global are adjacent, we have 6 valid closing divs.
# Reducing to 3 leaves 3 open divs (Global).

# Solution: Add back 3 closing divs to the end of the file.
# Assuming the "unclosed elements" correspond to exactly that.
if cnt < 6:
    print("Detected missing tail divs. Injecting...")
    new_content = content[:idx] + '\n            </div>\n        </div>\n    </div>\n\n    ' + content[idx:]
    with open(file_path, 'w') as f:
        f.write(new_content)
