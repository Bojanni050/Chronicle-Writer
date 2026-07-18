#!/bin/sh
set -e

# Caddyfile syntax has no conditionals, and the two cases need genuinely
# different directives (`tls internal` vs automatic Let's Encrypt), so the
# config is generated here instead of using a single static file.
if [ -n "$DOMAIN" ]; then
  cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
	reverse_proxy app:3000
}
EOF
else
  # No domain: bare-port listener + the internal issuer with on-demand
  # issuance, so Caddy generates a self-signed cert for whatever
  # hostname/IP you connect with, the first time you connect with it.
  # (`tls internal` alone only installs the root CA — it won't have a leaf
  # cert ready for an arbitrary incoming SNI without `on_demand`.)
  cat > /etc/caddy/Caddyfile <<'EOF'
:443 {
	tls internal {
		on_demand
	}
	reverse_proxy app:3000
}
EOF
fi

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
