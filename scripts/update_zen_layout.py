import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Typography Replacements (Relaxing the clamps)
# Header
content = content.replace('text-[min(5cqw,1.5rem)]', 'text-[clamp(1.5rem,5cqw,2.5rem)]')

# Subheader & Grid Content
content = content.replace('text-[min(3.5cqw,1.1rem)]', 'text-[clamp(1rem,3.5cqw,1.75rem)]')

# Metric Labels
content = content.replace('text-[min(2.5cqw,0.8rem)]', 'text-[clamp(0.75rem,2.5cqw,1.25rem)]')

# 2. Button Positioning Replacements
# Main Glass Button: Move to top-5 right-5 (Standard corner)
# Current: absolute top-4 right-6 w-14 h-14
content = content.replace('absolute top-4 right-6 w-14 h-14', 'absolute top-5 right-5 w-14 h-14')

# Expand Trigger: Move to top-20 right-5 (Stacked vertically below main button)
# Current: expand-trigger absolute top-6 right-22
content = content.replace('expand-trigger absolute top-6 right-22', 'expand-trigger absolute top-20 right-5')

with open(file_path, 'w') as f:
    f.write(content)

print("Updates applied successfully.")
