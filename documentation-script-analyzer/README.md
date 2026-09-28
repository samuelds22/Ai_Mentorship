# AI-Powered Documentation–Script Consistency Analyzer

## 1. Project Overview

The AI-Powered Documentation–Script Consistency Analyzer is a Python-based tool that compares Linux on IBM Z build documentation with automated build scripts.

The system analyzes whether the documented build instructions are consistent with the commands, dependencies, and build procedures implemented in the automation scripts.

The project uses deterministic parsing and comparison techniques to identify differences and uses a local Large Language Model (LLM) through Ollama to generate concise explanations of the detected differences.

---

## 2. Problem Statement

Linux on IBM Z contains documentation describing how different software packages can be built and installed.

At the same time, automated build scripts are maintained separately.

Over time, documentation and automation can become inconsistent.

Manually comparing hundreds of packages and script versions is time-consuming.

This project automates the comparison process and generates structured reports showing potential discrepancies.

---

## 3. Objectives

The main objectives are:

- Collect Linux on IBM Z build scripts.
- Collect corresponding build documentation from the GitHub Wiki.
- Extract package versions from automated scripts.
- Extract dependencies and build commands.
- Extract dependencies and commands from documentation.
- Normalize differences in package and command naming.
- Compare documentation with automation.
- Identify discrepancies.
- Generate structured JSON reports.
- Use a local LLM to explain the detected differences.

---

## 4. Data Sources

### Documentation

Linux on IBM Z documentation:

https://github.com/linux-on-ibm-z/docs/wiki/

### Automated Scripts

Linux on IBM Z scripts:

https://github.com/linux-on-ibm-z/scripts

---

## 5. System Architecture

The system follows this workflow:

Documentation Wiki
        |
        v
   Wiki Fetcher
        |
        v
   Wiki Parser
        |
        |
        +-------------------+
                            |
                            v
                     Comparator
                            ^
                            |
        +-------------------+
        |
   Script Repository
        |
        v
   Script Parser
        |
        v
 Dependency / Command
    Normalization
        |
        v
 Comparison Results
        |
        +--------------------+
        |                    |
        v                    v
 Summary Report        Local LLM Analysis
                             |
                             v
                       AI Explanations

---

## 6. Project Structure

```text
documentation-script-analyzer/
│
├── data/
│   └── wiki/
│
├── scripts/
│   └── Linux on IBM Z build scripts
│
├── main.py
├── github_fetcher.py
├── script_parser.py
├── wiki_parser.py
├── dependency_normalizer.py
├── command_normalizer.py
├── comparator.py
├── summary_report.py
├── ai_analyzer.py
│
├── package_inventory.json
├── comparison_results.json
├── summary_report.json
├── ai_analysis.json
│
├── requirements.txt
└── README.md

7. Main Components
main.py

Scans the cloned scripts repository and creates an inventory of available packages, versions, and shell scripts.

Output:

package_inventory.json
github_fetcher.py

Downloads the corresponding Linux on IBM Z Wiki pages.

The downloaded pages are stored in:

data/wiki/
script_parser.py

Analyzes shell scripts and extracts:

Dependencies
Sudo commands
Build commands
Environment variables
wiki_parser.py

Analyzes documentation pages and extracts:

Documented versions
Dependencies
Build commands
Documentation headings
dependency_normalizer.py

Normalizes dependency names so that equivalent packages can be compared.

For example:

gcc-12
gcc-13

can be normalized to:

gcc

This reduces false differences caused by version-specific package names.

command_normalizer.py

Normalizes build commands before comparison.

For example:

sudo ./build.sh

and:

./build.sh

can be normalized into a comparable representation.

comparator.py

Compares the parsed documentation and automation data.

It checks:

Version differences
Dependency differences
Command differences

Possible statuses include:

consistent
partial_discrepancy
version_mismatch
not_documented
summary_report.py

Aggregates the comparison results at package level and generates:

summary_report.json
ai_analyzer.py

Uses a locally running Ollama model to explain comparison results.

The current model is:

llama3.2:latest

The AI receives the structured comparison evidence and produces a concise explanation.

The AI is instructed not to invent information that is not present in the comparison data.

8. Installation
Step 1: Install Python

Python 3.x is required.

Verify the installation:

python --version
Step 2: Install Python dependencies

Run:

pip install -r requirements.txt
Step 3: Clone the scripts repository

Clone:

https://github.com/linux-on-ibm-z/scripts.git

The repository should be located at:

documentation-script-analyzer/scripts/
Step 4: Install Ollama

Install Ollama and make sure it is running.

Verify the model:

ollama list

The project currently uses:

llama3.2:latest

If the model is not installed:

ollama pull llama3.2