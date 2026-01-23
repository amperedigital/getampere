import os

file_path = 'deploy/index.html'

with open(file_path, 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
removed_count = 0

for i, line in enumerate(lines):
    stripped = line.strip()
    
    # Detect start of the block
    if '<style>' in stripped:
        # Check if the next few lines look like the shiny-cta block
        # We need to be careful about bounds
        is_shiny_block = False
        if i + 1 < len(lines):
            next_line = lines[i+1].strip()
            if '@property --gradient-angle' in next_line:
                is_shiny_block = True
    
        if is_shiny_block:
            skip = True
            removed_count += 1
            print(f"Removing block starting at line {i+1}")
            continue

    if skip:
        if '</style>' in stripped:
            skip = False
            print(f"Block ended at line {i+1}")
        continue

    new_lines.append(line)

print(f"Removed {removed_count} blocks.")

with open(file_path, 'w') as f:
    f.writelines(new_lines)
