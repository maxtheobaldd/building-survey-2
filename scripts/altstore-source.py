#!/usr/bin/env python3
"""Add a packaged IPA as the newest version in the Home MOT AltStore source.

Usage: python3 scripts/altstore-source.py IPA DOWNLOAD_URL SOURCE_JSON [NOTES_FILE]

SOURCE_JSON (the public source's source.json) is updated in place. AltStore
refuses to install an app whose bundle ID, version, build, entitlements or
privacy usage descriptions differ from its source entry, so all of those are
read from the IPA itself rather than typed by hand.
"""

from datetime import datetime, timezone
import json
from pathlib import Path
import plistlib
import subprocess
import sys
import tempfile

# AltStore ignores these when comparing entitlements; its re-signing adds them.
SIGNING_ENTITLEMENTS = {"application-identifier", "com.apple.developer.team-identifier"}


def read_app(ipa):
    with tempfile.TemporaryDirectory(prefix="altstore-source-") as temp:
        subprocess.run(["ditto", "-x", "-k", str(ipa), temp], check=True)
        apps = list(Path(temp, "Payload").glob("*.app"))
        assert len(apps) == 1, "IPA must contain exactly one app"
        info = plistlib.loads((apps[0] / "Info.plist").read_bytes())
        signed = subprocess.run(
            ["codesign", "-d", "--entitlements", ":-", str(apps[0])],
            capture_output=True, check=True,
        ).stdout.strip()
    entitlements = plistlib.loads(signed) if signed else {}
    return info, sorted(set(entitlements) - SIGNING_ENTITLEMENTS)


def main(ipa, download_url, source_path, notes_path=None):
    ipa, source_path = Path(ipa), Path(source_path)
    info, entitlements = read_app(ipa)
    source = json.loads(source_path.read_text())
    bundle_id = info["CFBundleIdentifier"]
    matches = [app for app in source["apps"] if app["bundleIdentifier"] == bundle_id]
    assert len(matches) == 1, f"source.json needs exactly one app entry for {bundle_id}"
    app = matches[0]

    version = {
        "version": info["CFBundleShortVersionString"],
        "buildVersion": info["CFBundleVersion"],
        "date": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "localizedDescription": Path(notes_path).read_text().strip() if notes_path else "",
        "downloadURL": download_url,
        "size": ipa.stat().st_size,
        "minOSVersion": info["MinimumOSVersion"],
    }
    released = {(v["version"], v["buildVersion"]) for v in app.get("versions", [])}
    assert (version["version"], version["buildVersion"]) not in released, (
        "This version and build are already in the source; bump the build number"
    )
    app["versions"] = [version] + app.get("versions", [])
    app["appPermissions"] = {
        "entitlements": entitlements,
        "privacy": {
            key: value
            for key, value in sorted(info.items())
            if key.startswith("NS") and key.endswith("UsageDescription")
        },
    }
    # Legacy single-version fields for SideStore and AltStore releases older
    # than 2.0, which do not read the versions array.
    app.update(
        version=version["version"],
        versionDate=version["date"],
        versionDescription=version["localizedDescription"],
        downloadURL=version["downloadURL"],
        size=version["size"],
    )
    source_path.write_text(json.dumps(source, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"bundleIdentifier": bundle_id, **version, "appPermissions": app["appPermissions"]}, indent=2))


if __name__ == "__main__":
    if len(sys.argv) not in (4, 5):
        sys.exit(__doc__)
    main(*sys.argv[1:])
