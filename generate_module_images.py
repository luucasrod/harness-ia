#!/usr/bin/env python3
"""Generate 11 module card SVG images for Harness IA dashboard."""

import os
from pathlib import Path

# Color scheme
DARK_BG = "#0F1117"
BLUE = "#0066FF"
BLUE_HOVER = "#0052CC"
WHITE = "#FFFFFF"
GRAY = "#A0A0A0"
DARK_GRAY = "#2D2D2D"

modules = [
    {
        "name": "engineering-foundations",
        "title": "Engineering Foundations",
        "icon": "blueprint",
        "color": BLUE,
    },
    {
        "name": "react-frontend",
        "title": "React & Frontend",
        "icon": "components",
        "color": BLUE,
    },
    {
        "name": "nodejs-express",
        "title": "Node.js & Express",
        "icon": "server",
        "color": BLUE,
    },
    {
        "name": "databases",
        "title": "Databases",
        "icon": "database",
        "color": BLUE,
    },
    {
        "name": "caching-realtime",
        "title": "Caching & Real-time",
        "icon": "lightning",
        "color": BLUE,
    },
    {
        "name": "testing-qa",
        "title": "Testing & QA",
        "icon": "checkmark",
        "color": BLUE,
    },
    {
        "name": "solid-patterns",
        "title": "SOLID & Patterns",
        "icon": "patterns",
        "color": BLUE,
    },
    {
        "name": "system-design",
        "title": "System Design",
        "icon": "architecture",
        "color": BLUE,
    },
    {
        "name": "devops-containers",
        "title": "DevOps & Containers",
        "icon": "containers",
        "color": BLUE,
    },
    {
        "name": "claude-ai",
        "title": "Claude AI Integration",
        "icon": "ai",
        "color": BLUE,
    },
    {
        "name": "capstone-project",
        "title": "Capstone Project",
        "icon": "trophy",
        "color": BLUE,
    },
]

