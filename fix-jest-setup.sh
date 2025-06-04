#\!/bin/bash
# Temporary fix for jest.setup.js mock issue
cp jest.setup.js jest.setup.js.backup
sed 's/jest\.mock.*@radix-ui.*dropdown-menu.*$/\/\* COMMENTED OUT &/' jest.setup.js > jest.setup.js.tmp
# Comment out the entire block
awk '
/jest\.mock.*@radix-ui.*dropdown-menu/ { comment=1; print "/*"; print }
comment && /^\}\)\);/ { print; print "*/"; comment=0; next }
comment { print }
\!comment { print }
' jest.setup.js.backup > jest.setup.js.fixed
mv jest.setup.js.fixed jest.setup.js
EOF < /dev/null
