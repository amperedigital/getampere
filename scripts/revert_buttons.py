
import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'

with open(file_path, 'r') as f:
    content = f.read()

# Revert Expand Trigger from Vertical Stack (top-20 right-5) to Horizontal (top-5 right-20)
# This places it to the left of the Main Icon (top-5 right-5)
content = content.replace('expand-trigger absolute top-20 right-5', 'expand-trigger absolute top-5 right-20')

with open(file_path, 'w') as f:
    f.write(content)

print("Buttons reverted to horizontal layout successfully.")
