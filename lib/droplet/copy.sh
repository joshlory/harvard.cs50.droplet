cp ~/Projects/droplet/css/droplet.css droplet.c_ss
cp ~/Projects/droplet/dist/droplet-full.js .
cp ~/Projects/droplet/dist/worker.js .
uglify -s droplet-full.js -o droplet-full.min.js
uglify -s worker.js -o worker.min.js
mv droplet-full.min.js droplet-full.js
mv worker.min.js worker.js
