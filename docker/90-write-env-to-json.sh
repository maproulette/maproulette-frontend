#!/bin/sh

# Merge runtime VITE_* environment variables over the build-time defaults baked
# into env.json, so a single image can be reconfigured per-deployment.
jq -n 'env | with_entries(select(.key | startswith("VITE_")))' > /tmp/env.overrides.json
cp /srv/www/env.json /tmp/env.default.json
jq -s '.[0] * .[1]' /tmp/env.default.json /tmp/env.overrides.json > /srv/www/env.json
