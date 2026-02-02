
import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

markers = [
    '<!-- Card 2: Demo Guide -->',
    '<!-- Card 3: Onboarding Coach -->',
    '<!-- Card 4: Technical Specialist -->',
    '<!-- Card 5: Sales Advisor -->',
    '<!-- Card 6: Booking Agent -->',
    '<!-- Init Script -->'
]

for m in markers:
    # Replace marker with `</div>\n` + marker
    # But check if it already has one?
    # The file has `</div>\n<!-- Card ...`.
    # We want `</div>\n</div>\n<!-- Card ...`.
    # Let's blindly add it.
    # Validation will tell us if we have too many.
    # But right now we have UNCLOSED elements (too few).
    
    content = content.replace(m, '</div>\n' + m)

with open(file_path, 'w') as f:
    f.write(content)

print("Injected 1 closing div before each marker.")
