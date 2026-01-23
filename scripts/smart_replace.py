import sys
import os
import shutil

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 smart_replace.py <target_file> <old_clip_path> <new_clip_path> [--force]")
        sys.exit(1)

    target_file = sys.argv[1]
    old_clip_path = sys.argv[2]
    new_clip_path = sys.argv[3]
    force = "--force" in sys.argv

    if not os.path.exists(target_file):
        print(f"Error: Target file {target_file} not found.")
        sys.exit(1)

    # Read all contents
    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()

    with open(old_clip_path, 'r', encoding='utf-8') as f:
        old_text = f.read()

    with open(new_clip_path, 'r', encoding='utf-8') as f:
        new_text = f.read()

    # 1. Uniqueness Check
    count = content.count(old_text)
    if count == 0:
        print("Error: 'Old text' not found in file. Check whitespace or context.")
        print(f"--- Search text start ---\n{old_text[:100]}\n-------------------------")
        sys.exit(1)
    if count > 1:
        print(f"Error: 'Old text' found {count} times. Context is not unique. Please provide more context.")
        sys.exit(1)

    # 2. Safety Check: Dangerous Deletions
    old_lines = old_text.splitlines()
    new_lines = new_text.splitlines()
    
    # Calculate net change
    line_delta = len(new_lines) - len(old_lines)
    
    # Thresholds
    LARGE_DELETION_THRESHOLD = -15  # Alert if removing > 15 lines net
    
    if line_delta < LARGE_DELETION_THRESHOLD and not force:
        print(f"\n[SAFETY BLOCK] This edit removes {abs(line_delta)} lines (net).")
        print(f"Old block size: {len(old_lines)} lines")
        print(f"New block size: {len(new_lines)} lines")
        print("This looks like a potential accidental deletion.")
        print("Action: Aborted. Use --force to override if this is intentional.\n")
        sys.exit(1)

    # 3. Apply Replacement
    new_content = content.replace(old_text, new_text)

    # 4. Backup
    backup_path = target_file + ".bak"
    shutil.copy2(target_file, backup_path)
    
    # 5. Write
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Success: Updated {target_file}.")
    print(f"Backup saved to {backup_path}")
    print(f"Lines changed: {line_delta}")

if __name__ == "__main__":
    main()
