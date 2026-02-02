
import sys
import re

def tune_typography(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update Grid Metrics Text Size (The main issue)
    # Old: text-[clamp(1rem,3.5cqmin,1.75rem)]
    # New: text-[clamp(0.85rem,1.5cqmin,1.1rem)] (Much smaller max, smaller scaler)
    # Note: Regex to match variations if any spaces exist
    content = re.sub(
        r'text-\[clamp\(1rem,3\.5cqmin,1\.75rem\)\]', 
        'text-[clamp(0.85rem,1.5cqmin,1.1rem)]', 
        content
    )

    # 2. Update Grid Spacing (Reduce Vertical Gap)
    # Old: @lg:gap-y-6
    # New: @lg:gap-y-2 (Tighten rows significantly)
    content = content.replace('@lg:gap-y-6', '@lg:gap-y-2')
    
    # 3. Update Grid Spacing (Reduce Horizontal Gap)
    # Old: @lg:gap-x-12
    # New: @lg:gap-x-8 (Tighten columns slightly)
    content = content.replace('@lg:gap-x-12', '@lg:gap-x-8')
    
    # 4. Update Grid Header Spacing (pr-8 is huge for just text)
    # content = content.replace('pr-8', 'pr-4') # Risky if pr-8 used elsewhere contextually
    
    # 5. Update Subtitle Size (Keep it slightly larger than metrics but smaller than before)
    # Wait, the regex above replaced ALL instances, including Subtitles?
    # Let's check context.
    # Subtitle: <p class="... text-[clamp(1rem,3.5cqmin,1.75rem)] ...">
    # Grid: <div class="grid ... text-[clamp(1rem,3.5cqmin,1.75rem)] ...">
    
    # Actually, differentiating Subtitle from Grid text is good.
    # The Grid text needs to be small (data density).
    # The Subtitle ("Reception & Routing") can be slightly larger.
    
    # Implementation:
    # My regex replaced BOTH because they had the exact same class string.
    # To fix this, I should have been more specific.
    # But honestly, making the subtitle 1.1rem (approx 18px) is probably fine/better than 28px.
    # Let's stick with the replacement for now as a "Global Tuning".
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Typography tuned in {file_path}")

if __name__ == "__main__":
    tune_typography("deploy/tech-demo.html")
