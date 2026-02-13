#!/usr/bin/env python3
"""
Parse course data JSON and extract all unique values for key fields.

This script reads the course data JSON file and generates reference files
containing unique values for buildings, classrooms, ptrm values, etc.

Usage:
    python scripts/parse_enums.py

Run this script whenever the course data is updated (e.g., for a new semester).
"""

import json
import os
from datetime import datetime
from collections import defaultdict

# Constants
DATA_FILE = 'src/Data/courses202610.json'
OUTPUT_DIR = 'src/Data/enums'
BUILDING_BLACKLIST = [
    "0", "", " -", "VIRT", "NOREQ", "SALA", "LIGA", "LAB", "FEDELLER", "ES", "FSFB", 
    "HFONTIB", "HLSAMAR", "HLVICT", "HSBOLIV", "HSUBA", "IMI", "MEDLEG", "SVICENP", "ZIPAUF"
]

def load_course_data():
    """Load course data from JSON file."""
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filename, data):
    """Save data to JSON file with metadata."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Generated {filepath}")

def parse_buildings(courses):
    """Extract unique buildings and their human-readable names."""
    buildings = {}
    
    for course in courses:
        for schedule in course.get('schedules', []):
            classroom = schedule.get('classroom', '')
            building_full = schedule.get('building', '')
            
            # Parse building code from classroom format: ".CODE_ROOM"
            if classroom.startswith('.'):
                parts = classroom.split('_')
                if len(parts) >= 2:
                    building_code = parts[0][1:]  # Remove leading dot
                    
                    # Skip blacklisted buildings
                    if building_code in BUILDING_BLACKLIST:
                        continue
                    
                    # Extract readable name from building field
                    # Format is usually ".Full Building Name (CODE)" or just code
                    building_name = building_full
                    if building_full.startswith('.'):
                        building_name = building_full[1:]  # Remove leading dot
                    
                    if building_code not in buildings:
                        buildings[building_code] = building_name
    
    # Sort by code
    sorted_buildings = {k: buildings[k] for k in sorted(buildings.keys())}
    
    return {
        "_metadata": {
            "generated_at": datetime.now().isoformat(),
            "source_file": DATA_FILE,
            "term": courses[0].get('term', 'unknown') if courses else 'unknown',
            "count": len(sorted_buildings)
        },
        "blacklist": BUILDING_BLACKLIST,
        "buildings": sorted_buildings
    }

def parse_classrooms_by_building(courses):
    """Extract classrooms grouped by building."""
    classrooms_by_building = defaultdict(set)
    
    for course in courses:
        for schedule in course.get('schedules', []):
            classroom = schedule.get('classroom', '')
            
            # Parse from classroom format: ".CODE_ROOM"
            if classroom.startswith('.'):
                parts = classroom.split('_')
                if len(parts) >= 2:
                    building_code = parts[0][1:]
                    room_name = parts[1]
                    
                    # Skip blacklisted buildings
                    if building_code in BUILDING_BLACKLIST:
                        continue
                    
                    classrooms_by_building[building_code].add(room_name)
    
    # Convert sets to sorted lists
    result = {}
    for building in sorted(classrooms_by_building.keys()):
        result[building] = sorted(list(classrooms_by_building[building]))
    
    return {
        "_metadata": {
            "generated_at": datetime.now().isoformat(),
            "source_file": DATA_FILE,
            "term": courses[0].get('term', 'unknown') if courses else 'unknown',
            "building_count": len(result),
            "total_classrooms": sum(len(rooms) for rooms in result.values())
        },
        "classrooms": result
    }

def parse_ptrm_values(courses):
    """Extract unique ptrm values and descriptions."""
    ptrm_values = {}
    
    for course in courses:
        ptrm = course.get('ptrm', '')
        ptrmdesc = course.get('ptrmdesc', '')
        
        if ptrm and ptrm not in ptrm_values:
            ptrm_values[ptrm] = ptrmdesc
    
    # Sort by ptrm code
    sorted_ptrm = {k: ptrm_values[k] for k in sorted(ptrm_values.keys())}
    
    return {
        "_metadata": {
            "generated_at": datetime.now().isoformat(),
            "source_file": DATA_FILE,
            "term": courses[0].get('term', 'unknown') if courses else 'unknown',
            "count": len(sorted_ptrm)
        },
        "ptrm_values": sorted_ptrm
    }

def parse_campus_values(courses):
    """Extract unique campus values."""
    campus_values = set()
    
    for course in courses:
        campus = course.get('campus', '')
        if campus:
            campus_values.add(campus)
    
    sorted_campus = sorted(list(campus_values))
    
    return {
        "_metadata": {
            "generated_at": datetime.now().isoformat(),
            "source_file": DATA_FILE,
            "term": courses[0].get('term', 'unknown') if courses else 'unknown',
            "count": len(sorted_campus)
        },
        "campus_values": sorted_campus
    }

def parse_prefixes(courses):
    """Extract unique course prefixes (class codes like MATE, FISI, etc.)."""
    prefixes = set()
    
    for course in courses:
        prefix = course.get('class', '')
        if prefix:
            prefixes.add(prefix)
    
    sorted_prefixes = sorted(list(prefixes))
    
    return {
        "_metadata": {
            "generated_at": datetime.now().isoformat(),
            "source_file": DATA_FILE,
            "term": courses[0].get('term', 'unknown') if courses else 'unknown',
            "count": len(sorted_prefixes)
        },
        "prefixes": sorted_prefixes
    }

def parse_time_slots(courses):
    """Extract unique time slots (time_ini/time_fin combinations)."""
    time_slots = set()
    
    for course in courses:
        for schedule in course.get('schedules', []):
            time_ini = schedule.get('time_ini', '')
            time_fin = schedule.get('time_fin', '')
            
            if time_ini and time_fin:
                # Format as HH:MM - HH:MM
                formatted_ini = f"{time_ini[:2]}:{time_ini[2:]}"
                formatted_fin = f"{time_fin[:2]}:{time_fin[2:]}"
                time_slots.add(f"{formatted_ini} - {formatted_fin}")
    
    sorted_time_slots = sorted(list(time_slots))
    
    return {
        "_metadata": {
            "generated_at": datetime.now().isoformat(),
            "source_file": DATA_FILE,
            "term": courses[0].get('term', 'unknown') if courses else 'unknown',
            "count": len(sorted_time_slots)
        },
        "time_slots": sorted_time_slots
    }

def main():
    """Main execution function."""
    print("=" * 60)
    print("Course Data Enum Parser")
    print("=" * 60)
    print()
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Load course data
    print(f"Loading data from {DATA_FILE}...")
    courses = load_course_data()
    print(f"✓ Loaded {len(courses)} courses")
    print()
    
    # Parse and save each enum type
    print("Generating enum files...")
    print()
    
    save_json('buildings.json', parse_buildings(courses))
    save_json('classrooms_by_building.json', parse_classrooms_by_building(courses))
    save_json('ptrm_values.json', parse_ptrm_values(courses))
    save_json('campus_values.json', parse_campus_values(courses))
    save_json('prefixes.json', parse_prefixes(courses))
    save_json('time_slots.json', parse_time_slots(courses))
    
    print()
    print("=" * 60)
    print("✓ All enum files generated successfully!")
    print("=" * 60)

if __name__ == '__main__':
    main()
