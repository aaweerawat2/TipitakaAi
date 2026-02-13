#!/usr/bin/env python3
"""
Script 1: Extract Tripitaka Data
Download and extract Thai Tripitaka texts from GitHub repository
"""

import os
import json
import re
import requests
from pathlib import Path
from bs4 import BeautifulSoup
from tqdm import tqdm
from dataclasses import dataclass, asdict
from typing import List, Optional
import argparse

# ============================================
# Configuration
# ============================================

REPO_URL = "https://api.github.com/repos/jackchalat/tripitaka91/contents"
RAW_BASE_URL = "https://raw.githubusercontent.com/jackchalat/tripitaka91/main"

OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "database" / "raw"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Nikaya mapping
NIKAYA_MAP = {
    'dn': 'ทีฆนิกาย',
    'mn': 'มัชฌิมนิกาย',
    'sn': 'สังยุตตนิกาย',
    'an': 'อังคุตตรนิกาย',
    'kn': 'ขุททกนิกาย',
    'vi': 'วินัยปิฎก',
    'ab': 'อภิธรรมปิฎก',
}

PITAKA_MAP = {
    'dn': 'sutta',
    'mn': 'sutta',
    'sn': 'sutta',
    'an': 'sutta',
    'kn': 'sutta',
    'vi': 'vinaya',
    'ab': 'abhidhamma',
}

# ============================================
# Data Classes
# ============================================

@dataclass
class SuttaData:
    id: str
    sutta_id: str
    title_thai: str
    title_pali: str
    pitaka: str
    nikaya: str
    vagga: Optional[str]
    content_thai: str
    content_pali: Optional[str]
    source_file: str

# ============================================
# Helper Functions
# ============================================

def clean_thai_text(text: str) -> str:
    """Clean and normalize Thai text"""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    # Remove zero-width characters
    text = text.replace('\u200b', '')
    text = text.replace('\u200c', '')
    text = text.replace('\u200d', '')
    # Normalize Thai characters
    text = text.strip()
    return text

def extract_title_from_html(soup: BeautifulSoup) -> tuple[str, str]:
    """Extract Thai and Pali titles from HTML"""
    thai_title = ""
    pali_title = ""
    
    # Try to find title in header
    header = soup.find(['h1', 'h2', 'h3'])
    if header:
        title_text = header.get_text(strip=True)
        # Try to split Thai and Pali
        if '(' in title_text and ')' in title_text:
            parts = title_text.split('(')
            thai_title = parts[0].strip()
            pali_title = parts[1].replace(')', '').strip()
        else:
            thai_title = title_text
    
    return thai_title, pali_title

def extract_content_from_html(html_content: str) -> str:
    """Extract text content from HTML"""
    soup = BeautifulSoup(html_content, 'lxml')
    
    # Remove script and style elements
    for element in soup(['script', 'style', 'head', 'meta', 'link']):
        element.decompose()
    
    # Get text
    text = soup.get_text(separator='\n')
    
    # Clean up
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = '\n'.join(chunk for chunk in chunks if chunk)
    
    return clean_thai_text(text)

def parse_json_meta(json_content: str, file_path: str) -> dict:
    """Parse JSON metadata file"""
    try:
        data = json.loads(json_content)
        return {
            'sutta_id': data.get('sutta_id', ''),
            'title': data.get('title', ''),
            'title_pali': data.get('title_pali', ''),
            'vagga': data.get('vagga', ''),
            'nikaya': data.get('nikaya', ''),
        }
    except json.JSONDecodeError:
        return {}

def get_nikaya_from_path(path: str) -> str:
    """Determine nikaya from file path"""
    path_lower = path.lower()
    for code, name in NIKAYA_MAP.items():
        if code in path_lower:
            return name
    return 'ไม่ระบุ'

def get_pitaka_from_path(path: str) -> str:
    """Determine pitaka from file path"""
    path_lower = path.lower()
    for code, name in PITAKA_MAP.items():
        if code in path_lower:
            return name
    return 'sutta'

# ============================================
# Main Processing
# ============================================

def fetch_github_contents(path: str = "") -> List[dict]:
    """Fetch contents from GitHub API"""
    url = f"{REPO_URL}/{path}" if path else REPO_URL
    response = requests.get(url)
    response.raise_for_status()
    return response.json()

