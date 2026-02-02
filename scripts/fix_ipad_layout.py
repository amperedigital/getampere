import re

file_path = 'deploy/tech-demo.html'

with open(file_path, 'r') as f:
    content = f.read()

# 1. Padding Logic Adjustment
# Current: p-6 pb-16 lg:p-8
# New: p-6 pb-16 lg:p-5 xl:p-8
# This gives the tight columns on 1024px (iPad Pro) less internal padding (1.25rem vs 2rem).
content = content.replace('p-6 pb-16 lg:p-8', 'p-6 pb-16 lg:p-5 xl:p-8')

# 2. Typography Logic Adjustment (Revert CQW to Tailwind for stability)
# Card Title: text-[5cqw] -> text-lg lg:text-xl
content = re.sub(
    r'text-\[5cqw\]',
    r'text-lg lg:text-xl',
    content
)

# Card Subtitle: text-[3.5cqw] -> text-sm lg:text-base
# This matches the first occurrence in the header text
content = re.sub(
    r'<p class="text-\[3.5cqw\] text-slate-500 mt-1 leading-tight">',
    r'<p class="text-sm lg:text-base text-slate-500 mt-1 leading-tight">',
    content
)

# Grid Container Text (Body): text-[3.5cqw] -> text-xs lg:text-sm
content = re.sub(
    r'grid grid-cols-3 gap-y-3 gap-x-4 text-\[3.5cqw\]',
    r'grid grid-cols-3 gap-y-3 gap-x-4 text-xs lg:text-sm',
    content
)

# Grid Headers (Metric Label): text-[2.5cqw] -> text-[10px] lg:text-xs
content = re.sub(
    r'text-slate-600 uppercase tracking-wider text-\[2.5cqw\]',
    r'text-slate-600 uppercase tracking-wider text-[10px] lg:text-xs',
    content
)

with open(file_path, 'w') as f:
    f.write(content)

print("Applied iPad Pro padding fix and typography scaling updates.")
