# wf_pixelmap

visualize air quality indexes on a more detailed map   

# Preparing terracotta api server

terracotta optimize-rasters *.tif -o data/

terracotta ingest data/PM25_{date}_3km.tif -o vietnam.sqlite

export TC_EXTRA_CMAP_FOLDER=$HOME/wf_pixelmap/colormaps

terracotta serve -d vietnam.sqlite

terracotta connect localhost:5000