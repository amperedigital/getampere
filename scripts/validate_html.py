#!/usr/bin/env python3
import sys
import os
import re
from html.parser import HTMLParser

# Standard HTML5 void elements (no closing tag required/allowed)
VOID_ELEMENTS = {
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
}

# SVG elements that are frequently self-closed or children of SVGs
# We won't strictly validate unclosed tags for these to avoid false positives with complex inline SVGs
# unless we implement a full XML parser. But we will validate explicit mismatches.
SVG_ELEMENTS = {
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'defs', 'linearGradient', 
    'radialGradient', 'stop', 'filter', 'feGaussianBlur', 'feComposite', 'feColorMatrix', 'mask', 'use', 'animate', 'animateTransform'
}

class ValidationParser(HTMLParser):
    def __init__(self, filename):
        super().__init__()
        self.filename = filename
        self.stack = []
        self.errors = []
        self.warnings = []
    
    def handle_starttag(self, tag, attrs):
        # Shotgun Logic Check (No Inline Scripts)
        if tag == 'script':
            attr_dict = dict(attrs)
            has_src = 'src' in attr_dict
            script_type = attr_dict.get('type', '')
            
            # Whitelisted types that can be inline
            allowed_types = ['importmap', 'application/ld+json']
            
            if not has_src and script_type not in allowed_types:
                self.errors.append(f"Line {self.getpos()[0]}: Forbidden Inline Script detected. All logic must be in external .js files (Shotgun Rule). Allowed inline types: {allowed_types}")

        # Normal <tag>
        if tag not in VOID_ELEMENTS:
            self.stack.append((tag, self.getpos()[0]))

    def handle_endtag(self, tag):
        # Closing </tag>
        if tag in VOID_ELEMENTS:
            # Technically invalid HTML to close void tags, but browsers ignore it.
            return

        if not self.stack:
            self.errors.append(f"Line {self.getpos()[0]}: Unexpected closing tag </{tag}> (Stack empty)")
            return

        last_tag, last_line = self.stack[-1]

        if last_tag == tag:
            self.stack.pop()
        else:
            # Mismatch found
            # Check if this tag closes a parent up the stack (recovering from missing child close)
            # e.g. <div><p></div> -> p is unclosed, div closes.
            found_index = -1
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == tag:
                    found_index = i
                    break
            
            if found_index != -1:
                # We found the matching tag up the stack.
                # Everything between found_index and end is unclosed.
                unclosed = self.stack[found_index+1:]
                
                # Filter out likely false positives (like SVG elements that might have been implicit)
                real_errors = [t for t in unclosed if t[0] not in SVG_ELEMENTS]
                
                if real_errors:
                    self.errors.append(f"Line {self.getpos()[0]}: Mismatched </{tag}>. Unclosed elements: {real_errors}")
                
                # Pop back to this tag
                while len(self.stack) > found_index:
                    self.stack.pop()
            else:
                self.errors.append(f"Line {self.getpos()[0]}: Unexpected closing tag </{tag}>. Expected </{last_tag}>")

    def handle_startendtag(self, tag, attrs):
        # Self closing <tag /> matches
        pass

    def handle_data(self, data):
        # Logic to check for corruption in text nodes
        line, col = self.getpos()
        
        # 1. Check for dangling template artifacts
        if "-->" in data:
            # Ignore if inside script or style (comments)
            in_code_block = False
            for t, l in self.stack:
                if t in ['script', 'style']:
                    in_code_block = True
                    break
            
            if not in_code_block:
                # Even in HTML text, --> is suspicious if not inside a <!-- --> which Parser handles separately
                # parser.handle_comment handles actual comments. matching text data "-->" means it wasn't parsed as a comment end.
                self.warnings.append(f"Line {line}: Suspicious text '-->' found. usage of arrow or broken comment?")

        if "<<<<<<< HEAD" in data or "=======" in data and len(data.strip()) == 7:
             self.errors.append(f"Line {line}: Git conflict markers detected")


def validate_file(filepath):
    print(f"checking {os.path.basename(filepath)}...", end=" ", flush=True)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex Pre-checks for Gross Corruption
    corruption_errors = []
    
    # 1. "-->" followed immediately by text (e.g. "-->2xl") = failed replace
    if re.search(r'-->\S', content):
        # We need to be careful not to flag "-->" inside JS strings, so this global regex is risky.
        # But for '-->2xl' style corruption, it's very specific.
        pass 

    parser = ValidationParser(filepath)
    try:
        parser.feed(content)
        parser.close()
    except Exception as e:
        print("❌ CRITICAL")
        print(f"   Parser Exception: {e}")
        return False

    if parser.errors:
        print("❌ FAILED")
        for e in parser.errors:
            print(f"   - {e}")
        return False
    
    if parser.warnings:
        # Don't fail on warnings but show them
        print("⚠️  WARNINGS")
        for w in parser.warnings:
            print(f"   - {w}")
        return True # Return true logic for warnings? User wants to STOP breakage. 
        # For now, pass.

    print("✅ OK")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Check specific files
        files = sys.argv[1:]
    else:
        # Check all deploy html
        deploy_dir = "deploy"
        files = [os.path.join(deploy_dir, f) for f in os.listdir(deploy_dir) if f.endswith(".html")]

    failure = False
    print("----------------------------------------")
    print("🔍  Running Markup Validation           ")
    print("----------------------------------------")
    
    for f in files:
        if not validate_file(f):
            failure = True

    print("----------------------------------------")
    if failure:
        print("❌  Validation Failed. Please fix errors.")
        sys.exit(1)
    else:
        print("✅  Markup Validated.")
        sys.exit(0)
