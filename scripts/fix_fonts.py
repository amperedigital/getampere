import sys

def optimize_fonts():
    file_path = 'deploy/index.html'
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    # Define start and end markers
    # We want to remove everything from 'all-fonts-link-font-geist' down to 'all-fonts-style-font-oswald'
    # And replace it with a single clean link.
    
    start_idx = -1
    end_idx = -1
    
    for i, line in enumerate(lines):
        if 'id="all-fonts-link-font-geist"' in line and start_idx == -1:
            start_idx = i
        if 'id="all-fonts-style-font-oswald"' in line:
            end_idx = i
            
    if start_idx != -1 and end_idx != -1:
        print(f"Found font block: Lines {start_idx+1} to {end_idx+1}")
        
        # New optimized link (Geist + Geist Mono + Newsreader + Space Grotesk)
        new_tag = '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@300..700&family=Newsreader:ital,opsz,wght@1,6..72,200..800&family=Space+Grotesk:wght@300..700&display=swap">\n'
        
        # Keep lines before start_idx, insert new tag, keep lines after end_idx (end_idx line contains the closing </style> usually?)
        # Let's check the grep output... line 502 was the start of the style tag.
        # It's safer to remove the whole range.
        
        new_lines = lines[:start_idx] + [new_tag] + lines[end_idx+1:]
        
        with open(file_path, 'w') as f:
            f.writelines(new_lines)
        print("Successfully replaced font chaos with optimized link.")
    else:
        print("Could not find start/end markers.")

if __name__ == "__main__":
    optimize_fonts()
