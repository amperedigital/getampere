
import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

# Find the LAST script tag (Init Script) or the start of the inline script.
# `grep` showed `<script type="module">`.
target = '<script type="module">'

if target in content:
    content = content.replace(target, '</div>\n        </div>\n    </div>\n\n' + target)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Injected 3 closing divs before script.")
else:
    print("Target script tag not found.")
