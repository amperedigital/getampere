
import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# Error at 615: `</div><!-- Card 5...`
# Error at 681: `</div><!-- Card 6...`
# Error at 747: `</div>`

# This implies that BEFORE Card 5, we have an extra closing div?
# Or Card 4 Closed Too Many?

# In `apply_math_socket.py`:
# `output_buffer += '</div>\n                    </div>\n                </div>'`
# This adds 3 closing divs.

# If the `card_body` extraction INCLUDED a closing div (because my `boundary_idx` logic was loose), then we have 3 + 1 = 4 closing divs.
# `boundary_idx = content.find(ending_seq, content_start)`
# `ending_seq` starts with `</div>`.
# `card_body = content[content_start:boundary_idx]` EXCLUDES the ending seq.
# So `card_body` should be clean.

# HOWEVER:
# Look at the error: `615: </div><!-- Card 5: Sales Advisor -->`
# This line 615 contains a closing div AND the marker for Card 5.
# This suggests that `output_buffer` logic jammed them together?
# `output_buffer += '...</div>'` (from Loop N)
# Then Loop N+1 starts:
# `curr_start = content.find(marker)`
# `output_buffer += content[last_idx:curr_start]`
# If `last_idx` was AFTER `curr_start`? Impossible.
# If `last_idx` included a `</div>`?

# Let's inspect the file content around Card 4/5 transition.
# We likely have DUPLICATE closing blocks in the middle of the file.
# The `validation` logic counts +1 / -1.
# If we have +1 closing, it says "Unexpected closing tag".

# Fix Strategy:
# We will regenerate the file CORRECTLY using `apply_math_socket.py` but ensure `last_idx` is correct.
# The previous run of `apply_math_socket.py` clearly failed to skip the old divs correctly.
# Why?
# Because `last_idx` was set to `next_marker`.
# BUT if the old file had `</div> </div> </div> <!-- Card 5 -->`...
# And `card_body` ends BEFORE those divs.
# My script writes new divs.
# Then copies from `last_idx` (Marker) onwards.
# This implies the OLD divs were BEFORE the marker.
# And I did jump to the marker.
# So the old divs should be SKIPPED.

# Wait.
# `content[last_idx:curr_start]`
# Loop 0 (Card 1): `last_idx`=0. `curr_start`=Marker1. -> Puts Header.
# Writes Card 1 Body + New Divs.
# `last_idx` = Marker2.
# Loop 1 (Card 2): `curr_start` = Marker2.
# `content[Marker2:Marker2]` is empty.
# Writes Card 2 Header.
# ...

# This works IF the file structure is:
# ... Body ...
# </div></div></div>
# <!-- Card X -->

# IF `last_idx` jumps to `<!-- Card X -->`, it SKIPS `</div></div></div>`.
# So it should be clean.

# UNLESS `curr_start` finds the marker BEFORE `last_idx`? No.
# UNLESS the marker is NOT immediately after the divs?

# Let's look at the grep output: `615: </div><!-- Card 5...`
# It seems there is a `</div>` on the SAME LINE as the marker?
# Or just before it?
# If `last_idx` points to `<!-- Card 5...`, then we copy nothing.
# But we appended `...</div>` manually.

# Ah.
# My Manual Append: `output_buffer += '...</div>'`
# Then `output_buffer += content[last_idx:curr_start]` (Empty)
# Then `output_buffer += new_header`.
# Result: `</div><!-- Card 5...` (Jammed together).

# This is VALID HTML structure (<div>...</div><!-- Comment -->).
# So why does the validator fail?
# Because "Unexpected closing tag" means the stack is empty.
# i.e., I closed too many divs.

# Card 4 closed 3 divs.
# Did I open 3 divs?
# `new_header` (tangent socket) opens:
# 1. `<div class="relative group h-full">`
# 2. (Background is a div, but closed)
# 3. (SVG is closed)
# 4. (Border Divs closed)
# 5. (Button Div closed)
# 6. `<div class="relative h-full... flex flex-col z-10">` (Content Wrapper)
# 7. `<div class="diff-header...">` No, header is closed.
# 8. `<div class="grid ...">`

# So Open: Group(1), Content(2), Grid(3).
# Total 3 Open.
# I close 3.
# So parity is preserved.

# So why invalid?
# Maybe `card_body` has an extra closing div?
# `card_body` comes from the file.
# The file (v2.286) had `grid` closed?
# In v2.286 script:
# `ending_seq = '                    </div>\n                </div>'`
# `card_body = content[content_start:boundary_idx]`
# So `card_body` assumes it ends BEFORE the closing sequence.
# BUT what if the file had `</div>` lines earlier?

# Let's blindly fixing by Re-Reading the file and counting divs in `card_body`.
# If `card_body` has unequal count, we fix it.

# Actually, I suspect the issue is simply that the generated file has `</div>` lines that are NOT indented correctly or something, creating confusion? No.

# Let's look at the error again.
# "Line 615: Unexpected closing tag </div>".
# This means at line 615, we are at Root Level (0 open divs). But we see `</div>`.
# This implies that BEFORE 615, we closed one too many.
# Card 4 is before 615.
# So Card 4 closed too many.

# Card 4 uses the SAME logic as Card 1.
# Why did Card 1 not fail?
# Maybe Card 1 content is different?

# Let's read Card 4 Body from the file.
pass