def download_file(raw_url: str) -> str:
    """Download file content from raw URL"""
    response = requests.get(raw_url)
    response.raise_for_status()
    return response.text

def process_tripitaka_repo():
    """Main function to process the Tripitaka repository"""
    all_suttas: List[SuttaData] = []
    
    print("Fetching repository structure...")
    
    try:
        # Get top-level directories (nikayas)
        top_level = fetch_github_contents()
        
        for item in tqdm(top_level, desc="Processing directories"):
            if item['type'] != 'dir':
                continue
            
            nikaya_code = item['name'].lower()
            if nikaya_code not in NIKAYA_MAP:
                continue
            
            nikaya = NIKAYA_MAP[nikaya_code]
            pitaka = PITAKA_MAP[nikaya_code]
            
            print(f"\nProcessing {nikaya}...")
            
            # Get files in this directory
            try:
                contents = fetch_github_contents(item['name'])
            except Exception as e:
                print(f"  Error fetching {item['name']}: {e}")
                continue
            
            # Group files by sutta (html + json pairs)
            sutta_files = {}
            for file in contents:
                if file['type'] != 'file':
                    continue
                
                name = file['name']
                base_name = re.sub(r'\.(html|json)$', '', name)
                
                if base_name not in sutta_files:
                    sutta_files[base_name] = {}
                
                if name.endswith('.html'):
                    sutta_files[base_name]['html'] = file['download_url']
                elif name.endswith('.json'):
                    sutta_files[base_name]['json'] = file['download_url']
            
            # Process each sutta
            for base_name, files in tqdm(sutta_files.items(), desc=f"  {nikaya_code}", leave=False):
                if 'html' not in files:
                    continue
                
                try:
                    # Download HTML content
                    html_content = download_file(files['html'])
                    
                    # Extract text
                    content = extract_content_from_html(html_content)
                    
                    if not content.strip():
                        continue
                    
                    # Try to get metadata from JSON
                    meta = {}
                    if 'json' in files:
                        try:
                            json_content = download_file(files['json'])
                            meta = parse_json_meta(json_content, files['json'])
                        except:
                            pass
                    
                    # Parse Thai and Pali titles
                    soup = BeautifulSoup(html_content, 'lxml')
                    thai_title, pali_title = extract_title_from_html(soup)
                    
                    # Use meta titles if available
                    if meta.get('title'):
                        thai_title = meta['title']
                    if meta.get('title_pali'):
                        pali_title = meta['title_pali']
                    
                    # Create sutta data
                    sutta = SuttaData(
                        id=f"{nikaya_code}_{base_name}",
                        sutta_id=meta.get('sutta_id', base_name),
                        title_thai=thai_title or base_name,
                        title_pali=pali_title,
                        pitaka=pitaka,
                        nikaya=nikaya,
                        vagga=meta.get('vagga'),
                        content_thai=content,
                        content_pali=None,
                        source_file=files['html'],
                    )
                    
                    all_suttas.append(sutta)
                    
                except Exception as e:
                    print(f"    Error processing {base_name}: {e}")
                    continue
        
        # Save all extracted data
        print(f"\nExtracted {len(all_suttas)} suttas")
        
        output_file = OUTPUT_DIR / "tripitaka_extracted.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump([asdict(s) for s in all_suttas], f, ensure_ascii=False, indent=2)
        
        print(f"Saved to {output_file}")
        
        # Print summary
        print("\nSummary:")
        pitaka_counts = {}
        for s in all_suttas:
            pitaka_counts[s.pitaka] = pitaka_counts.get(s.pitaka, 0) + 1
        for pitaka, count in pitaka_counts.items():
            print(f"  {pitaka}: {count} suttas")
        
        return all_suttas
        
    except Exception as e:
        print(f"Error: {e}")
        raise

# ============================================
# Entry Point
# ============================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Extract Thai Tripitaka data')
    parser.add_argument('--output', '-o', type=str, default=str(OUTPUT_DIR),
                        help='Output directory')
    args = parser.parse_args()
    
    OUTPUT_DIR = Path(args.output)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    process_tripitaka_repo()
