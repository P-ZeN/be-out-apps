@echo off
echo Setting environment variables for mobile build...

set VITE_API_URL=https://server.be-out-app.dedibox2.philippezenone.net
set VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJsc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw
set VITE_NODE_ENV=production

echo VITE_API_URL: %VITE_API_URL%
echo VITE_MAPBOX_ACCESS_TOKEN: %VITE_MAPBOX_ACCESS_TOKEN:~0,20%...

npm run build -- --mode production
