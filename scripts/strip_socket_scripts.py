import re
import sys

def strip_socket_scripts(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern: <script> ... updateSocketPath ... </script>
    # DOTALL allows . to match newlines
    # Non-greedy matching for the script tags
    pattern = re.compile(r'<script>\s*.*?updateSocketPath.*?</script>', re.DOTALL | re.IGNORECASE)
    
    matches = pattern.findall(content)
    print(f"Found {len(matches)} socket script blocks.")
    
    new_content = pattern.sub('', content)
    
    # Cleanup extra newlines left behind (optional but nice)
    new_content = re.sub(r'\n\s*\n\s*\n', '\n\n', new_content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Cleaned file saved.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 strip_socket_scripts.py <file>")
        sys.exit(1)
    
    strip_socket_scripts(sys.argv[1])