def create_svg(module):
    """Create an SVG for a module."""
    name = module["name"]
    icon = module["icon"]
    color = module["color"]

    # SVG templates for each icon type
    icons = {
        "blueprint": '''
            <g id="blueprint-icon" transform="translate(280, 160)">
                <rect x="-60" y="-50" width="120" height="100" fill="none" stroke="{color}" stroke-width="2" opacity="0.3"/>
                <circle cx="-30" cy="-25" r="8" fill="{color}" opacity="0.5"/>
                <circle cx="30" cy="-25" r="8" fill="{color}" opacity="0.5"/>
                <circle cx="-30" cy="25" r="8" fill="{color}" opacity="0.5"/>
                <circle cx="30" cy="25" r="8" fill="{color}" opacity="0.5"/>
                <line x1="-30" y1="-25" x2="30" y2="-25" stroke="{color}" stroke-width="1" opacity="0.3"/>
                <line x1="-30" y1="25" x2="30" y2="25" stroke="{color}" stroke-width="1" opacity="0.3"/>
                <line x1="-30" y1="-25" x2="-30" y2="25" stroke="{color}" stroke-width="1" opacity="0.3"/>
                <line x1="30" y1="-25" x2="30" y2="25" stroke="{color}" stroke-width="1" opacity="0.3"/>
            </g>
        ''',
        "components": '''
            <g id="components-icon" transform="translate(280, 160)">
                <rect x="-50" y="-40" width="40" height="40" fill="{color}" opacity="0.3" rx="4"/>
                <rect x="10" y="-40" width="40" height="40" fill="{color}" opacity="0.5" rx="4"/>
                <rect x="-30" y="10" width="60" height="30" fill="{color}" opacity="0.3" rx="4"/>
                <rect x="-50" y="-40" width="40" height="40" fill="none" stroke="{color}" stroke-width="2" rx="4"/>
                <rect x="10" y="-40" width="40" height="40" fill="none" stroke="{color}" stroke-width="2" rx="4"/>
                <rect x="-30" y="10" width="60" height="30" fill="none" stroke="{color}" stroke-width="2" rx="4"/>
            </g>
        ''',
        "server": '''
            <g id="server-icon" transform="translate(280, 160)">
                <rect x="-50" y="-50" width="100" height="25" fill="{color}" opacity="0.3" rx="2"/>
                <rect x="-50" y="-20" width="100" height="25" fill="{color}" opacity="0.5" rx="2"/>
                <rect x="-50" y="10" width="100" height="25" fill="{color}" opacity="0.3" rx="2"/>
                <circle cx="-35" cy="-37" r="3" fill="{color}"/>
                <circle cx="-35" cy="-7" r="3" fill="{color}"/>
                <circle cx="-35" cy="23" r="3" fill="{color}"/>
            </g>
        ''',
        "database": '''
            <g id="database-icon" transform="translate(280, 160)">
                <ellipse cx="0" cy="-40" rx="50" ry="20" fill="{color}" opacity="0.3"/>
                <ellipse cx="0" cy="-40" rx="50" ry="20" fill="none" stroke="{color}" stroke-width="2"/>
                <path d="M -50 -40 L -50 20 Q 0 50 50 20 L 50 -40" fill="none" stroke="{color}" stroke-width="2" opacity="0.5"/>
                <ellipse cx="0" cy="20" rx="50" ry="20" fill="{color}" opacity="0.3"/>
                <line x1="0" y1="-30" x2="0" y2="30" stroke="{color}" stroke-width="1" opacity="0.3"/>
            </g>
        ''',
        "lightning": '''
            <g id="lightning-icon" transform="translate(280, 160)">
                <path d="M 0 -50 L -20 -10 L 10 -10 L -10 40 L 30 0 L 0 0 Z" fill="{color}" opacity="0.5"/>
                <path d="M 0 -50 L -20 -10 L 10 -10 L -10 40 L 30 0 L 0 0 Z" fill="none" stroke="{color}" stroke-width="2"/>
                <circle cx="0" cy="0" r="60" fill="none" stroke="{color}" stroke-width="1" opacity="0.2"/>
            </g>
        ''',
        "checkmark": '''
            <g id="checkmark-icon" transform="translate(280, 160)">
                <circle cx="0" cy="0" r="50" fill="{color}" opacity="0.2"/>
                <circle cx="0" cy="0" r="50" fill="none" stroke="{color}" stroke-width="2"/>
                <path d="M -20 5 L 0 25 L 30 -15" fill="none" stroke="{color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
        ''',
        "patterns": '''
            <g id="patterns-icon" transform="translate(280, 160)">
                <rect x="-40" y="-40" width="30" height="30" fill="{color}" opacity="0.3" rx="2"/>
                <rect x="10" y="-40" width="30" height="30" fill="{color}" opacity="0.5" rx="2"/>
                <rect x="-40" y="10" width="30" height="30" fill="{color}" opacity="0.5" rx="2"/>
                <rect x="10" y="10" width="30" height="30" fill="{color}" opacity="0.3" rx="2"/>
                <line x1="-25" y1="-40" x2="-25" y2="40" stroke="{color}" stroke-width="1" opacity="0.3"/>
                <line x1="-40" y1="-25" x2="40" y2="-25" stroke="{color}" stroke-width="1" opacity="0.3"/>
            </g>
        ''',
        "architecture": '''
            <g id="architecture-icon" transform="translate(280, 160)">
                <rect x="-60" y="-50" width="40" height="40" fill="{color}" opacity="0.3"/>
                <rect x="20" y="-50" width="40" height="40" fill="{color}" opacity="0.3"/>
                <rect x="-20" y="10" width="40" height="40" fill="{color}" opacity="0.5"/>
                <line x1="-40" y1="-10" x2="-20" y2="10" stroke="{color}" stroke-width="2" opacity="0.5"/>
                <line x1="40" y1="-10" x2="0" y2="10" stroke="{color}" stroke-width="2" opacity="0.5"/>
            </g>
        ''',
        "containers": '''
            <g id="containers-icon" transform="translate(280, 160)">
                <rect x="-55" y="-40" width="45" height="80" fill="{color}" opacity="0.3" rx="3"/>
                <rect x="10" y="-40" width="45" height="80" fill="{color}" opacity="0.5" rx="3"/>
                <line x1="-55" y1="-20" x2="55" y2="-20" stroke="{color}" stroke-width="1" opacity="0.3"/>
                <line x1="-55" y1="0" x2="55" y2="0" stroke="{color}" stroke-width="1" opacity="0.3"/>
                <line x1="-55" y1="20" x2="55" y2="20" stroke="{color}" stroke-width="1" opacity="0.3"/>
            </g>
        ''',
        "ai": '''
            <g id="ai-icon" transform="translate(280, 160)">
                <circle cx="-20" cy="-20" r="15" fill="{color}" opacity="0.3"/>
                <circle cx="20" cy="-20" r="15" fill="{color}" opacity="0.3"/>
                <circle cx="0" cy="20" r="15" fill="{color}" opacity="0.5"/>
                <line x1="-20" y1="-5" x2="0" y2="5" stroke="{color}" stroke-width="2" opacity="0.5"/>
                <line x1="20" y1="-5" x2="0" y2="5" stroke="{color}" stroke-width="2" opacity="0.5"/>
                <circle cx="-20" cy="-20" r="15" fill="none" stroke="{color}" stroke-width="1.5"/>
                <circle cx="20" cy="-20" r="15" fill="none" stroke="{color}" stroke-width="1.5"/>
                <circle cx="0" cy="20" r="15" fill="none" stroke="{color}" stroke-width="1.5"/>
            </g>
        ''',
        "trophy": '''
            <g id="trophy-icon" transform="translate(280, 160)">
                <path d="M -30 -30 L -30 10 Q -30 40 0 45 Q 30 40 30 10 L 30 -30" fill="{color}" opacity="0.3"/>
                <path d="M -30 -30 L -30 10 Q -30 40 0 45 Q 30 40 30 10 L 30 -30" fill="none" stroke="{color}" stroke-width="2"/>
                <rect x="-40" y="-35" width="80" height="8" fill="{color}" opacity="0.3" rx="2"/>
                <line x1="-15" y1="45" x2="-15" y2="30" stroke="{color}" stroke-width="2"/>
                <line x1="15" y1="45" x2="15" y2="30" stroke="{color}" stroke-width="2"/>
                <path d="M -20 20 L 0 10 L 20 20" fill="{color}" opacity="0.5"/>
            </g>
        ''',
    }

    # Get the icon SVG
    icon_svg = icons.get(icon, icons["blueprint"])
    icon_svg = icon_svg.format(color=color)

    # Create full SVG
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
    <!-- Background -->
    <rect width="640" height="360" fill="{DARK_BG}"/>

    <!-- Gradient overlay for depth -->
    <defs>
        <radialGradient id="grad-{name}" cx="50%" cy="50%" r="60%">
            <stop offset="0%" style="stop-color:{color};stop-opacity:0.1" />
            <stop offset="100%" style="stop-color:{color};stop-opacity:0" />
        </radialGradient>
    </defs>

    <!-- Gradient -->
    <rect width="640" height="360" fill="url(#grad-{name})"/>

    <!-- Icon -->
    {icon_svg}

    <!-- Bottom accent line -->
    <line x1="50" y1="330" x2="590" y2="330" stroke="{color}" stroke-width="2" opacity="0.5"/>
</svg>'''

    return svg

# Generate all SVGs
output_dir = Path("A:/Projetos Lucas/Curso Engenharia Harness IA/public/module-images")
output_dir.mkdir(parents=True, exist_ok=True)

for i, module in enumerate(modules, 1):
    svg_content = create_svg(module)
    file_path = output_dir / f"{module['name']}.svg"

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(svg_content)

    print(f"[OK] Created {i:2d}/11: {module['title']:30s} -> {file_path.name}")

print("\n[DONE] All 11 module images generated!")
print(f"📁 Location: {output_dir}")
