
import os

def read_file(path):
    with open(path, 'r') as f:
        return f.readlines()

def write_file(path, lines):
    with open(path, 'w') as f:
        f.writelines(lines)

def main():
    deploy_index_path = '/home/drewman/getampere/deploy/index.html'
    index_path = '/home/drewman/getampere/index.html'

    deploy_lines = read_file(deploy_index_path)
    index_lines = read_file(index_path)

    # Extract Tab Flipper section from deploy/index.html
    # Starts at line 1932 (index 1931)
    # Ends at line 2368 (index 2367)
    # I'll look for the specific markers to be safe
    
    start_marker_new = '  <!-- Tab Flipper Section -->'
    end_marker_new = '    <section class="overflow-hidden flex flex-col text-[#E4E4E7] bg-[#0A0A0A] pt-32 pr-0 pb-32 pl-0 relative justify-center border-t border-white/5">'
    
    new_section = []
    in_section = False
    for line in deploy_lines:
        if start_marker_new in line:
            in_section = True
        if end_marker_new in line and in_section:
            in_section = False
            break # We don't include the start of the next section
        if in_section:
            new_section.append(line)

    if not new_section:
        print("Could not find new section in deploy/index.html")
        return

    # Find section to replace in index.html
    # Starts at line 1548: <section class="sm:p-8 bg-blue-50 ...
    # Ends before: <section class="overflow-hidden flex flex-col text-[#E4E4E7] bg-[#0A0A0A] ...
    
    start_marker_old = '<section class="sm:p-8 bg-blue-50 border-zinc-800 border-0 rounded-1xl mt-8 pt-6 pr-6 pb-6 pl-6"'
    end_marker_old = '<section class="overflow-hidden flex flex-col text-[#E4E4E7] bg-[#0A0A0A] pt-32 pr-0 pb-32 pl-0 relative justify-center border-t border-white/5">'

    new_index_lines = []
    skip = False
    found_old = False
    
    for line in index_lines:
        if start_marker_old in line:
            skip = True
            found_old = True
            # Insert new section here
            new_index_lines.extend(new_section)
        
        if end_marker_old in line and skip:
            skip = False
        
        if not skip:
            new_index_lines.append(line)

    if not found_old:
        print("Could not find old section in index.html")
        # Fallback: try to find by line number if markers fail?
        # But markers should work based on read_file output.
        return

    write_file(index_path, new_index_lines)
    print("Successfully updated index.html")

if __name__ == '__main__':
    main()
