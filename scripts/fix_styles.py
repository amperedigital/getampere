
import re
import sys

file_path = 'deploy/tech-demo.html'

try:
    with open(file_path, 'r') as f:
        content = f.read()

    # The pattern we created by accident:
    # <div ... style="transform... backdrop-filter;"
    #      style="clip-path..."
    
    # Actually, my previous sed command `sed -i 's/style="clip-path: polygon(//g'` might have left `( ...` dangling or removed the style tag but kept the newline.
    # Let's verify what the sed command actually did.
    # It replaced `style="clip-path: polygon(` with nothing.
    # So the file likely looks like:
    # ... style="...filter;"
    #      
    #          0 0,
    
    # Wait, the `style=` constraint is gone, so the polygon coords are just text content now? That breaks HTML.
    # I need to restore `clip-path: polygon(` inside the FIRST style tag.
    
    # Let's look for the first style tag which I closed with a quote in the previous sed.
    # `style="...filter;"`
    # And then followed by whitespace and `0 0,` (the start of the polygon).
    
    # Pattern: match the closed style tag, whitespace, and the start of coordinate 0 0
    pattern = r'(style="transform: translate3d\(0,0,0\); backface-visibility: hidden; will-change: backdrop-filter;")(\s+)(0 0,)'
    
    # Replacement: Re-open the style tag, add clip-path, and continue
    # But wait, `clip-path` is not `style="...`.
    # I need to remove the closing quote of the first style, add ` clip-path: polygon(`, and then put the coords back.
    
    replacement = r'style="transform: translate3d(0,0,0); backface-visibility: hidden; will-change: backdrop-filter; clip-path: polygon(\2\3'
    
    new_content = re.sub(pattern, replacement, content)
    
    with open(file_path, 'w') as f:
        f.write(new_content)
        
    print("Fixed style attributes.")

except Exception as e:
    print(f"Error: {e}")
