
import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# We see:
# </div> (Card Grid Item)
# </div> (Card Masked Body)
# </div> (Card Group)
#
# </div> (Outer Grid?)
# </div> (Outer Container)
#
# </div> (Extra?)

# The validator said "Line 615: Unexpected closing tag".
# "Line 747... 749... 750... 752".
# This implies I have WAY too many closing tags relative to opening.
# Or I deleted an Opening Tag?
# I extracted `card_body`. Did I check if `card_body` contained any opening divs that I failed to include?
# `card_body` was Grid Items.
# Structure:
# <Grid (Opening)>
#   Items...
# </Grid (Closing)>
# My script:
# `new_header` opens the Grid.
# `output_buffer += card_body` (Items)
# `output_buffer += </div>` (Closes Grid)

# BUT, did `card_body` capture the closing div of the PREVIOUS version?
# In `apply_math_socket.py`:
# `boundary_idx = content.find(ending_seq, content_start)`
# `card_body = content[content_start:boundary_idx]`
# `ending_seq` was the closing block.
# So `card_body` should NOT contain the closing divs.

# However, the validator fails on specific lines.
# Let's clean up the END of the file manually.
# The `grep` shows:
# </div>
# </div>
# </div>  (Card Ends)
# </div>  (Line 4)
# </div>  (Line 5)
# </div>  (Line 6)

# We normally need 3 closing tags after the cards to close:
# 1. <div class="grid ...">
# 2. <div class="relative max-w-7xl ...">
# 3. <div class="relative py-24 ..."> (Background/Section)

# So 3 tags. The grep shows 3 after the card block.
# Wait, look at the grep output:
# </div> (Card Grid Close - Indent 29?)
# </div> (Card Mask Close)
# </div> (Card Group Close)
# NO SPACE
# </div> (Line 4)
# </div> (Line 5)
# NEW LINE
# </div> (Line 6)

# That looks like 3 extra tags.
# Why did validation fail on Line 615? That's mid-file.
# "Unexpected closing tag" at 615 (Card 5?)
# "Unexpected closing tag" at 681 (Card 6?)

# Maybe I missed an OPENING tag in the Body?
# `new_header` has `<div class="grid ...">`.
# `card_body` starts with `<!-- Headings -->` or similar.
# If `new_header` is correct, we are fine.

# Let's look at Card 1.
# It works? Validator didn't complain about Card 1.
# But it complained about lines 615, 681.
# Card 1 is early.
# Card 5 is late.
# Maybe I messed up the loop cut-points?

# In loop:
# `output_buffer += content[last_idx:curr_start]`
# `last_idx` update logic:
# `last_idx = boundary_idx + len(ending_seq)`
# If `ending_seq` didn't match perfectly, `last_idx` might be wrong?
# `ending_seq` was `                    </div>\n                </div>`.
# If the file had differnt indentation, we might have duplicated.

# Strategy:
# 1. Read the file.
# 2. Identify the structure around Card 5 & 6.
# 3. Remove extra `</div>`s.

# Let's count indentation of closing divs to guess which ones are spurious.
# Groups of 3 closing divs = Card Close.
# If we see `</div></div></div>` then `</div></div></div>`...

# Actually, the quickest fix is to parse the end of the file and ensure only 3 closing divs exist after the last card marker.
marker_6 = '<!-- Card 6: Booking Agent -->'
m6_idx = content.find(marker_6)
if m6_idx != -1:
    # Find the end of Card 6.
    # It ends with 3 closing tags.
    # Tag 1: Grid close. Tag 2: Mask close. Tag 3: Group close.
    # Then we need 3 global closes.
    
    # Let's look at the text after M6.
    post_m6 = content[m6_idx:]
    # Find `<!-- Init Script -->`
    script_start = post_m6.find('<!-- Init Script -->')
    real_script_start = m6_idx + script_start
    
    # We will replace the chunk between Card 6 Body End and Script Start.
    # We need to find where Card 6 Body Ends.
    # We can rely on the fact that I just wrote Card 6 with `apply_math_socket.py`.
    # It wrote `</div>\n                    </div>\n                </div>`.
    
    # Let's find that specific string after M6.
    c6_end_sig = '</div>\n                    </div>\n                </div>'
    c6_end_idx = post_m6.find(c6_end_sig)
    
    if c6_end_idx != -1:
        abs_end_idx = m6_idx + c6_end_idx + len(c6_end_sig)
        
        # Now, from `abs_end_idx` to `real_script_start`, we should only have the GLOBAL closing divs.
        # How many? Likely 3.
        # Let's force it to be 3.
        
        chunk = content[abs_end_idx:real_script_start]
        # Identify how many were there?
        # Verify if 3 is correct.
        # <main> <section> <div container> <div grid>
        # Cards...
        # </div> (grid) </div> (container) </div> (section) </main>?
        # Usually checking `grep` output showed 3 indented ones.
        
        replacement = '\n\n            </div>\n        </div>\n    </div>\n\n    '
        
        new_content = content[:abs_end_idx] + replacement + content[real_script_start:]
        
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("Fixed tail closing divs.")
    else:
        print("Could not find Card 6 end.")

