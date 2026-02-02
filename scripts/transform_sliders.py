import re

file_path = 'deploy/tech-demo.html'

# CSS Shadow Map for styling the active LEDs
# Maps Tailwind color class -> RGBA Shadow value
COLOR_MAP = {
    'bg-blue-500': 'rgba(59,130,246,0.6)',
    'bg-blue-400': 'rgba(96,165,250,0.6)', 
    'bg-red-400': 'rgba(248,113,113,0.6)',
    'bg-emerald-500': 'rgba(10,185,129,0.6)', # Emerald-500 is 16,185,129
    'bg-blue-300': 'rgba(147,197,253,0.6)',
    'bg-indigo-400': 'rgba(129,140,248,0.6)'
}

# The Target Regex
# Matches existing simplified bars: <div class="h-1 w-full bg-slate-800 ..."><div class="h-full bg-color w-percent"></div></div>
# We capture the Color and the Width
PATTERN = re.compile(
    r'<div class="flex items-center">\s*<div class="h-1 w-full bg-slate-800 rounded-full overflow-hidden">\s*<div class="h-full ([\w-]+) (w-\[[\d%]+\])"></div>\s*</div>\s*</div>'
)

def replace_slider(match):
    color_class = match.group(1)
    width_class = match.group(2)
    
    shadow_color = COLOR_MAP.get(color_class, 'rgba(255,255,255,0.5)') # Default fallback
    
    # New LED Glass Slider Structure
    # 1. Container: h-3 (12px), bg-white/5 (Glass), Rounded-sm (Bevel), Border (Edge)
    # 2. Pattern: Repeating Gradient creates the "Gap" between LED blocks (8px block, 2px gap)
    # 3. Active Bar: Uses the captured width & color, adds Glow
    
    new_html = f'''<div class="flex items-center">
    <!-- LED Glass Range Slider -->
    <div class="relative w-full h-3 rounded-[1px] bg-white/5 overflow-hidden shadow-inner border border-white/10">
        <!-- Active Bar (Lit LEDs) -->
        <div class="absolute inset-y-0 left-0 {color_class} shadow-[0_0_8px_{shadow_color}] {width_class} transition-all duration-500"></div>
        
        <!-- Segmentation Mask (The Gaps) -->
        <!-- 8px Block, 2px Gap = 10px Repeat -->
        <div class="absolute inset-0 w-full h-full pointer-events-none z-10" 
             style="background-image: repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.8) 8px, rgba(0,0,0,0.8) 10px);">
        </div>
        
        <!-- Surface Shine (Top Glass Refraction) -->
        <div class="absolute inset-0 w-full h-full pointer-events-none z-20 bg-gradient-to-b from-white/10 to-transparent mix-blend-overlay"></div>
    </div>
</div>'''
    return new_html

with open(file_path, 'r') as f:
    content = f.read()

# Execute Replacement
new_content = PATTERN.sub(replace_slider, content)

# Check if changes happened
if new_content != content:
    with open(file_path, 'w') as f:
        f.write(new_content)
    print(f"Successfully transformed sliders in {file_path}")
else:
    print("No sliders matched the pattern. Check regex.")
