
import re

file_path = '/home/drewman/getampere/deploy/tech-demo.html'
with open(file_path, 'r') as f:
    content = f.read()

markers = [
    '<!-- Card 2: Demo Guide -->',
    '<!-- Card 3: Onboarding Coach -->',
    '<!-- Card 4: Technical Specialist -->'
]

for m in markers:
    content = content.replace(m, '</div>\n' + m)

with open(file_path, 'w') as f:
    f.write(content)

print("Injected 2nd closing div before Cards 2, 3, 4.")
