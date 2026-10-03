# ==============================================================================
# TEMPLATE — copy to the repos that publish Lumeed desktop releases:
#   Raymond0627/Automated-System/.github/workflows/on-release.yml   (QScan)
#   Raymond0627/Page-Counter/.github/workflows/on-release.yml       (Pcount)
#
# The ready-to-paste version lives at:
#   .github/workflows/on-release.yml.example
#
# Note the .example suffix: GitHub Actions executes every *.yml it finds in
# .github/workflows/, so this template is kept non-executable in the portal
# repo. Copy it into the target repo as "on-release.yml" to activate it.
#
# ---------------------------------------------------------------------------
# SETUP (once per repo)
# ---------------------------------------------------------------------------
# 1. Create a personal access token with `repo` scope:
#      https://github.com/settings/tokens
# 2. In the target repo: Settings -> Secrets and variables -> Actions
#    -> "New repository secret" -> name: PORTAL_TRIGGER_TOKEN -> paste the token
# 3. Copy .github/workflows/on-release.yml into that repo's
#    .github/workflows/ folder and commit it.
#
# ---------------------------------------------------------------------------
# RESULT
# ---------------------------------------------------------------------------
# Publishing a release fires this workflow, which pings the portal so it syncs
# the new version/size/hash/URL within about a minute and redeploys the site.
#
# Without it the portal still updates on its own every 6 hours via cron
# (Sync Releases & Deploy Portal), just with up to 6 hours of delay.
#
# Publish the release only AFTER the .exe has finished uploading.
# ==============================================================================
