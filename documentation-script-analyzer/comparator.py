import json
import os

from wiki_parser import parse_wiki
from dependency_normalizer import normalize_dependencies
from command_normalizer import normalize_commands


INVENTORY_FILE = "package_inventory.json"
WIKI_DIR = "data/wiki"
OUTPUT_FILE = "comparison_results.json"


# -----------------------------------
# Version comparison
# -----------------------------------

def compare_version(wiki_versions, script_version):

    wiki_versions = [
        str(version).strip()
        for version in wiki_versions
    ]

    script_version = str(
        script_version
    ).strip()

    if not wiki_versions:
        return {
            "status": "not_documented",
            "documented_versions": [],
            "script_version": script_version
        }

    if script_version in wiki_versions:
        return {
            "status": "match",
            "documented_versions": sorted(
                wiki_versions
            ),
            "script_version": script_version
        }

    return {
        "status": "mismatch",
        "documented_versions": sorted(
            wiki_versions
        ),
        "script_version": script_version
    }


# -----------------------------------
# Dependency comparison
# -----------------------------------

def compare_dependencies(
    wiki_dependencies,
    script_dependencies
):

    wiki_normalized = set(
        normalize_dependencies(
            wiki_dependencies
        )
    )

    script_normalized = set(
        normalize_dependencies(
            script_dependencies
        )
    )

    return {
        "documented_but_not_used": sorted(
            wiki_normalized -
            script_normalized
        ),

        "used_but_not_documented": sorted(
            script_normalized -
            wiki_normalized
        )
    }


# -----------------------------------
# Command comparison
# -----------------------------------

def compare_commands(
    wiki_commands,
    script_commands
):

    wiki_normalized = set(
        normalize_commands(
            wiki_commands
        )
    )

    script_normalized = set(
        normalize_commands(
            script_commands
        )
    )

    return {
        "documented_but_not_automated": sorted(
            wiki_normalized -
            script_normalized
        ),

        "automated_but_not_documented": sorted(
            script_normalized -
            wiki_normalized
        )
    }


# -----------------------------------
# Overall status
# -----------------------------------

def determine_status(
    version_comparison,
    dependency_comparison,
    command_comparison
):

    version_status = version_comparison["status"]

    if version_status == "not_documented":
        return "not_documented"

    if version_status == "mismatch":
        return "version_mismatch"

    dependency_problem = (
        bool(
            dependency_comparison[
                "documented_but_not_used"
            ]
        )
        or
        bool(
            dependency_comparison[
                "used_but_not_documented"
            ]
        )
    )

    command_problem = (
        bool(
            command_comparison[
                "documented_but_not_automated"
            ]
        )
        or
        bool(
            command_comparison[
                "automated_but_not_documented"
            ]
        )
    )

    if not dependency_problem and not command_problem:
        return "consistent"

    return "partial_discrepancy"


# -----------------------------------
# Compare one package
# -----------------------------------

def compare_package(
    package_data,
    wiki_data
):

    results = []

    package_name = package_data["package"]

    for version in package_data["versions"]:

        version_name = version["version"]

        for script in version["scripts"]:

            script_data = script["data"]

            # ---------------------------
            # Version
            # ---------------------------

            version_comparison = compare_version(
                wiki_data.get(
                    "versions",
                    []
                ),
                version_name
            )

            # ---------------------------
            # Dependencies
            # ---------------------------

            dependency_comparison = (
                compare_dependencies(
                    wiki_data.get(
                        "dependencies",
                        []
                    ),
                    script_data.get(
                        "dependencies",
                        []
                    )
                )
            )

            # ---------------------------
            # Commands
            # ---------------------------

            command_comparison = (
                compare_commands(
                    wiki_data.get(
                        "commands",
                        []
                    ),
                    script_data.get(
                        "build_commands",
                        []
                    )
                )
            )

            # ---------------------------
            # Overall status
            # ---------------------------

            overall_status = determine_status(
                version_comparison,
                dependency_comparison,
                command_comparison
            )

            # ---------------------------
            # Automation details
            # ---------------------------

            automation_details = {

                "environment_variables":
                    script_data.get(
                        "environment_variables",
                        []
                    ),

                "sudo_commands":
                    script_data.get(
                        "sudo_commands",
                        []
                    ),

                "build_commands":
                    script_data.get(
                        "build_commands",
                        []
                    )
            }

            # ---------------------------
            # Final result
            # ---------------------------

            results.append({

                "package":
                    package_name,

                "version":
                    version_name,

                "script":
                    script["file"],

                "wiki_source":
                    wiki_data.get(
                        "source",
                        ""
                    ),

                "overall_status":
                    overall_status,

                "version_comparison":
                    version_comparison,

                "discrepancies": {

                    "dependencies":
                        dependency_comparison,

                    "commands":
                        command_comparison
                },

                "automation_details":
                    automation_details
            })

    return results


# -----------------------------------
# Main
# -----------------------------------

def main():

    if not os.path.exists(
        INVENTORY_FILE
    ):

        print(
            "package_inventory.json not found."
        )

        return

    with open(
        INVENTORY_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        inventory = json.load(file)

    all_results = []

    wiki_pages_found = 0
    wiki_pages_missing = 0

    # -----------------------------------
    # Process packages
    # -----------------------------------

    for package in inventory:

        package_name = package["package"]

        wiki_file = os.path.join(
            WIKI_DIR,
            package_name.lower() + ".html"
        )

        if not os.path.exists(
            wiki_file
        ):

            print(
                "Wiki not found:",
                package_name
            )

            wiki_pages_missing += 1

            continue

        wiki_data = parse_wiki(
            wiki_file
        )

        wiki_pages_found += 1

        results = compare_package(
            package,
            wiki_data
        )

        all_results.extend(
            results
        )

    # -----------------------------------
    # Statistics
    # -----------------------------------

    status_statistics = {

        "consistent": 0,

        "partial_discrepancy": 0,

        "version_mismatch": 0,

        "not_documented": 0
    }

    for result in all_results:

        status = result[
            "overall_status"
        ]

        if status in status_statistics:

            status_statistics[
                status
            ] += 1

    # -----------------------------------
    # Final JSON
    # -----------------------------------

    output = {

        "project":
            "AI-Powered Documentation-Script Consistency Analyzer",

        "total_packages":
            len(inventory),

        "wiki_pages_found":
            wiki_pages_found,

        "wiki_pages_missing":
            wiki_pages_missing,

        "total_script_versions":
            len(all_results),

        "status_statistics":
            status_statistics,

        "comparisons":
            all_results
    }

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            output,
            file,
            indent=4
        )

    # -----------------------------------
    # Console output
    # -----------------------------------

    print()

    print(
        "Comparison report created:"
    )

    print(
        OUTPUT_FILE
    )

    print()

    print(
        "Packages:",
        len(inventory)
    )

    print(
        "Wiki pages found:",
        wiki_pages_found
    )

    print(
        "Wiki pages missing:",
        wiki_pages_missing
    )

    print(
        "Script versions compared:",
        len(all_results)
    )

    print()

    print(
        "OVERALL STATUS"
    )

    print(
        "Consistent:",
        status_statistics[
            "consistent"
        ]
    )

    print(
        "Partial discrepancies:",
        status_statistics[
            "partial_discrepancy"
        ]
    )

    print(
        "Version mismatches:",
        status_statistics[
            "version_mismatch"
        ]
    )

    print(
        "Not documented:",
        status_statistics[
            "not_documented"
        ]
    )


if __name__ == "__main__":

    main()