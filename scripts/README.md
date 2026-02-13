# Scripts Directory

This directory contains utility scripts for the Sobrecupo (AulaFinder) project.

## parse_enums.py

This script parses the course data JSON file and extracts reference data into separate enum files.

### Purpose

The script generates the following reference files in `src/Data/enums/`:

- **buildings.json** - All unique building codes and their human-readable names
- **classrooms_by_building.json** - All classrooms grouped by building
- **ptrm_values.json** - All unique ptrm (semester period) values and descriptions
- **campus_values.json** - All unique campus values
- **prefixes.json** - All unique course prefixes (MATE, FISI, etc.)
- **time_slots.json** - All unique time slots used in schedules

Each file includes metadata with:
- `generated_at` - ISO timestamp of when the file was generated
- `source_file` - Which data file was parsed
- `term` - The academic term
- `count` - Number of unique values found

### Usage

Run from the project root directory:

```bash
python3 scripts/parse_enums.py
```

### When to Run

Run this script whenever:
- The course data is updated for a new semester
- You need to regenerate reference files
- The building blacklist is modified

### Requirements

- Python 3.6 or higher
- No external dependencies (uses only standard library)

### Example Output

```
============================================================
Course Data Enum Parser
============================================================

Loading data from src/Data/courses202610.json...
✓ Loaded 5310 courses

Generating enum files...

✓ Generated src/Data/enums/buildings.json
✓ Generated src/Data/enums/classrooms_by_building.json
✓ Generated src/Data/enums/ptrm_values.json
✓ Generated src/Data/enums/campus_values.json
✓ Generated src/Data/enums/prefixes.json
✓ Generated src/Data/enums/time_slots.json

============================================================
✓ All enum files generated successfully!
============================================================
```
