# Comments Directory

This directory contains individual comment files submitted by different editors.

## File Format

Each file follows this naming pattern:
```
editor_{座號}_{timestamp}.csv
```

Example: `editor_7_1765332752564.csv`

## File Structure

Each CSV file contains:
```csv
座號,銳評
25,"comment for seat 25"
26,"comment for seat 26"
...
46,"comment for seat 46"
```

## How It Works

1. **Editors submit comments**: Each editor uses comment-editor.html to create their comment file
2. **Multiple files allowed**: Different editors can submit different files without conflicts
3. **Automatic merging**: The index.html loads all files listed in manifest.json and merges comments
4. **No overwrites**: Each file is unique, preventing conflicts between concurrent editors

## Adding a New Comment File

1. Edit `manifest.json` and add your filename to the `comment_files` array:
   ```json
   {
     "comment_files": [
       "editor_7_1765332752564.csv",
       "editor_10_1765335123456.csv"
     ]
   }
   ```
2. Add your CSV file to this directory
3. Commit both files to the repository

## Comment Merging

When multiple editors comment on the same seat number:
- Comments are concatenated with " | " separator
- Example: "Comment from editor 1 | Comment from editor 2"
