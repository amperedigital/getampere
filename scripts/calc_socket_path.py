
import math

def calculate_socket_path():
    # Configuration (in Pixels, assuming 16px rem)
    rem = 16
    button_r = 1.5 * rem     # 24px (w-12)
    padding = 0.5 * rem      # 8px (p-2) - distance from edge of button to edge of card 'socket'
    
    # Wait, 'padding' in 'stamped inside' usually means the gap.
    # User said "uniform spacing". 
    # Let's target a Gap of 0.5rem (8px).
    
    gap = 0.5 * rem # 8px
    
    socket_r = button_r + gap # 24 + 8 = 32px
    
    # Fillet (The smooth turn from straight edge into the socket)
    fillet_r = 1.0 * rem     # 16px
    
    # Button Position (Center relative to Top-Right Corner (0,0))
    # CSS: top-2 right-2 (0.5rem)
    # Center is at inset + button_r
    # x = -(0.5 * 16 + 24) = -32
    # y = (0.5 * 16 + 24) = 32
    # C_s = (-32, 32)
    
    cx_s = -32
    cy_s = 32
    
    # Calculate Tangent Geometry
    # Circle 1: Fillet centered at (-x_f, fillet_r)
    # Circle 2: Socket centered at (-32, 32) radius socket_r
    # Distance = fillet_r + socket_r
    
    # (cx_s - cx_f)^2 + (cy_s - cy_f)^2 = (R + r)^2
    # (-32 - cx_f)^2 + (32 - 16)^2 = (32 + 16)^2
    # (-32 - cx_f)^2 + 16^2 = 48^2
    # (-32 - cx_f)^2 + 256 = 2304
    # (-32 - cx_f)^2 = 2048
    # abs(-32 - cx_f) = 45.2548
    
    # cx_f must be to the left of cx_s (more negative)
    # -32 - cx_f = 45.2548 => cx_f = -32 - 45.2548 = -77.2548
    
    cx_f = -77.2548
    cy_f = 16.0
    
    # Tangent Point P1 (Fillet to Socket)
    # Vector C_f -> C_s
    vx = cx_s - cx_f # -32 - (-77.25) = 45.25
    vy = cy_s - cy_f # 32 - 16 = 16
    dist = math.sqrt(vx*vx + vy*vy) # Should be 48
    
    # P1 = C_f + (fillet_r / dist) * V
    ratio = fillet_r / dist # 16/48 = 1/3
    
    p1_x = cx_f + ratio * vx
    p1_y = cy_f + ratio * vy
    
    # Symmetry for P2 (Socket to Fillet 2)
    # Reflection across x = -y (Diagonal top-right to bottom-left implies x,y swap with signs? No.)
    # The setup is symmetric around the line connecting (0,0) to (-32, 32).
    # Since cy_s = -cx_s, symmetry maps (x,y) -> (-y, -x).
    
    # Let's verify symmetry transform:
    # Top edge point: (-77.25, 0)
    # Right edge point should be: (0, 77.25)
    # P1: (-62.17, 21.33)
    # P2: (-21.33, 62.17)
    
    p2_x = -p1_y
    p2_y = -p1_x 
    
    # Path Construction
    # Start: Left Edge (-150, 0)
    # Line to Fillet Start (-77.25, 0)
    # Arc (Fillet): Radius 16, End P1. Sweep 1 (Clockwise for external corner? No. 
    #   Moving Right on Top Edge. Normal is Down. Center is below.
    #   Arc turns Right (into the solid). Yes, Sweep 1.
    # Arc (Socket): Radius 32. End P2. 
    #   Entering concave hole. Concave turn. Sweep 0 (Counter-Clockwise).
    # Arc (Fillet 2): Radius 16. End (0, 77.25). Sweep 1.
    # Line to Bottom (0, 150).
    
    path_d = f"M -300 0 L {cx_f:.2f} 0 A {fillet_r} {fillet_r} 0 0 1 {p1_x:.2f} {p1_y:.2f} A {socket_r} {socket_r} 0 0 0 {p2_x:.2f} {p2_y:.2f} A {fillet_r} {fillet_r} 0 0 1 0 {-cx_f:.2f} L 0 300"
    
    # Also generate the 'Close Shape' for the mask (add the rest of the box)
    # Assuming box is large enough.
    mask_path = path_d + " L -300 300 L -300 0 Z"
    
    print("Path Definition:")
    print(path_d)
    return path_d

path = calculate_socket_path()
