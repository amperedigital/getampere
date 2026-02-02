import sys
import os

filepath = "deploy/tech-demo.html"

# 1. Update Card Padding (More generous on mobile)
# Old: pt-8 pb-6 pl-6 pr-2 - New: pt-10 pb-8 pl-8 pr-6
old_padding = 'class="relative h-full flex flex-col z-10 pointer-events-auto overflow-hidden pt-8 pb-6 pl-6 lg:pl-8 lg:py-8 pr-2 lg:pr-4"'
new_padding = 'class="relative h-full flex flex-col z-10 pointer-events-auto overflow-hidden pt-10 pb-8 pl-8 pr-6 lg:pl-10 lg:py-10 lg:pr-8"'

# 2. Update Header Margin (Avoid Close Button)
# Old: mr-12 - New: mr-16
old_header_container = 'class="flex flex-col mb-4 border-b border-white/5 pb-2 mr-12"'
new_header_container = 'class="flex flex-col mb-4 border-b border-white/5 pb-4 mr-16"'

# 3. Update Header Size (Smaller minimum clamp)
# Old: text-[clamp(1.25rem,3cqmin,1.75rem)] - New: text-[clamp(1.1rem,2.5cqmin,1.75rem)]
old_header_text = 'class="text-[clamp(1.25rem,3cqmin,1.75rem)] font-normal text-white tracking-wide leading-none"'
new_header_text = 'class="text-[clamp(1.1rem,4cqw,1.75rem)] font-normal text-white tracking-wide leading-tight line-clamp-2"'

# 4. Update Metric Grid Spacing (More breathing room)
# Old: gap-y-3 - New: gap-y-5
old_grid = 'class="grid grid-cols-3 gap-y-3 gap-x-4 text-[clamp(0.85rem,1.5cqmin,1.1rem)] @lg:gap-y-2'
new_grid = 'class="grid grid-cols-3 gap-y-5 gap-x-4 text-[clamp(0.85rem,1.5cqmin,1.1rem)] @lg:gap-y-4'

if not os.path.exists(filepath):
    print(f"File not found: {filepath}")
    sys.exit(1)

with open(filepath, 'r') as f:
    content = f.read()

# Apply Replacements
content = content.replace(old_padding, new_padding)
content = content.replace(old_header_container, new_header_container)
content = content.replace(old_header_text, new_header_text)
content = content.replace(old_grid, new_grid)

with open(filepath, 'w') as f:
    f.write(content)

print("Replacements complete.")
