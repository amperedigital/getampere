#!/usr/bin/env python3
import sys
import re
import os

def replace_element_by_id(file_path, target_id, new_content):
    """
    Replaces an HTML element's content by ID, respecting nested tags.
    Strategy:
    1. Find the tag with the ID.
    2. Determine the tag type (div, section, ul, etc.).
    3. Iterate forward counting opening/closing tags of that same type to find the true end.
    4. Replace the content.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: File {file_path} not found.")
        sys.exit(1)

    # 1. Find the tag definition 
    # Matches: <tag ... id="target_id" ... > or <tag ... id='target_id' ... >
    # We capture the tag name (group 1) and the full match end index.
    pattern = re.compile(rf'<(\w+)[^>]*\bid=["\']{target_id}["\'][^>]*>', re.IGNORECASE)
    match = pattern.search(content)

    if not match:
        print(f"Error: Element with id='{target_id}' not found in {file_path}")
        sys.exit(1)

    tag_name = match.group(1)
    start_index = match.start()
    content_start_index = match.end()
    
    # 2. Find the matching closing tag
    # We scan starting from the end of the opening tag
    nesting_level = 1
    
    # Regex to find opening or closing tags of the SAME type
    # <div or </div
    tag_pattern = re.compile(rf'(<{tag_name}[^>]*>)|(</{tag_name}>)', re.IGNORECASE)
    
    current_pos = content_start_index
    close_tag_end_index = -1

    while True:
        tag_match = tag_pattern.search(content, current_pos)
        if not tag_match:
            break
        
        if tag_match.group(1): # Opening tag
            nesting_level += 1
        elif tag_match.group(2): # Closing tag
            nesting_level -= 1
        
        current_pos = tag_match.end()
        
        if nesting_level == 0:
            close_tag_end_index = tag_match.end()
            break

    if nesting_level != 0:
        print(f"Error: unbalanced tags. Could not find closing </{tag_name}> for id='{target_id}'")
        sys.exit(1)

    # 3. Construct new content
    # We keep the original file content up to the element's start
    # We insert the NEW content
    # We append the original file content after the element's end
    
    # Note: If we want to replace the WHOLE element (including outer tags), we use start_index to close_tag_end_index.
    # If the user passed raw content that includes the container, we replace the whole thing.
    # This script assumes 'new_content' REPLACES the element entirely.
    
    updated_file_content = content[:start_index] + new_content + content[close_tag_end_index:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated_file_content)
    
    print(f"Successfully replaced element #{target_id} in {file_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 safe_replace_html.py <file_path> <target_id> <new_content_string_or_file>")
        sys.exit(1)
        
    f_path = sys.argv[1]
    t_id = sys.argv[2]
    content_arg = sys.argv[3]
    
    # Check if content_arg is a file path
    replacement_text = content_arg
    if os.path.exists(content_arg):
         with open(content_arg, 'r', encoding='utf-8') as cf:
             replacement_text = cf.read()
    
    replace_element_by_id(f_path, t_id, replacement_text)
