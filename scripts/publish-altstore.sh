#!/bin/bash
# Publish a build-altstore.sh output to the public AltStore source: upload the
# IPA as a GitHub release, then list it in source.json once it downloads intact.
# Usage: scripts/publish-altstore.sh OUTPUT_DIR RELEASE_NOTES_FILE [--yes]
#   --yes  skip the "Publish … publicly?" confirmation (scripted runs only).
set -euo pipefail
cd "$(dirname "$0")/.."

usage="Usage: publish-altstore.sh OUTPUT_DIR RELEASE_NOTES_FILE [--yes]"
assume_yes=false
positional=()
for arg in "$@"; do
  case "$arg" in
    --yes) assume_yes=true ;;
    -*) echo "$usage" >&2; exit 2 ;;
    *) positional+=("$arg") ;;
  esac
done
build_dir="${positional[0]:?$usage}"
notes="${positional[1]:?$usage}"
repo="${HOMEMOT_ALTSTORE_REPO:-maxtheobaldd/home-mot-altstore}"
ipa="$build_dir/HomeMOT-AltStore.ipa"
report="$build_dir/HomeMOT-AltStore.verification.json"
report_field() {
  python3 -c 'import json, sys; print(json.load(open(sys.argv[1])).get(sys.argv[2], ""))' "$report" "$1"
}
release="$(report_field version)-$(report_field build)"
git_sha="$(report_field gitCommit)"
tag="v$release"
url="https://github.com/$repo/releases/download/$tag/HomeMOT-AltStore.ipa"

# The IPA must be the one build-altstore.sh verified, built from a known commit.
[[ "$(shasum -a 256 "$ipa" | cut -d' ' -f1)" == "$(report_field sha256)" ]] || {
  echo "$ipa does not match its verification report; rebuild it." >&2
  exit 1
}
[[ "$git_sha" =~ ^[0-9a-f]{40}$ ]] || {
  echo "The verification report has no git commit; rebuild with scripts/build-altstore.sh from a clean tree." >&2
  exit 1
}
# The code repo is private, so the commit in the public notes must at least
# exist there.
git cat-file -e "$git_sha^{commit}" 2>/dev/null && git branch -r --contains "$git_sha" | grep -q . || {
  echo "Commit ${git_sha:0:12} is not pushed; push it before publishing." >&2
  exit 1
}

if ! $assume_yes; then
  echo "Publishing Home MOT $release (built from ${git_sha:0:12}) to the PUBLIC AltStore source $repo."
  read -r -p "Publish $tag publicly? [y/N] " answer || answer=""
  [[ "$answer" =~ ^[Yy]$ ]] || { echo "Not published."; exit 1; }
fi

checkout="$(mktemp -d)"
release_notes="$(mktemp)"
trap 'rm -rf "$checkout" "$release_notes"' EXIT
gh repo clone "$repo" "$checkout" -- --depth 1 --quiet
# Fails on a reused build number or a missing app entry before anything ships.
python3 scripts/altstore-source.py "$ipa" "$url" "$checkout/source.json" "$notes" > /dev/null

# The public release notes carry the provenance; source.json keeps the
# tester-facing notes as written.
{ cat "$notes"; printf '\n\nBuilt from commit %s.\n' "$git_sha"; } > "$release_notes"
gh release create "$tag" "$ipa" --repo "$repo" --title "Home MOT $release" --notes-file "$release_notes"
expected="$(shasum -a 256 "$ipa" | cut -d' ' -f1)"
# A fresh asset can take a moment to be served; a failed download counts as a
# mismatch (never as a reason to stop before the cleanup below).
actual=""
for attempt in 1 2 3 4 5; do
  actual="$(curl -sfL "$url" | shasum -a 256 | cut -d' ' -f1)" || actual=""
  [[ "$actual" == "$expected" ]] && break
  sleep 3
done
if [[ "$actual" != "$expected" ]]; then
  echo "Release asset does not match $ipa; source.json left unchanged." >&2
  # Don't leave a public release whose download is not the verified IPA.
  if gh release delete "$tag" --repo "$repo" --yes --cleanup-tag; then
    echo "Deleted release and tag $tag." >&2
  else
    echo "Could not delete it. Clean up by hand:" >&2
    echo "  gh release delete $tag --repo $repo --yes --cleanup-tag" >&2
    echo "  git push https://github.com/$repo.git :refs/tags/$tag   # if the tag remains" >&2
  fi
  exit 1
fi

# The source repo is public: commit as the GitHub noreply address, not the
# personal email in the global git config.
noreply="$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"
git -C "$checkout" -c user.email="$noreply" commit -qam "Home MOT $release"
git -C "$checkout" push -q
echo "Published Home MOT $release (commit ${git_sha:0:12}). AltStore offers it on the next source refresh."
