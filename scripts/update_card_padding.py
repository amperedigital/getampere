import sys
import os

filepath = "deploy/tech-demo.html"
# The exact string found in the grep output
old_str = 'class="relative h-full flex flex-col z-10 pointer-events-auto overflow-hidden pl-4 py-4 lg:pl-8 lg:py-8 pr-2 lg:pr-4"'
# The new string with updated padding: pt-8 (2rem), pb-6 (1.5rem), pl-6 (1.5rem). 
# Keeping pr-2 and lg variants as is.
new_str = 'class="relative h-full flex flex-col z-10 pointer-events-auto overflow-hidden pt-8 pb-6 pl-6 pr-2 lg:pl-8 lg:py-8 lg:pr-4"'

if not os.path.exists(filepath):
    print(f"File not found: {filepath}")
    sys.exit(1)

with open(filepath, 'r') as f:
    content = f.read()

count = content.count(old_str)
print(f"Found {count} occurrences.")

if count > 0:
    new_content = content.replace(old_str, new_str)
    with open(filepath, 'w') as f:
        f.write(new_content)
    print("Replaced all occurrences.")
else:
    print("No occurrences found. Checking for partial matches or whitespace issues...")
    # debug print a snippet
    idx = content.find("relative h-full flex flex-col z-10 pointer-events-auto overflow-hidden")
    if idx != -1:
        print(f"File snippet: {content[idx:idx+120]}")
    else:
        print("Could not even find the prefix.")

