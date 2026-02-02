import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Update Grid Text Size (Metric Body)
# Old: text-[10px] @lg:text-sm
# New: text-[3.5cqw] (Scales with width)
content = content.replace('text-[10px] @lg:text-sm', 'text-[3.5cqw]')

# 2. Update Card Titles
# Old: <h3 class="text-sm font-normal text-white tracking-wide">
# New: <h3 class="text-[5cqw] font-normal text-white tracking-wide leading-none">
# Note: Using regex to be safe about spacing
content = re.sub(
    r'<h3 class="text-sm font-normal text-white tracking-wide">',
    r'<h3 class="text-[5cqw] font-normal text-white tracking-wide leading-none">',
    content
)

# 3. Update Card Subtitles
# Old: <p class="text-xs text-slate-500 mt-0.5">
# New: <p class="text-[3.5cqw] text-slate-500 mt-1 leading-tight">
content = re.sub(
    r'<p class="text-xs text-slate-500 mt-0.5">',
    r'<p class="text-[3.5cqw] text-slate-500 mt-1 leading-tight">',
    content
)

# 4. Update Metric Headers
# Old: text-[8px]
# New: text-[2.5cqw]
# We target the specific combo to avoid accidents
content = content.replace('text-slate-600 uppercase tracking-wider text-[8px]', 'text-slate-600 uppercase tracking-wider text-[2.5cqw]')

with open(file_path, 'w') as f:
    f.write(content)

print("Updated typography to use Container Queries (cqw)")
