#!/usr/bin/env python3
"""Package a device archive for AltStore, which supplies the installation signature.

Usage: python3 scripts/package-altstore.py HomeMOT.xcarchive HomeMOT.ipa
The archive must be a Release build with CODE_SIGNING_ALLOWED=NO.
EXPO_PUBLIC_CONVEX_URL must be the production URL the bundle was built with
(scripts/build-altstore.sh exports it from .env.production).
"""

import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

BUNDLE_ID = "uk.propertyhealthcheck.homemot"
# Entitlements a free Apple ID cannot sign, or that break re-signing.
UNSIGNABLE = ("carplay", "aps-environment", "get-task-allow", "application-groups")


def run(*args):
    return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT)


def main():
    archive, output = (Path(value).resolve() for value in sys.argv[1:])
    source = archive / "Products/Applications/HomeMOT.app"
    assert source.is_dir(), "Missing device archive application"
    assert not output.exists(), "Choose a new IPA path; existing artifacts are preserved"
    info = plistlib.loads((source / "Info.plist").read_bytes())
    assert info["CFBundleIdentifier"] == BUNDLE_ID
    assert info["CFBundleSupportedPlatforms"] == ["iPhoneOS"]
    assert info["DTPlatformName"] == "iphoneos", "Simulator apps cannot be sideloaded"
    assert re.fullmatch(r"\d{10}", info["CFBundleVersion"]), "Build number is not a YYYYMMDDHH stamp"
    assert not list(source.rglob("embedded.mobileprovision")), "Use an unsigned archive"
    assert not list(source.rglob("*.appex")), "App extensions need extra App IDs; check docs/altstore.md first"

    # The Hermes bundle keeps string literals as plain text, so the Convex URL
    # it will call can be read straight out of it.
    bundle = (source / "main.jsbundle").read_bytes()
    assert len(bundle) > 100_000, "Missing offline JS bundle"
    convex_url = os.environ["EXPO_PUBLIC_CONVEX_URL"]
    deployments = set(re.findall(rb"https://[a-z0-9-]+\.convex\.cloud", bundle))
    assert deployments == {convex_url.encode()}, f"Bundle calls {sorted(deployments)}, expected only {convex_url}"

    executable = source / info["CFBundleExecutable"]
    frameworks = [
        framework / framework.stem for framework in (source / "Frameworks").glob("*.framework")
    ] + list((source / "Frameworks").glob("*.dylib"))
    binaries = [executable] + frameworks
    checked = []
    for binary in binaries:
        assert run("xcrun", "lipo", "-archs", str(binary)).strip() == "arm64", f"Unexpected architecture: {binary.name}"
        loads = run("xcrun", "otool", "-l", str(binary))
        assert not re.search(r"cryptid\s+[1-9]", loads), "Encrypted binary cannot be resigned"
        assert re.search(r"platform\s+(2|IOS)\b", loads), f"Not an iOS device binary: {binary.name}"
        dependencies = run("xcrun", "otool", "-L", str(binary)).splitlines()[1:]
        for dependency in dependencies:
            library = dependency.strip().split(" (", 1)[0]
            if library.startswith("@rpath/"):
                assert (source / "Frameworks" / library.removeprefix("@rpath/")).is_file(), f"Missing embedded dependency: {library}"
            else:
                assert library.startswith(("/System/Library/", "/usr/lib/")), f"Unexpected dependency: {library}"
        checked.append(str(binary.relative_to(source)))

    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="altstore-package-", dir=output.parent) as temp:
        staging = Path(temp)
        app = staging / "Payload/HomeMOT.app"
        shutil.copytree(source, app, symlinks=True)
        # Ad-hoc signatures let us check the complete bundle's integrity here,
        # inside out: frameworks, then the app. AltStore replaces these with
        # the user's Apple signature and profiles.
        for binary in frameworks:
            target = app / binary.relative_to(source)
            if target.parent.suffix == ".framework":
                target = target.parent
            run("codesign", "--force", "--sign", "-", "--timestamp=none", str(target))
        run("codesign", "--force", "--sign", "-", "--timestamp=none", str(app))
        run("codesign", "--verify", "--deep", "--strict", "--verbose=2", str(app))
        entitlements = run("codesign", "-d", "--entitlements", ":-", str(app))
        for capability in UNSIGNABLE:
            assert capability not in entitlements, f"Unexpected signing entitlement: {capability}"
        run("ditto", "-c", "-k", "--norsrc", "--keepParent", str(staging / "Payload"), str(output))
        with zipfile.ZipFile(output) as ipa:
            assert ipa.testzip() is None, "IPA ZIP integrity failure"
            assert all(name.startswith("Payload/") for name in ipa.namelist())
            assert ipa.read("Payload/HomeMOT.app/main.jsbundle") == bundle
        extracted = staging / "verification"
        run("ditto", "-x", "-k", str(output), str(extracted))
        run("codesign", "--verify", "--deep", "--strict", "--verbose=2", str(extracted / "Payload/HomeMOT.app"))
        assert os.access(extracted / "Payload/HomeMOT.app" / info["CFBundleExecutable"], os.X_OK)

    report = {
        "ipa": output.name,
        "sha256": hashlib.file_digest(output.open("rb"), "sha256").hexdigest(),
        "bytes": output.stat().st_size,
        "bundleIdentifier": info["CFBundleIdentifier"],
        "version": info["CFBundleShortVersionString"],
        "build": info["CFBundleVersion"],
        "minimumIOS": info["MinimumOSVersion"],
        "platform": "iPhoneOS",
        "architecture": "arm64",
        "signature": "ad-hoc; AltStore must re-sign before installation",
        "embeddedBinariesVerified": checked,
        "appIdsPerInstall": 1,
        "standaloneJavaScriptBundle": True,
        "convexUrl": convex_url,
        "archiveAndExtractedIPASignaturesVerified": True,
        "physicalIPhoneInstallationVerified": False,
        # Provenance: the commit build-altstore.sh built from (clean tree only).
        # publish-altstore.sh puts it in the public release notes.
        "gitCommit": os.environ.get("HOMEMOT_GIT_SHA", "unknown"),
    }
    output.with_suffix(".verification.json").write_text(json.dumps(report, indent=2) + "\n")
    output.with_suffix(".sha256").write_text(f'{report["sha256"]}  {output.name}\n')
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main()
